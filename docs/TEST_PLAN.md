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

The current unit tests cover the app shell and unknown-route handling. Add
feature-specific component and business-rule tests with the feature PRs.

## Manual smoke test

1. Run `npm run dev` and open the local URL printed by Vite.
2. Confirm the landing page renders at desktop and mobile widths, including
   360px.
3. Visit an unknown path and use **Back to home**; confirm both routes render.
4. Run `npm run build` and `npm run preview`; confirm the production build loads.
5. Check browser console and keyboard focus for errors or inaccessible controls.

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
