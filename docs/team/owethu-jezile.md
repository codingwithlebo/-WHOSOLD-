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
| 5 — Quiz | [ ] Review and approve question wording/content for the agreed question bank. [ ] Confirm rules copy (attempts, timer, pass mark and hidden results) matches the PRD. [ ] Send content changes through the issue, not a DB edit. |
| 6 — Resolution | [ ] Sign off outcome names, fund display, reveal breakdown and virtual-fund messaging against the PRD. [ ] Confirm default game rules before release. |
| 7 — MVP polish | [ ] Keep round-history UI hidden until resolved rounds are available; resume integration after Friday. [ ] Review group/wishlist journeys and accessibility feedback. [ ] Accept completed requirements or file a scoped follow-up issue. |
| 8 — Stabilization | [ ] Review reported usability defects and confirm severity/expected behavior. [ ] Fix UI defects in your owned folders without adding features. [ ] Close product questions that block acceptance. |
| 9 — Operations | [ ] Collect team/user feedback and prioritize the backlog. [ ] Give every accepted request a problem statement, priority and measurable acceptance criteria. [ ] Keep unapproved ideas out of the release scope. |
| 10 — Next-increment discovery | [ ] Choose and document the next product increment and its scope. [ ] Resolve outstanding rules before implementation; Draw mode stays deferred unless explicitly approved. [ ] Split approved scope into independent issues with contracts and acceptance criteria. |

**Phase hand-off:** provide screen states, copy, decision records and
acceptance evidence in the issue. Do not make Mandla or another owner infer
product rules from an unfinished UI.
