# Phase 10 Discovery — Group Round History

**Status:** Draft for Product Owner and team review; not approved for implementation  
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

Implementation remains blocked on the round/resolution data and `get_history`
contract. Discovery and scope review can proceed now. Draw mode, notifications,
editing past rounds and unreleased member choices/results are out of scope.

## Decision gate

This is a proposal, not product approval. Implementation starts only after
the Product Owner and team accept the scope, the backend contract is available,
and the work is split into independently testable issues.
