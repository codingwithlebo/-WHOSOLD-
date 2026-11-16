# Ntokozo Maselela — Delivery Checklist

**Role:** DevOps/Release; reveal UI and release operations
**GitHub:** [@shaunmaselela25](https://github.com/shaunmaselela25)
**Boundary:** Own CI/deployment, release documentation, scheduling operations
and reveal UI. Mandla owns the database functions and migrations; never make
dashboard-only database changes.

| Phase | Your deliverables |
|---|---|
| 1 — Accounts | [ ] Keep CI checks and preview environments usable. [ ] Document environment-variable setup without storing secrets in source. [ ] Verify auth pages can be tested on a preview deployment. |
| 2 — Groups | [ ] Verify preview deployment and route refresh behavior for group pages. [ ] Record deployment or environment issues separately from feature bugs. [ ] Use non-production test accounts/data. |
| 3 — Wishlist | [ ] Verify deployed build and preview configuration for the wishlist milestone. [ ] Help Malebo reproduce deployment-only issues. [ ] Do not add credentials or hosted data to the repository. |
| 4 — Rounds | [ ] Confirm the hosting/runtime assumptions for round timers and server-driven time. [ ] Document operational requirements and coordinate RPC schedule needs with Mandla. [ ] Do not implement database functions. |
| 5 — Quiz | [ ] Ensure CI covers the available app checks and deployment previews. [ ] Verify release configuration does not expose secrets or quiz answers. [ ] Help Malebo validate the integrated preview flow. |
| 6 — Resolution | [ ] Own reveal UI in `src/features/reveal/` and scheduling/release operations. [ ] Coordinate the API contract with Mandla before UI integration. [ ] Document how scheduled resolution is monitored and manually recovered if needed. |
| 7 — MVP polish | [ ] Own release notes/README deployment steps and known issues. [ ] Verify production build, preview, environment configuration and rollback path. [ ] Coordinate a live smoke test with Malebo before release. |
| 8 — Stabilization | [ ] Verify production and preview health; test rollback steps. [ ] Resolve deployment/configuration defects in owned files. [ ] Keep release status visible to the team. |
| 9 — Operations | [ ] Maintain deploy, environment ownership and incident/rollback runbooks. [ ] Record operational feedback and alert the owner of the affected area. [ ] Keep secrets outside source control. |
| 10 — Next-increment discovery | [ ] Estimate deployment, hosting, CI and operational impact for the proposed scope. [ ] List release constraints early so parallel discovery can continue. [ ] Do not provision production resources for unapproved features. |

**Phase hand-off:** record environment assumptions, deployment verification,
rollback steps and exact CI/release status in the issue or PR. Production
changes must remain reviewable and repeatable.
