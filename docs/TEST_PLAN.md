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

## Planned coverage

Database policy/RPC tests and end-to-end account/group flows are not enabled
yet. Add pgTAP and Playwright coverage when the Supabase migrations and
sign-in/group flows exist; do not treat their absence as a passing test.
