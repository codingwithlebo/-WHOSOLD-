# Malebo Nkuna — Delivery Checklist

**Role:** QA/Test Lead; Double-or-Pass UI owner
**GitHub:** [@codingwithlebo](https://github.com/codingwithlebo)
**Boundary:** Own the test plan, round/choice UI, E2E and regression. Mandla
owns database tests and all database files; convert DB expectations into
scenarios and coordinate their implementation with him.

## Coverage status — 20 Nov 2026

Owethu is covering Malebo's currently unblocked QA follow-through to push
project readiness while the team is unavailable. Malebo remains the QA owner;
Mandla retains database ownership.

PR #61 merged the gameplay implementation, but it is not Malebo's QA sign-off.
Hosted migration application is not yet confirmed, so network/privacy
inspection and the two-user live regression are pending. PR #65 adds local
Playwright coverage for public routes and a seeded two-member group-to-round
flow; it does not replace hosted migration confirmation or live QA.

Issue #25 was reopened because PR #34 documented Phase 1 acceptance cases but
did not complete the live QA. It was later closed after PR #56 recorded local
auth/group results and responsive smoke observations in the
[test plan](../TEST_PLAN.md); the remaining hosted checks are still outstanding.
Malebo reports that hosted smoke testing has started: she has Supabase access
and has loaded the deployed dashboard and group pages. This confirms initial
access only; the remaining live acceptance checks are still outstanding.
Screenshots are recorded in the [project README](../../README.md). Keyboard-only
traversal is also still outstanding.

| Phase | Your deliverables |
|---|---|
| 1 — Accounts | [ ] Define auth acceptance and failure cases in the test plan. [ ] Verify sign-up, validation, session restore, protected routes and sign-out. [ ] Report reproducible defects with expected/actual results. |
| 2 — Groups | [ ] Define join/create/lock scenarios, including invalid code, capacity and non-member access. [ ] Test UI validation against fixtures while the RPC is in progress. [ ] Add independent E2E coverage in the QA-owned test area. |
| 3 — Wishlist | [ ] Specify currency parsing, rounding, empty/invalid input and total-update cases. [ ] Verify item ownership and edit-lock behavior with Mandla. [ ] Cover the user flow without editing migration files. |
| 4 — Rounds | [ ] Implement the Double/Pass and round-status UI in `src/features/round/` using the [round UX contract](../round-ux-contract.md). [ ] Test confirmation, one submission, locked state, countdown and private-choice messaging. [ ] Verify member/leader flows and schedule boundaries. |
| 5 — Quiz | [ ] Define anti-cheat, timeout, reload/resume, no-score/no-answer leakage and accessibility scenarios. [ ] Run network inspection on the integrated quiz. [ ] Put E2E tests in the QA-owned area; send database test expectations to Mandla. |
| 6 — Resolution | [ ] Provide an outcome truth table for all pass/fail/unanswered combinations. [ ] Verify pre-release hiding and post-release reveal with Mandla/Ntokozo. [ ] Regression-test idempotence and named breakdown. |
| 7 — MVP polish | [ ] Own the two-user Playwright happy path and release regression. [ ] Run keyboard, mobile-width, accessibility and manual live smoke checks. [ ] Publish commands/results and block release on unresolved critical/high defects. |
| 8 — Stabilization | [ ] Triage incoming defects and assign severity/reproduction steps. [ ] Verify each fix without changing unrelated acceptance criteria. [ ] Keep critical/high defects visible until proven fixed. |
| 9 — Operations | [ ] Maintain the regression checklist from real feedback. [ ] Turn every verified issue into a test or a documented reason it cannot be automated. [ ] Report quality trends to the team. |
| 10 — Next-increment discovery | [ ] Draft test risks and acceptance scenarios for Owethu's proposed scope. [ ] Identify privacy, timing and accessibility implications. [ ] Do not assume unapproved behavior; ask for explicit acceptance rules. |

**Phase hand-off:** provide test cases, repro steps, exact test commands/results,
and release risks. A passing test run is evidence only for the behavior it
actually covers.
