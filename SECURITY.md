# Security Policy

## Supported versions

WHOSOLD? is a student project with one live version: whatever is on `main`
and deployed from it. Fixes go to `main` only.

## Reporting a vulnerability

Please report security problems privately, not in a public issue:

1. Contact the Tech Lead, [@mandlenkosii](https://github.com/mandlenkosii),
   privately. If you must open an issue, say only that you have a security
   report and leave out the details.
2. Describe what you found, how to reproduce it, and what data it exposes.

We aim to reply within 3 days, and to fix confirmed problems in a reviewed
pull request as soon as we can. Never test against other players' accounts or
data; use the test logins in the README.

## How the app protects data

- **Access rules live in the database.** Every table has row-level security
  (RLS): players can only read their own groups, their group mates' display
  names and their groups' wishlists. Creating, joining and locking groups go
  through database functions that check the caller. pgTAP tests in
  `supabase/tests/` prove the "allowed" and "denied" cases on every pull
  request.
- **Only the public anon key reaches the browser.** It is set as a Vercel
  environment variable, never committed. The `service_role` key and the
  database password are never used in the app, the repository or CI.
- **Local secrets stay local.** `.env` and `.env.local` are ignored by git.
- **Dependencies are checked** in CI (`npm audit`, registry signatures and
  dependency review), and Dependabot proposes updates.
- **The fund is virtual.** No real money or payment details are handled.
