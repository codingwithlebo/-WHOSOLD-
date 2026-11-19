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

Every new table or RPC needs at least one "allowed" and one "denied" test.

## Manual check on the live link (Phase 1)

1. In an incognito window, sign up with a new email and a display name.
2. Confirm you land on the dashboard with your display name shown.
3. Refresh: you stay logged in. Log out: you return to the landing page.
4. Log in as `alice@test.dev` / `Password123!`.
5. In the Supabase dashboard, confirm the new user has a `profiles` row.

## Manual check on the live link (Phase 2, once the groups UI is connected)

1. Log in as `cara@test.dev` and join with code `DEMO42`: Demo Crew shows
   Alice, Bob and Cara.
2. Log in as Bob: the **Lock** button is not shown or is refused.
3. Log in as Alice and lock Demo Crew. A new account then gets
   "This group is locked, so no new members can join."
4. Create a group as any user: a 6-character code appears and can be copied.

## Planned coverage

End-to-end account/group flows are not enabled yet. Add Playwright coverage
when the sign-in/group flows exist; do not treat their absence as a passing
test.
