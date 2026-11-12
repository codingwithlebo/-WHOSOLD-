# WHOSOLD? — Implementation Plan

**Team:** ChatGPT
**Owner:** Tech Lead (Mandla Sikhosana)
**Version:** 1.0 (Checkpoint 2)
**Last updated:** 12 November 2026
**Related:** [PRD](PRD.md) · [README](../README.md) · Designs: `docs/designs/` (to be added)

---

## 1. Purpose

This plan is built from the [PRD](PRD.md) (v0.2). Section 13 maps every PRD requirement, non-functional requirement and success metric to a phase and its tests, and lists where the plan differs from the PRD. It turns the PRD into phased, testable work that four people can build in parallel between **Thu 12 Nov** and **Fri 20 Nov 2026**. Each phase lists its tasks, the tests to write first (TDD), acceptance criteria, an owner and the files it touches. Every phase becomes one or more GitHub Issues on the project board.

---

## 2. MVP Scope

The PRD lists 11 "Must" requirements. The brief asks for 3–5 Must **features**, so the requirements are grouped into features and cut down to what we can finish well.

### Must (MVP)

| # | Feature | PRD requirements |
|---|---------|------------------|
| M1 | **Accounts & log-in**: sign up, log in, log out, profile with display name | New (needed for Checkpoint 3) |
| M2 | **Groups**: create a group with a join code, join by code, lock the group | FR-1, FR-2 |
| M3 | **Wishlist & fund**: add, edit and remove items; live fund total | FR-3, FR-4 |
| M4 | **Double or Pass + quiz**: private choice, single-attempt timed quiz scored on the server, choices locked | FR-5, FR-6, FR-7, FR-8, FR-11 |
| M5 | **Resolution & reveal**: server works out the outcome; results hidden until release time, then a reveal screen with a breakdown | FR-9, FR-10, FR-12 |

### Should (if time allows)

| Feature | PRD |
|---------|-----|
| Round history per member and per group | FR-14 |
| In-app banners or reminders for "window open" and "results ready" (no email or push) | FR-13 (reduced) |

### Could / Out of scope

- Draw mode (FR-15)
- Reveal animations and sound (FR-16) — a simple CSS reveal is fine for the MVP
- Email or push notifications, real payments, public matchmaking

---

## 3. Decisions

The PRD left these open. They are the Tech Lead's proposals; the Product Owner confirms or changes them in review of this PR.

### 3.1 Technical decisions

| Area | Decision | Why |
|------|----------|-----|
| Frontend | **React 18 + TypeScript + Vite**, **Tailwind CSS**, **React Router** | As proposed in the PRD; quick to build, easy to deploy as a static site |
| Data fetching | **TanStack Query** over the Supabase JS client | Caching, loading and error states without hand-written code |
| Backend | **Supabase only**: Postgres, Auth, Row Level Security (RLS) and Postgres functions (RPC). **No separate Express server.** | Changed from the PRD. One less service to build, host and secure. Server-side rules (quiz scoring, hidden results) live in `security definer` functions that the browser can call but not bypass |
| Scheduling | **`pg_cron`** job every minute that resolves rounds whose window has closed, plus a "resolve if due" check when a reveal is requested | No extra worker to host |
| Auth | **Supabase email + password** (email confirmation off for the demo) | Simple, satisfies the "log-in" requirement |
| Tests | **Vitest + React Testing Library** (frontend unit and component), **pgTAP via `supabase test db`** (schema, RLS, functions), **Playwright** (one end-to-end happy path) | Each layer is tested where its logic lives |
| Lint and format | ESLint (typescript-eslint, react-hooks) + Prettier | |
| CI | GitHub Actions: lint → typecheck → unit tests → DB tests → build on every PR | Required by the brief |
| Hosting | **Vercel** (frontend, auto-deploy from `main`) + **hosted Supabase** (one project owned by the Tech Lead) | Required by the brief |
| Package manager | **npm**, Node **20 LTS** | Same on every laptop and in CI |

### 3.2 Game-rule defaults (answers to PRD Open Questions)

