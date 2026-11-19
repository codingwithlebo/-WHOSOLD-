# Owethu Jezile — Delivery Checklist

**Role:** Product Owner; groups/wishlist UI owner
**GitHub:** [@Owethudev](https://github.com/Owethudev)
**Boundary:** Own product decisions, shared UI and the groups/wishlist UI.
Mandla owns all database files. Build UI against the agreed contract and
fixtures while database work proceeds separately.

| Phase | Your deliverables |
|---|---|
| 1 — Accounts | [ ] Deliver/maintain shared components and approved screen patterns. [ ] Review sign-up/profile wording and UX while Mandla implements auth. [ ] Record any product decisions needed for account behavior in the issue. |
| 2 — Groups | [ ] Implement dashboard, create/join forms, group details, join-code copy and leader lock UI in `src/features/groups/`. [ ] Integrate with Mandla's merged Supabase contract and test the flow. [ ] Accept the flow against the PRD. |
| 3 — Wishlist | [ ] Implement wishlist add/edit/delete and fund-total UI in `src/features/wishlist/`. [ ] Integrate with Mandla's merged Supabase contract; keep currency cents-based. [ ] Verify virtual-fund language and accept the feature. |
| 4 — Rounds | [x] Review choice wording, privacy expectations, timing and confirmation copy in the [round UX contract](../round-ux-contract.md). [x] Approve the UX contract before Malebo integrates round UI. [x] Hand off the contract; do not edit `src/features/round/` or database files. |
| 5 — Quiz | [x] Review and approve question wording/content for the agreed question bank. [x] Confirm rules copy (attempts, timer, pass mark and hidden results) matches the PRD. [x] Send content changes through the issue, not a DB edit. |
| 6 — Resolution | [x] Sign off outcome names, fund display, reveal breakdown and virtual-fund messaging against the PRD. [x] Confirm default game rules before release. |
| 7 — MVP polish | [ ] Keep round-history UI hidden until resolved rounds are available; resume integration after Friday. [ ] Review group/wishlist journeys and accessibility feedback. [ ] Accept completed requirements or file a scoped follow-up issue. |
| 8 — Stabilization | [ ] Review reported usability defects and confirm severity/expected behavior. [ ] Fix UI defects in your owned folders without adding features. [ ] Close product questions that block acceptance. |
| 9 — Operations | [x] Collect and prioritize the current hosted groups/wishlist feedback. [x] Record accepted findings with problem, priority and measurable acceptance criteria. [x] Keep unapproved ideas out of the release scope. |
| 10 — Next-increment discovery | [ ] Choose and document the next product increment and its scope. [ ] Resolve outstanding rules before implementation; Draw mode stays deferred unless explicitly approved. [ ] Split approved scope into independent issues with contracts and acceptance criteria. |

## Phase 9 — feedback triage (19 Nov 2026)

Reviewed the hosted groups/wishlist feedback recorded on [PR #40](https://github.com/codingwithlebo/-WHOSOLD-/pull/40). Priorities below are relative to the current user journey.

| Priority | Feedback and acceptance criteria | Disposition |
|---|---|---|
| P1 | A database validation failure must show its player-friendly message; entering `ZZZZZZ` must show “No group found with that code.” | Implemented in PR #40 (`caf8db0`); hosted re-test and review are pending. |
| P2 | A malformed group URL such as `/groups/abc` must show not-found and must not offer a futile retry. | Implemented in PR #40 (`0c7b332`). |
| P3 | The member list should identify the leader, for example “Alice · leader.” | Implemented in the dashboard and group detail in PR #40 (`0c7b332`). |

Round history is deferred, not a new defect: the UI stays hidden until resolved-round data and the `get_history` contract are available. No further feature scope was accepted from this review; re-triage after the reviewer’s hosted retest or new user feedback.

**Phase hand-off:** provide screen states, copy, decision records and
acceptance evidence in the issue. Do not make Mandla or another owner infer
product rules from an unfinished UI.
