# Mandla Sikhosana — Delivery Checklist

**Role:** Tech Lead and sole database owner
**GitHub:** [@mandlenkosii](https://github.com/mandlenkosii)
**Authority:** Own every Supabase schema, migration, RLS policy, RPC, database
test, seed/data migration, and generated database type. Other members send
contract requests; they do not edit database files.

For every phase, work from its issue and branch. Keep DB and UI changes in
separate, reviewable commits when that lets another owner proceed in parallel.
Publish the RPC/type contract early so UI and QA can use mocks without waiting
for a migration to merge.

| Phase | Your deliverables |
|---|---|
| 1 — Accounts | [x] Own `profiles` schema, sign-up trigger, RLS and DB tests. [x] Implement Supabase auth UI/session flow in `src/features/auth/`. [x] Generate types and verify profile/session behavior. |
| 2 — Groups | [x] Write the groups/members migration, policies, `create_group`, `join_group`, and `lock_group`. [x] Publish the contract before UI integration. [x] Test unique codes, membership, capacity, lock and non-member denial. |
| 3 — Wishlist | [x] Write wishlist schema/RLS. [ ] Enforce the open-round edit restriction (needs Phase 4 rounds). [x] Define cents-based read/write contract. [x] Test membership and item ownership rules. |
| 4 — Rounds | [ ] Write rounds/choices schema, RLS, `start_round`, `submit_choice`, and `get_round_status`. [ ] Keep other members' choices private. [ ] Test timing, one-choice-only, group lock and fund constraints. |
| 5 — Quiz | [ ] Own quiz tables, RLS, server-side timing/scoring RPCs, and database tests. [ ] Load the approved question bank through a migration. [ ] Implement the quiz UI in its owned feature folder. [ ] Ensure responses never expose answer keys, correctness or score before release. |
| 6 — Resolution | [ ] Write `resolve_round`, `resolve_due_rounds`, and `get_reveal` database logic. [ ] Test every outcome and idempotence. [ ] Coordinate the function contract and timing with Ntokozo; do not own his deployment schedule/UI files. |
| 7 — MVP polish | [ ] Resolve schema/API integration defects. [ ] Regenerate and commit database types after final migrations. [ ] Confirm migration reset and DB tests pass; review DB PRs and apply approved migrations after merge. |
| 8 — Stabilization | [ ] Triage database defects with Malebo. [ ] Fix only accepted DB issues in new migrations. [ ] Verify RLS/RPC behavior against the regression cases. |
| 9 — Operations | [ ] Review database errors/query health with the team. [ ] Document migration and restore/recovery steps with Ntokozo. [ ] Make no dashboard-only schema edits; keep every change in a reviewed migration. |
| 10 — Next-increment discovery | [ ] Estimate schema/API impact and migration risk for Owethu's proposal. [ ] Publish a contract and implementation estimate. [ ] Do not implement schema for unapproved scope. |

**Phase hand-off:** attach migration names, RPC inputs/outputs, type changes,
test commands/results, and any remaining risk to the issue/PR. The next owner
can integrate against that contract; they should not need to inspect a private
environment or wait for an undocumented decision.