| PRD question | Default for the MVP |
|--------------|---------------------|
| Q1 Multiple winners | Fund **doubles once**, whatever the number of winners |
| Q2 Quiz content | **5 questions** from a seeded bank of at least 30 general-knowledge questions, multiple choice (4 options), **20 seconds per question**, pass mark **4 out of 5** |
| Q3 Difficulty | Same for everyone |
| Q4 Reveal detail | **Named** breakdown: each member shows Passed / Doubled and won / Doubled and lost |
| Q5 Real vs virtual | **Virtual** only; the UI says "virtual funds, this is a game" |
| Q6 Group size | 2–10 members |
| Q7 Play window | Set by the group leader when starting a round (opens at, closes at, release at). Default 24 hours; minimum 5 minutes so we can demo it live |
| Q8 Accounts | Members sign up with email and password, then set a display name |
| Q9 Draw mode | Later (out of scope) |
| Q10 QA owner | Malebo Nkuna (as in the README) |

---

## 4. Architecture

```
 Browser (React + Vite on Vercel)
   │  supabase-js (anon key + user JWT)
   ▼
 Supabase
   ├── Auth            sign up, log in, sessions
   ├── PostgREST       table reads/writes, filtered by RLS
   ├── RPC functions   create_group, join_group, start_round, submit_choice,
   │                   start_quiz, answer_question, get_round_status, get_reveal
   ├── Postgres        tables + RLS policies
   └── pg_cron         resolve_due_rounds() every minute
```

**Golden rule:** anything that decides the game (choices, quiz answers, scores, outcome) is written and read **only through RPC functions**. The browser never gets a direct `select` on the correct answers, on other members' choices or on quiz results before release time. This is enforced by RLS and covered by tests.

### 4.1 Repository layout

```
/
├── .github/workflows/ci.yml
├── docs/
│   ├── PRD.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TEST_PLAN.md               (QA Lead, Phase 0)
│   └── designs/                   (Stitch exports + link)
├── supabase/
│   ├── config.toml
│   ├── migrations/                (one timestamped SQL file per change)
│   ├── seed.sql                   (test users, demo group, question bank)
│   └── tests/                     (pgTAP: *.test.sql)
├── src/
│   ├── main.tsx, App.tsx, router.tsx
│   ├── lib/supabase.ts            (client, typed with generated types)
│   ├── lib/database.types.ts      (generated: supabase gen types)
│   ├── features/
│   │   ├── auth/                  (M1)
│   │   ├── groups/                (M2)
│   │   ├── wishlist/              (M3)
│   │   ├── round/                 (M4: Double/Pass + status)
│   │   ├── quiz/                  (M4: quiz UI)
│   │   ├── reveal/                (M5)
│   │   └── history/               (Should)
│   ├── components/                (shared UI: Button, Card, Layout, Money…)
│   └── test/                      (setup, test utilities, mocks)
├── e2e/                           (Playwright)
├── .env.example
├── package.json, tsconfig.json, vite.config.ts, eslint.config.js
└── README.md
```

Each `features/<name>/` folder is owned by one person (see section 7). This keeps two AI agents from editing the same files.

---

## 5. Data Model

All tables live in `public` with RLS **enabled**. `auth.users` is managed by Supabase.

| Table | Key columns | Notes |
|-------|-------------|-------|
| `profiles` | `id uuid PK → auth.users`, `display_name text`, `created_at` | Row created by a trigger on sign-up |
| `groups` | `id`, `name`, `join_code text unique` (6 chars), `leader_id → profiles`, `is_locked bool`, `created_at` | |
| `group_members` | `group_id`, `user_id`, `joined_at`; PK (`group_id`, `user_id`) | Max 10 per group (checked in `join_group`) |
| `wishlist_items` | `id`, `group_id`, `added_by`, `name`, `price_cents bigint > 0`, `created_at` | Fund = sum of `price_cents` |
| `rounds` | `id`, `group_id`, `fund_cents` (snapshot when started), `opens_at`, `closes_at`, `release_at`, `status` (`open`/`closed`/`resolved`), `outcome` (`intact`/`doubled`/`lost`), `final_fund_cents` | One active round per group |
| `choices` | `round_id`, `user_id`, `choice` (`pass`/`double`), `created_at`; PK (`round_id`, `user_id`) | Insert only through `submit_choice`; no updates (FR-11) |
| `questions` | `id`, `prompt`, `options text[4]`, `category` | Readable by signed-in users (no answers here) |
| `question_answers` | `question_id PK`, `correct_index smallint` | **No RLS policies at all**: clients can never read it; only `security definer` functions can |
| `quiz_attempts` | `id`, `round_id`, `user_id`, `question_ids uuid[5]`, `current_index`, `score`, `started_at`, `finished_at`, `passed bool` | One per (`round_id`, `user_id`) |
| `quiz_responses` | `attempt_id`, `question_id`, `chosen_index`, `is_correct`, `served_at`, `answered_at` | |

