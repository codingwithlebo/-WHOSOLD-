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

## Planned coverage

Database policy/RPC tests and end-to-end account/group flows are not enabled
yet. Add pgTAP and Playwright coverage when the Supabase migrations and
sign-in/group flows exist; do not treat their absence as a passing test.
