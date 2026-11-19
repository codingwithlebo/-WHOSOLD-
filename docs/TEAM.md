# WHOSOLD? Team Delivery Map

This is the ownership and hand-off guide for phases 1–10. The [implementation
plan](IMPLEMENTATION_PLAN.md) defines the product and technical contracts; these
checklists make each person's next actions explicit.

## Team

| Member | GitHub | Primary responsibility |
|---|---|---|
| Mandla Sikhosana | [@mandlenkosii](https://github.com/mandlenkosii) | Tech Lead and sole database owner |
| Owethu Jezile | [@Owethudev](https://github.com/Owethudev) | Product Owner, groups/wishlist UI and product acceptance |
| Malebo Nkuna | [@codingwithlebo](https://github.com/codingwithlebo) | QA/Test Lead, Double-or-Pass UI and regression |
| Ntokozo Maselela | [@shaunmaselela25](https://github.com/shaunmaselela25) | DevOps/Release, deployment and reveal operations |

Individual phase checklists: [Mandla](team/mandla-sikhosana.md) ·
[Owethu](team/owethu-jezile.md) · [Malebo](team/malebo-nkuna.md) ·
[Ntokozo](team/ntokozo-maselela.md).

## Ownership boundaries

- **Mandla owns all database changes**: Supabase schema, migrations, RLS,
  functions/RPCs, database-loaded question content, database tests, seed data,
  and generated database types. No other member edits these files or applies
  migrations to the hosted project, except Ntokozo as backup when Mandla asks
  (see the hosted Supabase ground rules, #35).
- Feature owners own their own `src/features/<name>/` UI folder. Owethu owns
  groups and wishlist UI; Malebo owns round/choice UI; Mandla owns auth and
  quiz UI; Ntokozo owns reveal UI and scheduling/release operations.
- Shared UI, router, CI and E2E files must have one named owner in their issue.
  Split work by folders/files rather than having parallel branches edit the
  same shared file.
- Product rules belong to Owethu for approval. Mandla records the approved
  database/API contract in the issue before implementing it.

## Parallel-work rules

1. Turn each deliverable into an issue with one assignee, owned files, an
   acceptance checklist, and any real dependency.
2. Before implementation, agree on the RPC/type contract. The UI owner can
   build against a typed mock/fixture while Mandla builds the database in a
   separate branch. QA can write frontend/E2E scenarios against the same
   contract; database test files remain Mandla-owned.
3. Use feature flags, adapters, or fixture-backed tests rather than waiting on
   an unfinished branch. Do not merge a fake implementation as production
   behavior.
4. Integrate only after each branch passes its own checks. Declare a dependency
   only when its output is required to meet acceptance criteria—not because
   another person owns adjacent work.
5. After integration, the feature owner verifies the flow and Malebo runs
   regression. Mandla alone applies the reviewed migration and regenerates DB
   types.

## Phase map

| Phase | Goal | Independent work streams | Exit gate |
|---|---|---|---|
| 1 | Accounts and sign-in | Mandla auth/profile DB+UI; Owethu shared UI/UX; Malebo auth test cases; Ntokozo CI/environment readiness | Sign-up, session restore, sign-out and protected routes pass |
| 2 | Groups | Mandla group schema/RPC; Owethu dashboard/group UI; Malebo validation scenarios; Ntokozo preview smoke test | Create, join, list and lock work with RLS |
| 3 | Wishlist and fund | Mandla wishlist schema/RLS; Owethu CRUD and fund UI; Malebo money/validation tests; Ntokozo demo deployment | Fund totals and wishlist rules pass |
| 4 | Rounds and Double/Pass | Mandla rounds/choices DB; Malebo round UI; Owethu rules/copy acceptance; Ntokozo scheduling readiness | Private, final choices and round timing pass |
| 5 | Quiz | Mandla quiz DB/RPC and quiz UI; Owethu approves questions; Malebo anti-cheat/E2E checks; Ntokozo verifies CI/deployment | Single-attempt timed quiz never reveals answers or score early |
| 6 | Resolution and reveal | Mandla resolution DB/RPC; Ntokozo reveal UI/operations; Owethu rule sign-off; Malebo outcome tests | Same correct result is hidden until release and then visible |
| 7 | MVP polish and release | Mandla DB/type fixes; Owethu history/accessibility; Malebo E2E/regression; Ntokozo release/docs | MVP acceptance, CI and live smoke test pass |
| 8 | Stabilization | Each owner fixes defects in their area; Malebo triages | No critical/high release defects; regression passes |
| 9 | Operations and feedback | Mandla database health; Owethu feedback/backlog; Malebo regression; Ntokozo deployment/runbook | Every report is prioritized, reproducible and assigned |
| 10 | Next-increment discovery | Mandla feasibility; Owethu scope; Malebo test risks; Ntokozo release impact | Product-approved scope is split into independent issues |

Phases 8–10 are operational/discovery work, not new MVP features. Draw mode
remains deferred until the Product Owner approves a separate scope and rules.

## Branch, commit, push and PR workflow

For every new task:

1. Start from an up-to-date `main` and create `feature/<issue-number>-<short-name>`,
   `fix/<issue-number>-<short-name>`, or `docs/<short-name>`.
2. Implement only the issue's scope. Add tests for changed behavior; never put
   secrets in source or logs.
3. Run the relevant checks from the [test plan](TEST_PLAN.md); record exact
   commands and results in the PR.
4. Commit with a Conventional Commit message and issue reference, then push the
   branch.
5. Open a PR to `main`, link/close the issue, summarize the change, list
   verification, and include UI evidence where relevant.
6. Request one teammate's review. Do not approve or merge your own PR. Merge
   only after required checks pass; squash-merge and delete the branch.

## Definition of done

- The issue acceptance checklist is complete and the correct member owns it.
- Relevant tests and CI pass; integration does not leave placeholders on the
  production path.
- Database changes are authored/reviewed by Mandla, tested, and applied only
  after merge; generated types match the merged schema.
- The feature works on the deployed link and has been regression-checked.
- The PR is reviewed/merged and the issue is ticked off/closed.