Money is stored as **integer cents** to avoid rounding errors. The UI formats it as Rand.

### 5.1 RLS summary

| Table | Select | Insert / Update / Delete |
|-------|--------|--------------------------|
| `profiles` | Yourself and members of your groups | Update own row only |
| `groups` | Members only (joining by code goes through `join_group`) | Via RPC only; leader can rename or lock |
| `group_members` | Members of the same group | Via RPC only |
| `wishlist_items` | Members of the group | Members can insert; edit or delete own items (leader can edit or delete any) **while no round is open** |
| `rounds` | Members (but `outcome` and `final_fund_cents` only come back through `get_reveal`) | Via RPC only |
| `choices` | **Own row only** | Via `submit_choice` only |
| `questions` | Signed-in users | None |
| `question_answers` | **None** | None |
| `quiz_attempts`, `quiz_responses` | **None** (read through RPC) | Via RPC only |

### 5.2 RPC functions

| Function | Does | Rules enforced |
|----------|------|----------------|
| `create_group(name)` | Creates group + join code, adds caller as leader and member | Signed in |
| `join_group(code)` | Adds caller to the group | Code exists, group not locked, under 10 members, not already in |
| `lock_group(group_id)` | Locks the group | Caller is leader |
| `start_round(group_id, opens_at, closes_at, release_at)` | Snapshots fund, creates round | Leader; group locked; ≥2 members; fund > 0; no active round; `opens_at < closes_at ≤ release_at`; window ≥ 5 min |
| `get_round_status(round_id)` | Returns round times, status, **number answered / total** and the caller's own choice | Member; never returns other members' choices |
| `submit_choice(round_id, choice)` | Records Pass or Double | Member; window open; one choice only |
| `start_quiz(round_id)` | Creates the attempt with 5 random questions; returns question 1 (no answer) | Caller chose Double; no attempt yet; window open |
| `answer_question(attempt_id, chosen_index)` | Scores the current answer on the server and returns the next question (or "finished") | Attempt is the caller's; answered within 20 s of `served_at` (late = wrong); does **not** say whether the answer was correct |
| `resolve_round(round_id)` | Applies the PRD section 5 rules; unanswered = Pass; unfinished quiz = lost | Internal; idempotent |
| `resolve_due_rounds()` | Resolves every round past `closes_at` | Called by `pg_cron` |
| `get_reveal(round_id)` | Returns outcome, final fund and the per-member breakdown | Member; `now() ≥ release_at` (resolves first if needed); otherwise error |
| `get_history(group_id)` | Past resolved rounds with outcomes | Member (Should) |

Resolution rules (from PRD section 5):

```
if any member who chose Double did not pass → outcome = lost,    final = 0
elif at least one member passed the quiz    → outcome = doubled, final = fund × 2
else (everyone passed or did not answer)    → outcome = intact,  final = fund
```

---

## 6. Phases

Every task follows the team workflow: **Issue → branch → failing tests → code → full check → PR → review → squash merge**. "Tests first" lists what must be written and failing before the code.

### Phase 0 — Foundations (Thu 12 – Fri 13 Nov)

**Goal:** an empty but deployable app with real CI, so everyone can start feature branches.

