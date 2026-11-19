# `get_history` API contract

**Status:** Proposed for agreement on
[#43](https://github.com/codingwithlebo/-WHOSOLD-/issues/43). Not implemented
yet.
**Owner:** Mandla Sikhosana (database). **Consumers:** Owethu (UI,
[#45](https://github.com/codingwithlebo/-WHOSOLD-/issues/45)), Malebo (QA,
[#46](https://github.com/codingwithlebo/-WHOSOLD-/issues/46)).
**Scope:** [Phase 10 discovery](../PHASE_10_DISCOVERY.md), PRD FR-14.

This document fixes the shape of the round-history call so the UI and QA can
build against it now. The database function itself
([#44](https://github.com/codingwithlebo/-WHOSOLD-/issues/44)) is **blocked**
until rounds (Phase 4) and round resolution and release (Phase 6) exist. Until
then the history route stays hidden and nothing in production returns sample
data.

## Call

```ts
const { data, error } = await supabase.rpc('get_history', {
  target_group_id: groupId,
})
```

| Input             | Type   | Notes                                                                                                                                                                                                                                         |
| ----------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target_group_id` | `uuid` | The group to read. Named like `lock_group(target_group_id)`; a parameter called `group_id` would clash with the `group_id` columns inside the function. |

Only signed-in players can call it (`authenticated`); logged-out visitors
(`anon`) have no access at all.

## Response

An array of rows (`setof`), **newest first**: `resolved_at` descending, and if
two rounds share a `resolved_at`, then `id` descending, so the order is always
the same. No pagination: a group plays at most one round a week, so the list
stays short.

| Field                 | SQL type      | JSON / TS type                         | Never null | Meaning                                                                                       |
| --------------------- | ------------- | -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `id`                  | `uuid`        | `string`                               | yes        | The round's id                                                                                |
| `resolved_at`         | `timestamptz` | `string` (ISO 8601, UTC)               | yes        | When the server resolved the round. The UI shows it as a date in SAST                         |
| `outcome`             | `text`        | `'intact' \| 'doubled' \| 'lost'`      | yes        | `intact`: everyone passed. `doubled`: at least one win, no losses. `lost`: any quiz loss      |
| `starting_fund_cents` | `bigint`      | `number`                               | yes        | The fund (wishlist total) locked in when the round started                                    |
| `final_fund_cents`    | `bigint`      | `number`                               | yes        | The fund after resolution: same as starting for `intact`, doubled for `doubled`, 0 for `lost` |

Notes for the UI:

- `outcome` uses the values the existing `RoundOutcome` type in
  `src/features/history/RoundHistoryPage.tsx` already expects, so no UI type
  changes are needed. The UI shows `doubled` as **Grown**, matching the PRD's
  "intact, grown or lost".
- The mapping to the existing view model is one-to-one:
  `resolved_at → resolvedAt`, `starting_fund_cents → startingFundCents`,
  `final_fund_cents → finalFundCents`.
- Money is in cents, like the wishlist. The largest possible fund (50 items at
  the R10 million item cap, doubled) is 10<sup>11</sup> cents, well inside the
  range a JavaScript `number` holds exactly.

## Which rounds are returned

A round is included only when **all** of these are true:

1. It belongs to `target_group_id`.
2. It has been resolved (it has an outcome and `resolved_at`).
3. Its release time has passed (`release_at <= now()` on the server clock).
   Before release day, a resolved round is invisible, so nobody can learn the
   result early, including from the network inspector.

Rounds that are still open, waiting for resolution or waiting for release are
never returned.

The response never includes choices, quiz answers, quiz scores or who chose
what. A later "reveal breakdown" belongs to `get_reveal` (Phase 6), not here.

## Errors

Errors use the same pattern as `create_group`, `join_group` and `lock_group`:
a `P0001` error whose `message` is safe to show to the player as it is.

| Situation                                      | Result                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| Member of a group with no released rounds yet  | `data: []` (not an error). The UI shows "No resolved rounds for this group yet." |
| Not signed in (`anon`)                         | Permission denied (`42501`); the function is not granted to `anon`        |
| Signed in, but not a member of the group       | `P0001` "This group could not be found or you are not a member."          |
| The group does not exist                       | The same `P0001` message, so the call never reveals which groups exist    |
| `target_group_id` is not a valid UUID          | `22P02` from PostgREST; the UI should treat a bad id as not found         |

Non-members get an error rather than an empty list, so the UI can tell
"you are not allowed to see this" apart from "no rounds yet". The message
matches the group page's not-found message.

## Fixture

A representative response for UI and QA tests. These are test data only; do
not ship them as production data.

```json
[
  {
    "id": "c3c3c3c3-0000-4000-8000-000000000003",
    "resolved_at": "2026-12-11T16:00:00Z",
    "outcome": "lost",
    "starting_fund_cents": 5499800,
    "final_fund_cents": 0
  },
  {
    "id": "c3c3c3c3-0000-4000-8000-000000000002",
    "resolved_at": "2026-12-04T16:00:00Z",
    "outcome": "doubled",
    "starting_fund_cents": 2749900,
    "final_fund_cents": 5499800
  },
  {
    "id": "c3c3c3c3-0000-4000-8000-000000000001",
    "resolved_at": "2026-11-27T16:00:00Z",
    "outcome": "intact",
    "starting_fund_cents": 2749900,
    "final_fund_cents": 2749900
  }
]
```

The fixture covers all three outcomes, newest-first order and a fund that grew
then was lost. The empty case is `[]`.

## What the implementation will need (#44)

The function will read from the Phase 4/6 rounds table. These source columns
are the expected minimum, and their final names are decided in the Phase 4
migration, not here:

- `group_id`, `outcome`, `resolved_at`, `release_at`, `starting_fund_cents`,
  `final_fund_cents`

The function will be `security definer`, `stable`, `set search_path = ''`,
check membership with the existing `private.is_group_member`, order by
`resolved_at desc, id desc`, and be granted to `authenticated` only. Its pgTAP
tests must cover: a member, an outsider, an anonymous caller, unresolved and
unreleased rounds, an empty history and newest-first order.

## Changing this contract

Changes after agreement go through a pull request that updates this file, with
Owethu and Malebo as reviewers. Adding a field is safe; renaming or removing
one, or changing an `outcome` value, needs the UI (#45) and QA (#46) updated in
the same release.
