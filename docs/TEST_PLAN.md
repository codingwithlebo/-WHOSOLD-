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

Every new table or RPC needs at least one "allowed" and one "denied" test.

## Manual check on the live link (Phase 1)

1. In an incognito window, sign up with a new email and a display name.
2. Confirm you land on the dashboard with your display name shown.
3. Refresh: you stay logged in. Log out: you return to the landing page.
4. Log in as `alice@test.dev` / `Password123!`.
5. In the Supabase dashboard, confirm the new user has a `profiles` row.

## Planned coverage

End-to-end account/group flows are not enabled yet. Add Playwright coverage
when the sign-in/group flows exist; do not treat their absence as a passing
test.


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

The existing automated suite covers login/signup field validation,
successful login/signup navigation, login credential and network failures,
the missing-Supabase warning on the login page, protected-route redirects,
authenticated access and the protected-route loading state. Signup server
failure handling and provider-level session/sign-out behavior still need
explicit automated coverage.

Before marking Phase 1 complete, add or confirm provider-level tests for
restoring a session with `getSession`, reacting to auth-state changes, and
signing out. Add signup failure tests as well. Then run the live smoke test
below against the configured hosted environment. A mocked component test
does not prove that hosted Supabase credentials, profile creation or
deployment environment variables are correct.

### Phase 1 live smoke test

1. In a private/incognito browser window, open the deployed app.
2. Create an account using a new test email and a display name of 2–30
   characters. Confirm successful navigation to the dashboard.
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
