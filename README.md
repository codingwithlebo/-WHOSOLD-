# -WHOSOLD-

[![CI](https://github.com/codingwithlebo/-WHOSOLD-/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/codingwithlebo/-WHOSOLD-/actions/workflows/ci.yml)

A group of friends gets their wishlist funded by a billionaire, but before the money drops, each friend secretly chooses to play for double or pass — one win doubles the group’s bag, one loss wipes it all out.

## Team & Roles

| Name             | Role                              | GitHub                                                 |
| ---------------- | --------------------------------- | ------------------------------------------------------ |
| Owethu Jezile    | Product Owner + Frontend/Backend  | [@Owethudev](https://github.com/Owethudev)             |
| Mandla Sikhosana | Tech Lead + Frontend/Backend      | [@mandlenkosii](https://github.com/mandlenkosii)       |
| Malebo Nkuna     | QA/Test Lead+ Frontend/Backend    | [@codingwithlebo](https://github.com/codingwithlebo)   |
| Ntokozo Maselela | DevOps/Release + Frontend/Backend | [@shaunmaselela25](https://github.com/shaunmaselela25) |

## Project documents

- [Product Requirements Document](docs/PRD.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Design references](docs/designs/README.md)

## Getting Started

Requirements: Node.js 24 LTS (see `.nvmrc`; `nvm use` picks it up) and npm.

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon
key (shared privately by the Tech Lead). Never commit local environment
files.

## Database (Supabase)

All database changes are migration files in `supabase/migrations/`, merged
through a PR. Never edit tables by hand in the Supabase dashboard.

### Local database (optional, needs Docker Desktop)

```sh
npm run db:start   # starts Supabase locally, applies migrations + seed.sql
npm run db:test    # runs the pgTAP database tests in supabase/tests/
npm run db:reset   # rebuilds the local database from migrations + seed
npm run db:types   # regenerates src/lib/database.types.ts after a migration
npm run db:stop
```

`db:start` prints a local API URL and anon key. Put them in `.env.local` to
run the app against your local database.

### Hosted project (Tech Lead)

After a migration PR is merged into `main`:

```sh
npx supabase@3.1.0 login
npx supabase@3.1.0 link --project-ref <project-ref>
npx supabase@3.1.0 db push --include-seed
```

### Test logins

Test accounts only. Never use real passwords.

| Email | Password | Display name |
|-------|----------|--------------|
| `alice@test.dev` | `Password123!` | Alice |
| `bob@test.dev` | `Password123!` | Bob |
| `cara@test.dev` | `Password123!` | Cara |

## Checks

Run the same gate CI runs before pushing:

```sh
npm run verify   # format:check → lint → typecheck → test:ci → build
```

Individual scripts:

| Script                 | What it does                                                 |
| ---------------------- | ------------------------------------------------------------ |
| `npm run format:check` | Prettier check on the whole repo (`npm run format` to fix)   |
| `npm run lint`         | Type-aware ESLint, zero warnings allowed (`lint:fix` to fix) |
| `npm run typecheck`    | `tsc -b` across app and tooling projects                     |
| `npm run test:ci`      | Vitest, single run (`npm test` for watch mode)               |
| `npm run build`        | Typecheck + production Vite build                            |

### CI pipeline

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on pull requests to
`main`, pushes to `main`, the merge queue and manual dispatch. Jobs run in
parallel:

- **Lint workflows**: actionlint + shellcheck on the workflow files
- **Format**, **Lint**, **Typecheck**, **Unit tests**, **Build** (uploads `dist/`)
- **Dependency audit**: registry signature check and `npm audit` (high+) on
  production dependencies
- **Dependency review** (PRs only): blocks newly added vulnerable or
  copyleft-licensed packages
- **Database tests**: `supabase db reset` + `supabase test db`; a no-op until
  `supabase/config.toml` exists
- **CI passed**: aggregates all of the above. Make this the single required
  status check in branch protection.

Actions are pinned to commit SHAs, the workflow token is read-only, and stale
runs on the same PR are cancelled. Dependabot opens weekly grouped PRs for npm
packages and actions.
GitHub Actions runs these checks on pull requests to `main` and pushes to
`main`. A second `db` job starts Supabase, applies every migration and
`seed.sql`, and runs the pgTAP tests (`npm run db:test`).

**Live deployment:** not configured yet.

## Contributing

- Submit changes through a pull request; do not push directly to `main`. An
  administrator still needs to enable branch protection and required status
  checks in the repository settings.
- Get at least one teammate's approval and a passing CI run before merging.
- Do not approve or merge your own pull request.
- Branch naming: `feature/<short-name>` or `fix/<short-name>`.
