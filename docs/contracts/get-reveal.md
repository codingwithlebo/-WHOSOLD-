# `get_reveal` API contract

**Status:** Proposed by Ntokozo for agreement with Mandla. Not implemented yet.
**Owner:** Mandla Sikhosana (database). **Consumer:** Ntokozo Maselela (reveal
UI, `src/features/reveal/`). **QA:** Malebo Nkuna.
**Scope:** Phase 6, PRD FR-9, FR-10, FR-12; [implementation plan](../IMPLEMENTATION_PLAN.md)
§5 and Q4.

This fixes the shape of the reveal call so the UI and QA can build against it
before the rounds, quiz and resolution migrations exist. The UI is built and
tested against this shape (`src/features/reveal/revealService.ts`); its route
is not registered until the function is merged and applied, so production
never shows sample results.

## Call

```ts
const { data, error } = await supabase.rpc('get_reveal', {
  target_round_id: roundId,
})
```

| Input             | Type   | Notes                                                                                     |
| ----------------- | ------ | ----------------------------------------------------------------------------------------- |
| `target_round_id` | `uuid` | Named like `get_history(target_group_id)` to avoid clashing with `round_id` columns |

`authenticated` only; `anon` has no access.

## Behaviour

1. The caller must be a member of the round's group, otherwise `P0001`
   "This round could not be found or you are not a member."
2. If `now() < release_at` (server clock): `P0001` "Results are not released
   yet." **No outcome, fund or member data is returned before release.** The
   UI already knows `release_at` from `get_round_status` and shows a countdown.
3. If the release time has passed and the round is not resolved yet (pg_cron
   late or down), the function calls `resolve_round(target_round_id)` first.
   `resolve_round` is idempotent, so calling it again gives the same result.
4. Otherwise it returns exactly one row.

## Response

`setof` one row (an array with one element, like other RPCs).

| Field                 | SQL type      | TS type                           | Meaning                                                          |
| --------------------- | ------------- | --------------------------------- | ---------------------------------------------------------------- |
| `round_id`            | `uuid`        | `string`                          | The round                                                        |
| `outcome`             | `text`        | `'intact' \| 'doubled' \| 'lost'` | Same values as `get_history`; UI shows `doubled` as **Grown**    |
| `starting_fund_cents` | `bigint`      | `number`                          | Fund snapshot when the round started                             |
| `final_fund_cents`    | `bigint`      | `number`                          | Same for `intact`, ×2 for `doubled`, 0 for `lost`                |
| `release_at`          | `timestamptz` | `string` (ISO 8601)               | Scheduled release time                                           |
| `members`             | `jsonb`       | array, see below                  | Every group member in the round, including non-responders        |

Each `members` element:

| Field          | TS type                                      | Meaning                                                    |
| -------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `user_id`      | `string`                                     | Member's profile id                                        |
| `display_name` | `string`                                     | From `profiles`                                            |
| `result`       | `'passed' \| 'doubled_won' \| 'doubled_lost'` | Non-responders are `passed`; an unfinished quiz is `doubled_lost` |

Never returned: quiz questions, answers, per-question results or scores. The
named breakdown (Q4) is the only per-member detail the product rules allow.

## Open questions for Mandla

- Confirm the error messages above are safe to show as-is (same pattern as
  `create_group` / `get_history`).
- Confirm `members` as `jsonb` (simplest for one row) rather than a second
  `setof` RPC.

## Integration checklist (Ntokozo, after the function is applied)

- [ ] `npm run db:types` output merged (Mandla) and `RevealRpcRow` matches it.
- [ ] Register `groups/:groupId/rounds/:roundId/reveal` inside `ProtectedRoute`
      and replace the fixed `unavailable` state in `RevealRoute` with
      `loadReveal(roundId, (args) => supabase.rpc('get_reveal', args))`.
- [ ] "Results are not released yet." maps to the `waiting` state using
      `release_at` from `get_round_status`; `onReleaseDue` refetches.
- [ ] Malebo verifies on a preview: before release the network tab shows no
      outcome; after release all three outcomes render correctly.
