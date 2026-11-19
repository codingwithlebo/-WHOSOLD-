# Phase 10 Discovery — Group Round History

**Status:** Product Owner accepted; implementation is blocked on the backend contract and round/resolution data
**Product Owner:** Owethu Jezile  
**Date:** 19 November 2026  
**Related:** PRD FR-14; Owethu checklist issue #24

## Problem

After a group's round has resolved and its results are released, members have
no in-app way to revisit prior outcomes. The history screen already has a
presentation model, but its route is intentionally unavailable until
server-backed resolved-round data exists.

## Candidate increment

Let a signed-in group member review that group's resolved round history. This
is the existing **Should** requirement FR-14, not a change to the MVP's Must
acceptance criteria. This proposal adds no new game rules.

## Scope

- Show each eligible round's resolution date, outcome (Intact, Grown or Lost),
  starting virtual fund and final virtual fund.
- Show only resolved rounds whose release time has passed, newest first.
- Enforce membership on the server; a member of one group cannot read another
  group's history.
- Provide loading, empty and readable error states. Do not serve fixture or
  sample history from the live route.
- Keep the history link and route unavailable until the data contract is
  implemented and connected.

## Acceptance criteria

1. A group member sees only that group's released, resolved rounds.
2. Active, unresolved and unreleased rounds are not returned or rendered.
3. Each row shows the date, outcome, starting fund and final fund in Rand.
4. A group with no eligible rounds shows a clear empty state.
5. An outsider cannot retrieve history, including by requesting the RPC
   directly.
6. History does not expose choices or quiz results beyond the released
   outcome information already permitted by the product rules.
7. Loading and error states are understandable and keyboard/screen-reader
   usable at 360px and wider.

## Dependencies and ownership

- **Mandla:** publish and implement the `get_history(group_id)` contract after
  the round and resolution data model is available. It must return only
  released, resolved records for an authorized member, with the fields the
  existing UI needs: `id`, `resolved_at`, `outcome`, `starting_fund_cents`
  and `final_fund_cents`.
- **Owethu:** accept or revise this product scope, then integrate the
  approved contract in `src/features/history/`.
- **Malebo:** cover member/outsider access, unresolved-round exclusion,
  empty-state and release-time scenarios.
- **Ntokozo:** verify the connected flow on a Supabase-enabled preview.

## Work items

- [#43](https://github.com/codingwithlebo/-WHOSOLD-/issues/43): agree and
  publish the `get_history` API contract. This can proceed now, before the
  round/resolution tables exist.
- [#44](https://github.com/codingwithlebo/-WHOSOLD-/issues/44): implement the
  RPC after the Phase 4 round schema and Phase 6 resolution/release data are
  available. This item is explicitly blocked until then.
- [#45](https://github.com/codingwithlebo/-WHOSOLD-/issues/45): connect the
  existing history UI to live data; do not duplicate the UI already delivered
  by [#31](https://github.com/codingwithlebo/-WHOSOLD-/issues/31).
- [#46](https://github.com/codingwithlebo/-WHOSOLD-/issues/46): define and
  verify the history acceptance scenarios. Preview setup remains tracked in
  [#26](https://github.com/codingwithlebo/-WHOSOLD-/issues/26), so no duplicate
  DevOps issue was created.

The scope is accepted, but live history implementation remains blocked on the
round/resolution data and `get_history` contract. Contract definition and QA
planning can proceed now. Draw mode, notifications, editing past rounds and
unreleased member choices/results are out of scope.

## Decision gate

The Product Owner accepted this scope on 19 November 2026. Implementation starts
only after the backend contract and round/resolution data are available; the
work is now split into independently testable issues above. Team review may
refine implementation details without reopening the accepted product scope.
