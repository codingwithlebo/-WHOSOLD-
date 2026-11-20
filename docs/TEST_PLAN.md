# Test Plan

## Automated checks

Run the same checks locally that the pull-request workflow runs:

```sh
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test -- --run
npm run build
```

The current unit tests cover:

- App routes: landing page, the Double or Pass preview, and unknown routes.
- Money helpers: `formatRand` and `parseRandToCents`.
- Auth: form validation, log-in and sign-up pages, and `ProtectedRoute`.
- The landing-page demo reducer (win doubles, loss wipes, pass keeps).
- Groups: the dashboard (create and join forms, group list), the group page
  (members, leader-only **Lock**, not-found and retry states) and
  `groupService`, including database error messages reaching the player.
- Wishlist: adding, editing and deleting items, who may edit which item, and
  the fund total.
- Round history: the page renders, but its route stays hidden until rounds
  exist (Phase 10).

3D scenes are decorative and are not unit-tested: jsdom has no WebGL, so tests
render the static fallback instead. Check them manually (see below).

Add feature-specific component and business-rule tests with the feature PRs.

## Manual smoke test

1. Run `npm run dev` and open the local URL printed by Vite.
2. Confirm the landing page renders at desktop and mobile widths, including
   360px.
3. Visit an unknown path and use **Back to home**; confirm both routes render.
4. Run `npm run build` and `npm run preview`; confirm the production build loads.
5. Check browser console and keyboard focus for errors or inaccessible controls.
6. 3D: the landing vault and the coin backgrounds on log-in and sign-up
   render, follow the pointer, and the Double / Pass / Play again buttons
   animate the coins. With the OS "reduce motion" setting on, scenes stay still.
7. Visit `/dashboard` while signed out and confirm it redirects to `/login`.

## Database tests (pgTAP)

`npm run db:test` (and the `db` CI job) runs the tests in `supabase/tests/`
against a local Supabase with every migration applied.

`profiles.test.sql` covers:

- The table exists, `id` is the primary key, and RLS is enabled.
- The sign-up trigger creates a profile from the `display_name` metadata,
  trims it, and falls back to the email name.
- A player can read and rename only their own profile.
- Renaming someone else's profile has no effect.
- Display names must be 2–30 characters.
- Players cannot change `id`, insert profiles directly, or delete profiles.
- Anonymous visitors cannot read profiles.

`groups.test.sql` covers:

- Both tables exist, RLS is enabled, join codes are unique, and a player can
  be in a group only once.
- `create_group` trims the name, makes a 6-character code, and adds the
  creator as leader and first member; blank or over-50-character names fail.
- A non-member cannot see the group, its members or the leader's profile.
- `join_group` accepts a lower-case code, is safe to retry, and rejects
  unknown codes, badly formatted codes, locked groups and full groups
  (10 members).
- After joining, group mates can see each other's display names.
- Only the leader can lock; members and outsiders get the same error.
- Players cannot insert members or update groups directly, and logged-out
  visitors cannot call `create_group`.
- Deleting a group deletes its member rows.

`wishlist_items.test.sql` covers:

