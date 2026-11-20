# Operations and release runbook

**Owner:** Ntokozo Maselela (DevOps/Release). **Database owner:** Mandla
Sikhosana. **Last updated:** 20 November 2026.

This is the single place for how WHOSOLD? is deployed, configured, monitored,
released and rolled back. It never contains secrets: values live in Vercel,
Supabase and each developer's `.env.local` only.

## 1. Environments and ownership

| Environment | Frontend                  | Database               | Deploys when                | Owner          |
| ----------- | ------------------------- | ---------------------- | --------------------------- | -------------- |
| Local       | `npm run dev`             | Local Supabase or hosted | Manually                  | Each developer |
| Preview     | Vercel preview URL per PR | Hosted Supabase        | A PR is opened or updated   | Ntokozo        |
| Production  | Vercel production URL     | Hosted Supabase        | A PR merges to `main`       | Ntokozo        |

- **Vercel project** `whosold` (frontend hosting, env vars, rollbacks):
  hosted under Malebo's Vercel account (`malebos-projects`); operated by
  Ntokozo. Anyone doing a rollback needs to be a member of that Vercel team.
  Production: <https://whosold-seven.vercel.app>.
- **Hosted Supabase project** (schema, migrations, pg_cron, auth settings):
  Mandla. Ntokozo is backup only when Mandla asks (#35).
- **GitHub settings** (branch protection, Dependency graph): repo admin.

Preview and production share one hosted Supabase project (MVP decision in the
implementation plan §10). Previews therefore use **test accounts only**
(`alice@test.dev` etc.); never create real-person data on a preview.

## 2. Environment variables

| Name                     | Where                      | Public? | Notes                                   |
| ------------------------ | -------------------------- | ------- | --------------------------------------- |
| `VITE_SUPABASE_URL`      | `.env.local`, Vercel (all) | Yes     | Project URL                             |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel (all) | Yes     | Safe in the browser because RLS applies |

Rules:

- Only `VITE_*` variables reach the browser, and only the two above are
  allowed. The `service_role` key, secret keys (`sb_secret_…`) and the
  database password **never** go into Vercel, the repo, PRs, issues or logs.
- `npm run check:dist` (also a CI step) fails the build if a service-role JWT,
  secret key, server-only env name or quiz-answer field appears in `dist/`.
- Set both variables in Vercel for **Production and Preview**. Changing a
  variable only applies to new deployments: redeploy after editing.
- If a secret is ever committed: treat it as leaked. Ask Mandla to rotate it
  in Supabase immediately, then remove it from the code. Rewriting git history
  does not un-leak it.

## 3. Deploy flow

1. Branch → PR → CI (`CI passed` is the single required check).
2. Vercel posts a preview URL on the PR. The author and reviewer check the
   change there (routes refresh correctly thanks to the SPA rewrite in
   `vercel.json`).
3. Merge to `main` → Vercel builds and promotes production automatically.
4. Database changes: Mandla runs `supabase db push` **after** the migration PR
   merges (README "Hosted project"). Frontend that depends on a new RPC merges
   only after that push, or ships behind an unregistered route (as the reveal
   and history screens do).

**Supabase Auth redirect URLs** (Mandla, Authentication → URL Configuration):
the production URL as Site URL, plus `https://*-<vercel-team>.vercel.app/**`
so sign-up confirmation links work on previews.

## 4. Round timing: hosting and runtime assumptions (Phase 4)

Agreed assumptions the round, quiz and reveal features rely on:

1. **The server clock is the only authority.** `opens_at`, `closes_at` and
   `release_at` are `timestamptz`; every check (`submit_choice`, `start_quiz`,
   `answer_question`, `get_reveal`) compares against `now()` in Postgres. The
   browser clock is used only to draw countdowns.
2. **No server runtime on Vercel.** The frontend is a static build, with no
   serverless functions or Vercel cron. All timed work runs in Supabase.
3. **pg_cron** runs `resolve_due_rounds()` every minute in the hosted project.
   Expected lag between `closes_at` and resolution: ≤ 1 minute.
4. **Fallback when cron is late or down:** `get_round_status` and `get_reveal`
   call `resolve_round` when a round is due (implementation plan §11), so the
   game still resolves on demand.
5. **Time zone:** stored in UTC, shown as SAST (`Africa/Johannesburg`, UTC+2,
   no daylight saving), so there are no DST edge cases.
6. **Demo windows:** minimum 5-minute play window so a full round can be shown
   live.
7. **Supabase free tier pauses a project after about a week with no activity.**
   A paused project means login and every RPC fail. Before any demo, open the
   live app once (or restore the project in the dashboard) at least an hour
   before.

Requests to Mandla (RPC schedule needs):

- [ ] `get_round_status` also returns `server_now timestamptz`, so the UI can
      correct countdowns for a wrong device clock (`offset = server_now - Date.now()`).
- [ ] Enable `pg_cron` in a migration (`create extension if not exists pg_cron`)
      and schedule the job **in the same migration**, so `db push` is
      repeatable and nothing is set up by hand in the dashboard.
- [ ] Use a stable job name: `resolve-due-rounds`, schedule `* * * * *`.
- [ ] `resolve_round` is idempotent and safe to call concurrently (row lock
      with `for update`), because cron and the on-demand fallback can race.

## 5. Scheduled resolution: monitoring and manual recovery (Phase 6)

Run these in the Supabase SQL editor (read-only checks are safe for anyone
with dashboard access; recovery actions are Mandla's, or Ntokozo's when Mandla
asks).

**Is the job scheduled and active?**

```sql
select jobid, jobname, schedule, active from cron.job
where jobname = 'resolve-due-rounds';
```

**Did it run recently, and did it succeed?**

```sql
select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'resolve-due-rounds')
order by start_time desc
limit 10;
```

Healthy: a `succeeded` row every minute.

**Are any rounds overdue?** (closed more than 2 minutes ago, still unresolved)

```sql
select id, group_id, closes_at, release_at, status
from rounds
where status <> 'resolved' and closes_at < now() - interval '2 minutes';
```

Healthy: no rows.

**Manual recovery**, in order:

1. Resolve everything that is due (idempotent, safe to repeat):
   `select resolve_due_rounds();`
2. One stuck round: `select resolve_round('<round id>');`
3. Job missing or inactive: re-apply it from the migration (`supabase db push`
   from `main`), not by hand. If an urgent hand fix is needed, record the exact
   SQL in the incident issue and follow up with a migration the same day.
4. Re-run the overdue query to confirm zero rows, then check the reveal on the
   live link.

Players are not blocked while cron is down, because opening the round or
reveal page triggers the on-demand fallback. Cron failure is an incident only
if the fallback also fails.

**Never** update `rounds.outcome`, `choices` or `quiz_attempts` by hand: that
changes a game result and cannot be audited.

## 6. Release process (Phase 7)

Before tagging a release or recording the demo:

1. `main` is green: the latest `CI passed` on `main` succeeded.
2. Locally on `main`: `npm ci && npm run verify` passes (includes
   `check:dist`).
3. Vercel production deployment for that commit is **Ready**; production env
   has both variables set (Settings → Environment Variables).
4. All merged migrations are applied to hosted Supabase (Mandla confirms
   `supabase migration list` shows local = remote).
5. **Live smoke test** with Malebo on the production URL (test accounts):
   - [ ] Home page loads; refresh on `/dashboard` and `/groups/<id>` does not 404.
   - [ ] Log in as Alice; session survives a reload; log out works.
   - [ ] Create a group, Bob joins with the code, leader locks it.
   - [ ] Add wishlist items; the fund total updates.
   - [ ] Start a 5-minute round; Alice doubles + takes the quiz, Bob passes.
   - [ ] Before release: no outcome visible (UI and network tab).
   - [ ] After release: reveal shows the correct outcome and breakdown.
   - [ ] Browser console has no errors; no secrets in page source.
6. Record the result (date, commit SHA, deployment URL, pass/fail per step)
   in the release issue and the PR.

## 7. Rollback

Pick the smallest step that fixes users' problem.

| Problem                         | Action                                                                                                         | Who      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Bad frontend deploy             | Vercel → Deployments → last good production deployment → **Instant Rollback**. Takes seconds, no rebuild.     | Ntokozo  |
| Make the rollback permanent     | `git revert <merge sha>` on a `fix/` branch → PR → merge. Vercel auto-promotion resumes after the next deploy. | Ntokozo  |
| Wrong env variable              | Fix it in Vercel, then **Redeploy** the current production deployment.                                         | Ntokozo  |
| Bad migration                   | Forward fix: a new migration that undoes it, reviewed and pushed by Mandla. Never edit tables by hand.         | Mandla   |
| Leaked key                      | Rotate in Supabase first, then update Vercel/`.env.local`, redeploy.                                           | Mandla + Ntokozo |

Notes:

- After an Instant Rollback, Vercel pauses auto-promotion of new `main`
  deploys until someone promotes one manually. Remember to promote once the
  fix merges.
- A frontend rollback does not undo a migration. If a release contains both,
  check the old frontend still works with the new schema (additive migrations
  keep this true) before rolling back.
- **Rollback drill (Phase 8):** on a quiet moment, roll production back one
  deployment, confirm the older build is served, then promote the latest
  again. Record it in the release issue.

## 8. Health checks (Phase 8)

| Check                         | How                                                          | Healthy                   |
| ----------------------------- | ------------------------------------------------------------ | ------------------------- |
| Production up                 | Open the production URL; hard refresh `/dashboard`           | 200, app renders          |
| Preview pipeline              | Latest PR has a Vercel preview comment                       | Ready                     |
| CI                            | Actions tab, latest `main` run                               | `CI passed` green         |
| Supabase reachable / not paused | Log in with a test account                                 | Login succeeds            |
| Scheduled resolution          | Queries in §5                                                | Runs every minute, no overdue rounds |
| Dependencies                  | Dependabot PRs and the `Dependency audit` job                | No open high/critical     |

## 9. Incidents

1. **Confirm and size it.** Reproduce on production with a test account.
   Severity: **Critical** (nobody can log in or play, data exposure), **High**
   (a core flow broken for some), **Medium/Low** (workaround exists).
2. **Open an issue** labelled `bug` + area, with steps, expected vs actual,
   URL, time (SAST), commit SHA and screenshots. Deployment/config problems
   get the `devops` label so they stay separate from feature bugs.
3. **Alert the owner of the affected area:**
   auth/quiz/database → Mandla; groups/wishlist/history → Owethu;
   round/choice UI → Malebo; deploy, env, CI, reveal, scheduling → Ntokozo.
   Data exposure or leaked key → everyone, immediately.
4. **Mitigate** with §7 (rollback) or §5 (resolution recovery).
5. **Close** with what happened, the fix PR, and any runbook change.

## 10. Release status and known issues

Keep this table current; it is what the team checks before a demo.

| Item                                   | Status (20 Nov 2026)                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| CI on PRs and `main`                   | In place; `CI passed` aggregates all jobs                                                 |
| Build secret/quiz-answer guard         | In place (`npm run check:dist`, CI build job)                                             |
| Vercel production                      | Live at https://whosold-seven.vercel.app, auto-deploys `main`. Verified 20 Nov: `/`, `/login`, `/signup`, `/dashboard`, `/groups/<id>` and unknown paths all return 200 on hard refresh (SPA rewrite works); Supabase URL and anon key are in the bundle; `check:dist` on the live bundle finds nothing sensitive |
| Vercel previews                        | Built for every PR (Vercel check green on #59). **Known issue:** Deployment Protection is on, so preview URLs redirect (302) to a Vercel login. Testers must be members of the Vercel team, or the owner must create a protection-bypass link |
| Security headers                       | Added in `vercel.json` (#59); live on production after merge                               |
| Live login / full-round smoke test     | Pending: Malebo with test accounts, runbook §6                                             |
| Branch protection requiring `CI passed` | Needs a repo admin                                                                        |
| Dependency graph (for Dependency review) | Disabled; the job skips with a warning until an admin enables it                        |
| Rounds / quiz / resolution database    | Not merged yet (Mandla). Round, reveal and history UIs stay unconnected until it lands     |
| pg_cron job                            | Waits on the resolution migration; requirements in §4                                      |
| Reveal UI                              | Built and tested against `docs/contracts/get-reveal.md`; route registered at integration  |

## 11. Next increment: release impact (Phase 10)

For the accepted scope (group round history, `docs/PHASE_10_DISCOVERY.md`):

| Area       | Impact                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Hosting    | None. Static route on the existing Vercel project; no new services, no new env vars                               |
| Database   | One read-only RPC (`get_history`) in Mandla's migration; no new tables, so no backfill and no extra pg_cron work   |
| CI         | Existing jobs cover it: unit tests for the adapter, pgTAP for access rules. No new jobs; DB job time grows slightly |
| Release    | Ship in order: migration merged → `db push` → types regenerated → UI PR registers the route. Rollback = revert UI PR |
| Cost       | Stays on free tiers                                                                                               |
| Risk       | History must never list unreleased rounds; covered by the contract's release-time rule and Malebo's #46 scenarios |

Release constraints for any future scope:

- Anything that needs a backend runtime other than Supabase RPC + pg_cron
  (emails, push notifications, scheduled jobs outside Postgres) needs a new
  hosting decision before work starts.
- Do not create production resources (new Supabase projects, paid plans,
  extra Vercel projects) for features the Product Owner has not approved.
- Draw mode stays deferred until its scope and rules are approved.