| Task | Owner | Issue label |
|------|-------|-------------|
| 0.1 Scaffold Vite + React + TS + Tailwind + Router + TanStack Query; ESLint, Prettier; `npm run lint / typecheck / test / build` scripts | Mandla | `setup` |
| 0.2 Supabase: create the hosted project, `supabase init`, link, first migration (`profiles` + sign-up trigger), `seed.sql` skeleton, generated types, `.env.example` | Mandla | `backend` |
| 0.3 Replace the placeholder CI with real jobs (section 9); add the DB test job | Ntokozo | `devops` |
| 0.4 Connect Vercel to the repo, set env vars, auto-deploy `main`, preview deploys on PRs; add the live link to the README | Ntokozo | `devops` |
| 0.5 Write `docs/TEST_PLAN.md`; set up Vitest + RTL + test utilities; Playwright config | Malebo | `qa` |
| 0.6 Stitch designs exported to `docs/designs/`, link in README; shared layout and components (`Button`, `Card`, `Input`, `Layout`, `Money`) | Owethu (+ Designer) | `frontend`, `design` |

**Tests first:** a smoke test that `<App />` renders; a pgTAP test that `profiles` has RLS enabled.

**Acceptance criteria**
- `npm ci && npm run lint && npm run typecheck && npm test && npm run build` passes locally and in CI.
- `main` requires a PR, 1 approval and passing CI (set by the repo admin).
- The live Vercel URL shows the app shell.
- `.env` is git-ignored; `.env.example` lists `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Phase 1 — Accounts & log-in (M1) (Fri 13 – Sat 14 Nov)

**Owner:** Mandla · **Folder:** `src/features/auth/`, `supabase/migrations/*_profiles.sql`

| Task |
|------|
| 1.1 Sign-up, log-in and log-out pages (email + password + display name) |
| 1.2 `AuthProvider` + `useSession` hook; `ProtectedRoute` that sends signed-out users to `/login` |
| 1.3 Profile page to change the display name |
| 1.4 Seed test accounts (`alice@test.dev`, `bob@test.dev`, `cara@test.dev`, password `Password123!`) |

**Tests first**
- Component: the log-in form shows validation errors and calls `signInWithPassword` with the right values.
- Component: `ProtectedRoute` redirects when there is no session.
- pgTAP: a profile row is created on sign-up; a user cannot update someone else's profile.

**Acceptance criteria**
- A new user can sign up, is logged in, and lands on the dashboard.
- Refreshing the page keeps the session; log-out clears it.
- Signed-out users cannot open any page except log-in and sign-up.

### Phase 2 — Groups (M2) (Fri 13 – Sun 15 Nov)

**Owner:** Owethu · **Folder:** `src/features/groups/`, `supabase/migrations/*_groups.sql`

| Task |
|------|
| 2.1 Migration: `groups`, `group_members`, RLS, `create_group`, `join_group`, `lock_group` |
| 2.2 Dashboard: list my groups, "Create group" and "Join with code" |
| 2.3 Group page: name, join code (copy button), member list, Lock button for the leader |

**Tests first**
- pgTAP: join codes are unique; joining a locked or full group fails; a non-member cannot select the group; only the leader can lock.
- Component: the join form trims and upper-cases the code and shows "Code not found".

**Acceptance criteria**
- A user creates a group and sees a 6-character join code.
- A second user joins with the code and both see each other in the member list.
- After locking, joining fails with a clear message.

### Phase 3 — Wishlist & fund (M3) (Sat 14 – Mon 16 Nov)

**Owner:** Owethu · **Folder:** `src/features/wishlist/`, `supabase/migrations/*_wishlist.sql`

| Task |
|------|
| 3.1 Migration: `wishlist_items` + RLS (edits blocked while a round is open) |
| 3.2 Wishlist on the group page: add, edit and delete items; prices entered in Rand, stored in cents |
| 3.3 Fund total card ("Sponsored by a mystery billionaire · virtual funds") |
| 3.4 `formatRand(cents)` utility |

**Tests first**
- Unit: `formatRand(123456)` → `R1 234.56`; parsing user input to cents rejects negatives and non-numbers.
- pgTAP: non-members cannot read or add items; a member cannot delete another member's item; edits fail while a round is open.
- Component: adding an item updates the total.

**Acceptance criteria**
- Members add, edit and remove items and the total updates without a page reload.
- Checkpoint 3 demo: log-in, groups and wishlist working on the live link.

### 🏁 Checkpoint 3 — Mon 16 Nov, 10:00

Live link with **log-in (M1)**, the **database** and **groups + wishlist (M2, M3)** working. Every member has merged at least one PR (Phase 0 tasks are spread across all four people for this reason).

### Phase 4 — Rounds & Double or Pass (M4, part 1) (Sun 15 – Tue 17 Nov)

**Owner:** Malebo · **Folder:** `src/features/round/`, `supabase/migrations/*_rounds.sql`

| Task |
|------|
| 4.1 Migration: `rounds`, `choices`, RLS, `start_round`, `submit_choice`, `get_round_status` |
| 4.2 "Start round" form for the leader (opens at, closes at, release at, with quick presets: 5 min / 1 hour / 24 hours) |
| 4.3 Round page: countdown to close, "3 of 5 have answered", Double / Pass buttons with a confirm dialog, then a locked "You chose …" state |

**Tests first**
- pgTAP: a member can see only their own choice; a second `submit_choice` fails; a choice after `closes_at` fails; `get_round_status` never includes other members' choices.
- pgTAP: `start_round` rejects bad time ranges, unlocked groups and a zero fund.
- Component: the confirm dialog must be accepted before `submit_choice` is called; the buttons disappear after choosing.

**Acceptance criteria**
- The leader starts a round; every member sees the countdown and the answered count.
- A member's choice is final, and no other member can see it (checked in the browser network tab as well as by tests).

### Phase 5 — Quiz (M4, part 2) (Mon 16 – Wed 18 Nov)

**Owner:** Mandla · **Folder:** `src/features/quiz/`, `supabase/migrations/*_quiz.sql`, `supabase/seed.sql` (questions)

| Task |
|------|
| 5.1 Migration: `questions`, `question_answers`, `quiz_attempts`, `quiz_responses`, RLS, `start_quiz`, `answer_question` |
| 5.2 Seed at least 30 questions |
| 5.3 Quiz screen: rules first (5 questions, 20 s each, pass mark 4), then one question at a time with a countdown; when time runs out the empty answer is submitted |
| 5.4 Resume: reloading during the quiz continues at the current question, and the timer keeps running |

**Tests first**
- pgTAP: `question_answers` cannot be selected by `authenticated` or `anon`; `start_quiz` fails for a member who chose Pass or already started; an answer after 20 s counts as wrong; `answer_question` never returns the correct index.
- Unit: the countdown hook calls `onExpire` once.
- Component: the answer buttons are disabled after one click.

**Acceptance criteria**
- A member who chose Double takes exactly one 5-question quiz.
- The correct answers never appear in any network response (checked manually by QA).
- After the quiz the member only sees "Quiz complete — results on release day".

### Phase 6 — Resolution & reveal (M5) (Tue 17 – Wed 18 Nov)

**Owner:** Ntokozo · **Folder:** `src/features/reveal/`, `supabase/migrations/*_resolution.sql`

| Task |
|------|
| 6.1 Migration: `resolve_round`, `resolve_due_rounds`, `get_reveal`; enable `pg_cron` and schedule every minute |
| 6.2 Reveal screen: before `release_at` show a countdown; after it, show the outcome (Intact / Grown / Lost), the fund before and after, and the named breakdown |
| 6.3 Unlock the wishlist for the next round after resolution |

**Tests first** (the core game logic, so this is the most heavily tested part)
- pgTAP, one test per rule: everyone passes → intact; one winner → doubled; two winners → doubled once; one winner + one loser → lost; Double but quiz unfinished → lost; no answer → treated as Pass.
- pgTAP: `get_reveal` errors before `release_at`; resolving twice gives the same result.
- Component: the reveal screen renders each outcome correctly.

**Acceptance criteria**
- After `closes_at` the round is resolved automatically within one minute.
- Before `release_at`, nothing about the outcome can be fetched; after it, every member sees the same result.

### Phase 7 — Should features, polish & release (Wed 18 – Thu 19 Nov)

| Task | Owner |
|------|-------|
| 7.1 Round history page (`get_history`) | Owethu |
| 7.2 Banners: "Round open — make your choice" and "Results are ready" | Malebo |
| 7.3 Playwright happy path: 2 users → group → wishlist → round → Double + quiz / Pass → reveal | Malebo |
| 7.4 Accessibility pass (labels, focus states, contrast, keyboard) and 360 px mobile check against the designs | Designer + Owethu |
| 7.5 Manual test run on the live link in an incognito window; bug fixes | Everyone (led by Malebo) |
| 7.6 README complete (all Step 7 items), screenshots, known issues; Loom recorded | Ntokozo (README), everyone (Loom) |

**Code freeze:** Thu 19 Nov, 18:00. After that, only bug-fix PRs. **Submission:** Fri 20 Nov, 10:00.

---

## 7. Ownership & Work Split

| Member | Role(s) | Owns (features and folders) |
|--------|---------|-----------------------------|
| Mandla Sikhosana | Tech Lead | Phase 0.1–0.2 scaffold + Supabase, **M1 Auth** (`features/auth`), **Quiz** (`features/quiz`), migration reviews |
| Owethu Jezile | Product Owner | Phase 0.6 shared components, **M2 Groups** (`features/groups`), **M3 Wishlist** (`features/wishlist`), history, accepts finished features |
| Malebo Nkuna | QA / Test Lead | Phase 0.5 test setup + `TEST_PLAN.md`, **Double/Pass** (`features/round`), banners, Playwright e2e, manual QA |
| Ntokozo Maselela | DevOps / Release | Phase 0.3–0.4 CI + Vercel, **M5 Resolution & reveal** (`features/reveal`, `pg_cron`), README and release |
| **Designer — to be assigned** | Designer | Stitch designs, design check of every screen PR |

**Avoiding clashes**
- One person per `features/<name>/` folder. Shared files (`router.tsx`, `components/`, `seed.sql`) get small, separate PRs.
- Migrations are named `YYYYMMDDHHMMSS_<feature>.sql`. Always pull `main` before creating one, so timestamps stay in order.
- After any migration merges, run `npm run db:types` and commit the regenerated `database.types.ts` in the same PR.

---

## 8. Testing Strategy

| Layer | Tool | What it covers | Where |
|-------|------|----------------|-------|
| Unit | Vitest | Pure helpers (money formatting, countdown, validation) | `src/**/*.test.ts` |
| Component | Vitest + React Testing Library | Forms, guards, button states, outcome rendering; Supabase client mocked | `src/**/*.test.tsx` |
| Database | pgTAP (`supabase test db`) | Every RLS policy and RPC rule, especially "hidden until release" and quiz anti-cheat | `supabase/tests/*.test.sql` |
| End-to-end | Playwright | One full-round happy path on a local Supabase | `e2e/` |
| Manual | `TEST_PLAN.md` checklist | Live link, incognito, mobile, network tab shows no hidden data | `docs/TEST_PLAN.md` |

**Rules**
- Every PR that adds behaviour adds tests. Reviewers request changes if tests are missing.
- Any change to resolution or quiz logic needs a pgTAP test for it.
- Target: every RPC function and every RLS policy has at least one allow test and one deny test.

---

## 9. CI/CD & Environments

### 9.1 GitHub Actions (`.github/workflows/ci.yml`)

Runs on every pull request to `main` and on push to `main`:

1. **app** job (Node 20): `npm ci` → `npm run lint` → `npm run typecheck` → `npm test -- --run` → `npm run build`
2. **db** job: `supabase/setup-cli` → `supabase start` → `supabase db reset` (applies all migrations + seed) → `supabase test db`

Both jobs must pass before merging (set as required checks in branch protection).

### 9.2 Environments

| Environment | Frontend | Database | Deploys when |
|-------------|----------|----------|--------------|
| Local | `npm run dev` | `supabase start` (Docker) | — |
| Preview | Vercel preview URL per PR | Hosted Supabase project | A PR is opened or updated |
| Production | Vercel production URL | Hosted Supabase project | A PR merges to `main` |

Migrations are applied to the hosted project by the Tech Lead with `supabase db push` after each migration PR merges. **Nobody edits tables in the dashboard.**

### 9.3 Environment variables

| Variable | Where | Public? |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `.env`, Vercel | Yes |
| `VITE_SUPABASE_ANON_KEY` | `.env`, Vercel | Yes (protected by RLS) |
| `SUPABASE_ACCESS_TOKEN`, DB password | Tech Lead only; GitHub secret if CI needs it | **No — never in the repo or frontend** |

---

## 10. Workflow

- **Branches:** `feature/<issue#>-<short-name>`, `fix/<issue#>-<short-name>`, `docs/<short-name>`, `chore/<short-name>`
- **Commits:** Conventional style with the Issue number, e.g. `feat: add join group form (#12)`
- **PRs:** small (aim for under 400 changed lines), description with what and why, `Closes #<n>`, screenshots for UI, and how it was tested. AI review first, then **one teammate approval**. Squash and merge, then delete the branch.
- **Board:** Backlog → To Do → In Progress → In Review → Done. Every task in section 6 is an Issue with acceptance criteria, an assignee and a label (`frontend`, `backend`, `qa`, `devops`, `design`, `docs`, `setup`).
- **Daily update** in the team thread: done, next, blockers.

---

## 11. Timeline

| Date | Target |
|------|--------|
| Thu 12 Nov | This plan merged; Issues created on the board; Phase 0 started; Stitch designs merged |
| Fri 13 Nov | Phase 0 done (real CI, Vercel live, Supabase linked); Phases 1 and 2 started |
| Sat 14 – Sun 15 Nov | Phase 1 done; Phases 2 and 3 done; Phase 4 started |
| **Mon 16 Nov 10:00** | **Checkpoint 3:** log-in, DB, groups + wishlist live; everyone has merged ≥1 PR |
| Mon 16 – Tue 17 Nov | Phase 4 done; Phase 5 done |
| Wed 18 Nov | Phase 6 done; full round works on the live link; Phase 7 started |
| Thu 19 Nov | Phase 7; **code freeze 18:00**; Loom recorded |
| **Fri 20 Nov 10:00** | **Final submission** |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| RLS mistakes leak choices or answers | Answers are in a table with no policies; results come only from RPCs; deny tests in pgTAP; QA checks the network tab |
| `pg_cron` not available or failing | `get_reveal` and `get_round_status` call `resolve_round` themselves when it is due, so the game still works |
| Migration conflicts between branches | Pull `main` before creating a migration; one migration per PR; Tech Lead reviews every migration |
| Timezone bugs | Store all times as `timestamptz` (UTC); display in SAST (`Africa/Johannesburg`); test boundary times |
| Waiting 24 hours to demo a round | Leader can pick a 5-minute window and release time |
| Designer role still empty | Assign today; until then, Owethu follows the Stitch designs and the PO accepts screens |
| Scope creep | Should and Could items only start after all Musts are done and on the live link |

---

## 13. PRD Traceability

Every requirement in the [PRD](PRD.md) maps to a phase and to the tests that prove it.

### 13.1 Functional requirements

| PRD | Requirement | Priority | Phase | Proved by |
|-----|-------------|----------|-------|-----------|
| FR-1 | Create a group with a name and unique join code | Must | 2 | pgTAP: unique codes; component: create form |
| FR-2 | Join a group by code with a display name | Must | 1, 2 | pgTAP: `join_group` rules; component: join form |
| FR-3 | Shared wishlist (add, edit, remove) | Must | 3 | pgTAP: wishlist RLS; component: item CRUD |
| FR-4 | Calculate and display the fund total | Must | 3 | Unit: `formatRand`; component: total updates |
| FR-5 | Scheduled play window | Must | 4, 6 | pgTAP: `start_round` time checks, choice after close fails; `pg_cron` resolution |
| FR-6 | Private Double/Pass, stored server-side, hidden | Must | 4 | pgTAP: own-row-only select; `get_round_status` hides others |
| FR-7 | Quiz for Double (bank, one attempt, timed) | Must | 5 | pgTAP: one attempt, 20 s limit |
| FR-8 | Server-side scoring, answers never sent early | Must | 5 | pgTAP: `question_answers` unreadable; RPC never returns answers; manual network check |
| FR-9 | Server resolves outcome per PRD section 5 | Must | 6 | pgTAP: one test per rule |
| FR-10 | Hide results until release day, then reveal | Must | 6 | pgTAP: `get_reveal` errors before `release_at`; component: reveal states |
| FR-11 | Lock choices (no changes, no retakes) | Must | 4, 5 | pgTAP: second choice fails; second `start_quiz` fails |
| FR-12 | Non-responders default to Pass | Should → **MVP** | 6 | pgTAP: "no answer → Pass" test |
| FR-13 | Notifications / reminders | Should | 7 (in-app banners only) | Component: banner states |
| FR-14 | Round history | Should | 7 | pgTAP: `get_history`; component: history list |
| FR-15 | Draw mode | Could | Out of scope | — |
| FR-16 | Reveal animations and sound | Could | Out of scope (simple CSS reveal) | — |
| *(new)* | Accounts & log-in (PRD Open Question 8; required by Checkpoint 3) | Must | 1 | Component: auth forms, `ProtectedRoute`; pgTAP: profiles RLS |

### 13.2 Non-functional requirements (PRD section 8)

| NFR | How the plan meets it | Phase |
|-----|-----------------------|-------|
| Fairness & integrity | All decisions in `security definer` RPCs; RLS deny tests; network-tab check in the test plan | 4–6 |
| Anti-cheating (quiz) | One attempt, server-timed (`served_at`), one question at a time, random selection, answers in a table with no policies | 5 |
| Scheduling (single timezone, server decides) | `timestamptz` + `pg_cron`; displayed in SAST; boundary tests | 4, 6 |
| Performance (< 2 s) | TanStack Query caching; single RPC per screen action; checked in manual QA | All |
| Responsiveness (≥ 360 px) | Tailwind mobile-first; 360 px check against designs | 7 |
| Accessibility (WCAG 2.1 AA) | Labelled inputs, focus states, contrast and keyboard pass | 7 |
| Security (validation, rate limits, minimal data) | Validation in RPCs and forms; Supabase Auth rate limits; only email + display name stored | 1–5 |
| Reliability (resume, timer keeps running) | Quiz state stored server-side; reload resumes at current question | 5 |
| Responsible design (virtual funds) | "Virtual funds — this is a game" on fund and reveal screens | 3, 6 |

### 13.3 PRD success metrics (section 12)

| Metric | Checked by |
|--------|------------|
| A group completes a full round without errors | Playwright happy path (7.3) + manual run on the live link |
| No choice or result visible before release day | pgTAP tests in Phases 4 and 6 |
| Quiz answers cannot be read or replayed | pgTAP tests in Phase 5 + manual network check |
| 0 critical bugs open at release | Board label `bug` + `critical` empty at code freeze |
| CI passes on every merged PR | Branch protection requires green CI |

### 13.4 Where this plan differs from the PRD

| PRD says | Plan does | Reason |
|----------|-----------|--------|
| Backend: Node.js + Express (section 9, "proposed") | Supabase RPC functions, no Express server | One less service to host and secure; same server-side guarantees |
| No accounts decided (Open Question 8) | Email + password accounts | Log-in is required for Checkpoint 3 |
| 11 Must requirements | Grouped into 5 Must features | The brief asks for 3–5 Must features |
| FR-12 is a Should | Included in the MVP | Resolution can't be correct without it, and it costs one test |

The Product Owner confirms these changes by approving this PR. After that, the PRD should be updated to match.

---

## 14. Definition of Done

A task is **Done** when:

1. Its acceptance criteria are met.
2. Tests were written first and pass; CI is green.
3. The PR was reviewed and approved by a teammate, then squash-merged.
4. Any migration is applied to the hosted Supabase project and types are regenerated.
5. It works on the live Vercel link.
6. The README (features list, setup or test logins) is updated if needed.
7. The Issue is closed and the card is in **Done**.