- The table exists, RLS is enabled, and logged-out visitors cannot read it.
- A member can add, edit and delete their own items; names are trimmed and
  the item is recorded as theirs (it cannot be added in someone else's name).
- The leader can edit any item; other members cannot edit or delete items
  they did not add.
- Members see every item in their group, and the fund is the sum of prices.
- Outsiders cannot see, add or delete the group's items.
- Blank names, a zero price, prices over R10 million and a 51st item are
  rejected with player-friendly messages.
- Nobody can change who added an item or move it to another group.
- Deleting a group deletes its wishlist.

Every new table or RPC needs at least one "allowed" and one "denied" test.

## Manual check on the live link (Phase 1)

**Emails for new sign-ups:** use an address on a real email domain. Supabase
can reject made-up domains such as `test.dev` when signing up. (The seeded
`@test.dev` logins still work, because the seed creates them directly in the
database.) A Gmail "plus" address works well: `yourname+whosold1@gmail.com`
arrives in your own inbox and counts as a new email each time you change the
number. The hosted project confirms new accounts automatically, so no
confirmation email is needed.

1. In an incognito window, sign up with a new email and a display name.
2. Confirm you land on the dashboard with your display name shown.
3. Refresh: you stay logged in. Log out: you return to the landing page.
4. Log in as `alice@test.dev` / `Password123!`.
5. In the Supabase dashboard, confirm the new user has a `profiles` row.

## Manual check on the live link (Phases 2–3: groups and wishlist)

**Keep the demo data usable.** Locking cannot be undone, and there is no way
to leave a group, so:

- **Never lock Demo Crew.** Test locking on a group you create.
- Join Demo Crew with a **new** account, not Cara, so Cara stays an outsider
  for the markers' "try joining" demo.
- Delete any wishlist items you add, so the fund stays at R27 499.00.

1. Sign up a new account and join with code `DEMO42` (lower case also works):
   Demo Crew shows Alice (leader), Bob and the new account.
2. As the new account, try `ZZZZZZ` and `ab`: you see "No group found with
   that code." and "Enter a valid 6-character group code."
3. Log in as Bob: the **Lock** button is not shown.
4. As Bob in Demo Crew, the wishlist shows two items and a fund of
   R27 499.00. Add, edit and delete your own item and refresh after each step:
   the change is saved. Alice's item cannot be changed.
5. Log in as Alice: Alice can edit Bob's item. Change it back afterwards.
6. As any account, create a new group: a 6-character code appears. Join it
   from a second account, then lock it as its creator. A third account now
   gets "This group is locked, so no new members can join."
7. Open `/groups/abc` and `/history`: you see "This group could not be found
   or you are not a member." and the not-found page.

Record the URL, browser, date and pass/fail on the PR or issue (never a
password).

## Planned coverage

End-to-end browser tests (Playwright) are not set up yet; the live-link checks
above are done by hand. Add Playwright coverage after the MVP; do not treat its
absence as a passing test.

## Phase 4 — Round UI acceptance (frontend slice)

**Ownership note:** Owethu is covering Malebo's currently unblocked Phase 4 UI
slice to push project readiness while the team is unavailable. This is not a
live-round QA sign-off. Group details link to a protected demo preview, but it
uses static data and is not connected to a backend. Live rounds remain
unavailable until the round schema and RPC functions are implemented.

| Area | Scenario | Expected result | Evidence |
|---|---|---|---|
| Schedule | Select the 5-minute, 1-hour or 24-hour preset | Opening, closing and release values are represented in SAST; the selected choice window has the preset duration | `StartRoundForm` component test |
| Schedule | Submit a choice window shorter than 5 minutes or a release before close | A clear validation message is shown and no round is created | `StartRoundForm` component test |
| Choice | Select Double or Pass, then go back from confirmation | No choice is submitted | `RoundPage` component test |
| Choice | Confirm Double or Pass | The selected private choice is submitted once | `RoundPage` component test |
| Privacy | View a round before release | Only the aggregate answered count and the current member's own choice are shown; no member-by-member choice state is rendered | `RoundPage` component test |
| Timing | Visit before open, while open, and after close | Choices are unavailable outside the open window; the open window shows a countdown and answered count | `RoundPage` component tests |
| Failure | The round service rejects schedule creation or choice submission | A readable error is displayed and retry remains possible | Component failure-state tests |


## Phase 1 — Accounts and authentication acceptance

Use these cases when reviewing the account flow. A case is not complete merely
because its form renders: verify the expected navigation, auth result and
session state as well.

| Area | Scenario | Expected result | Evidence |
|---|---|---|---|
| Sign-up | Submit a valid display name, email and password | Account creation is requested with a trimmed display name; successful sign-up proceeds to the dashboard | SignupPage component test and live smoke test |
| Sign-up validation | Empty or 1-character display name; display name over 30 characters | Field-level validation is shown; no sign-up request is made | validation and SignupPage tests |
| Sign-up validation | Empty or malformed email | Email validation is shown; no sign-up request is made | validation and SignupPage tests |
| Sign-up validation | Password shorter than 8 characters | Password validation is shown; no sign-up request is made | validation and SignupPage tests |
| Sign-up failure | Supabase rejects the request (for example, an already registered email) | A readable error is announced; user stays on sign-up; submit control becomes usable again | SignupPage failure test / manual check |
| Sign-up failure | Auth request throws because of a network failure | Connection error is announced; user stays on sign-up and can retry | SignupPage failure test / manual check |
| Log-in | Submit a valid email and password | Email is trimmed; successful log-in opens the dashboard or the originally requested protected route | LoginPage component test |
| Log-in validation | Empty or malformed email, or empty password | Relevant field errors appear; no log-in request is made | validation and LoginPage tests |
| Log-in failure | Supabase rejects credentials | Error is announced; user remains on log-in and can correct credentials | LoginPage component test |
| Log-in failure | Auth request throws / network unavailable | Connection error is announced and retry is possible | LoginPage component test |
| Configuration | Supabase environment keys are absent | UI explains that Supabase is not connected; no false successful login or signup is shown | LoginPage / SignupPage tests and live environment check |
| Session restore | Reload while a valid session exists | Loading state is shown until the saved session is restored, then the protected page appears | AuthProvider integration test and live refresh |
| Session restore | Reload with no saved session | Protected route redirects to log-in; requested path is retained for return after login | ProtectedRoute test |
| Protected route | Open /dashboard directly while signed out | Redirect to /login; protected content is never rendered | ProtectedRoute test and incognito smoke test |
| Sign-out | Sign out from an authenticated session | Supabase session is cleared and protected routes redirect to log-in | AuthProvider integration test and live smoke test |

### Phase 1 verification status

The automated suite covers log-in and sign-up field validation, successful
log-in and sign-up navigation, log-in and sign-up server and network failures
(the form stays usable for a retry), the missing-Supabase warning,
protected-route redirects, authenticated access and the protected-route loading
state.

`AuthProvider.test.tsx` covers the provider itself against a fake Supabase
client: loading until the saved session is restored (`getSession`), starting
signed out with no saved session, recovering when restoring fails, following
log-in and log-out events (`onAuthStateChange`), signing out, passing on the
Supabase error message, sending the display name with sign-up, unsubscribing
on unmount, and the "not connected" message when the keys are missing.

#### Hosted smoke status — 20 Nov 2026

Malebo reports access to hosted Supabase and confirms that the deployed
dashboard and group pages load. This is initial smoke evidence only; it does
not verify the remaining authentication lifecycle, group and wishlist
operations, or row-level-security acceptance checks. See the [groups
dashboard screenshot](screenshots/groups-dashboard.png) and the [landing page
screenshots](../README.md#screenshots).

To finish Phase 1, run the live smoke test below against the hosted
environment. A mocked test does not prove that hosted Supabase credentials,
profile creation or deployment environment variables are correct.

### Phase 1 live smoke test

1. In a private/incognito browser window, open the deployed app.
2. Create an account using a new real-domain email (see the Phase 1 note
   above) and a display name of 2–30 characters. Confirm successful
   navigation to the dashboard.
3. Refresh the dashboard. Confirm the session is restored and the user remains
   signed in.
4. Open `/dashboard` in a second private window while signed out. Confirm it
   redirects to `/login` and does not expose dashboard content.
5. Log out. Confirm the app returns to the public landing/log-in flow.
6. Log in again with the test account. Confirm the dashboard is accessible.
7. Try an invalid password and a malformed email. Confirm errors are visible,
   no protected content is shown, and the form can be retried.
8. Confirm the new user has a matching `profiles` row in Supabase. This
   database inspection belongs to Mandla; report the expected result to him
   rather than editing database files.
9. Record the deployment URL, test account identifier (never its password),
   browser, date, and pass/fail result in the Phase 1 issue. Never commit test
   credentials or secrets.

## Local UI smoke snapshot (20 Nov 2026)

Owethu is covering Malebo's currently unblocked QA follow-through to push
project readiness while the team is unavailable. These are local results, not
live deployment or release sign-off.

- `npm test -- --run` — passed (18 files, 76 tests).
- `npm test -- --run src/features/auth/LoginPage.test.tsx src/features/groups/GroupsDashboard.test.tsx src/features/groups/GroupPage.test.tsx` — passed (3 files, 17 tests).
- Local browser check at 360px, 768px and 1440px: `/`, `/login` and `/signup` had no horizontal overflow.
- The login email and password inputs expose their matching accessible labels.
- Keyboard-only traversal and hosted auth/groups/wishlist checks remain outstanding. The known hosted preview requires Vercel access; do not treat these local checks as evidence for hosted behavior.

## Phase 10 — Group history acceptance (#46)

**Ownership note:** Owethu is covering Malebo's unblocked QA-planning work to
push project readiness while the team is unavailable. This is not a QA sign-off
for the live integration.

The `get_history` contract and UI preparation are merged, but the live RPC and
round-resolution data are not. Use the contract fixture only in tests; the
production route must continue to show its unavailable state until the backend
is ready.

| Scenario | Expected result | Evidence |
|---|---|---|
| Signed-in member requests their group's history | Only that group's resolved rounds whose release time has passed are returned. | Mandla's pgTAP coverage in #44; authorized-member smoke test after #44. |
| Outsider or anonymous caller requests history | An outsider receives the non-member/not-found error; an anonymous caller is denied. No group existence is disclosed. | Mandla's pgTAP coverage in #44; do not mock away authorization in the live test. |
| Active, unresolved, or unreleased round exists | It is absent from the response, and choices, quiz answers, scores, and unreleased outcomes are never exposed. | Mandla's pgTAP coverage in #44; inspect the live RPC response after #44. |
| More than one eligible round exists | Rows are ordered by `resolved_at` descending, then `id` descending. | RPC ordering assertion in #44; adapter preserves response order. |
| Member has no eligible rounds | RPC returns `[]`; the page shows “No resolved rounds for this group yet.” | [History service tests](../src/features/history/historyService.test.ts) and [page tests](../src/features/history/RoundHistoryPage.test.tsx). |
| Eligible rows contain each outcome | Dates, `Intact` / `Grown` / `Lost` labels, and starting/final Rand totals match the contract values. | History service and page tests; the contract fixture is test-only. |
| History request is loading or fails | Loading is announced; errors are announced and a retry action is available. | Page tests for `role="status"`, `role="alert"`, and retry behavior. |
| Keyboard, screen reader, and narrow viewport | Back navigation and retry are keyboard reachable with visible focus; status/error messages are announced; content remains usable at 360px. | Manual accessibility and responsive check after live data is available. |

**Readiness boundary:** The contract-mapping and page-state tests can run now.
Database authorization/filtering and the Supabase-enabled preview smoke test
remain blocked on #44 and the preview setup in #26. Do not mark the history
flow live or complete based only on fixture-backed tests.
