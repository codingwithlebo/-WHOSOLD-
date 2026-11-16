# -WHOSOLD-
A group of friends gets their wishlist funded by a billionaire, but before the money drops, each friend secretly chooses to play for double or pass — one win doubles the group’s bag, one loss wipes it all out.

## Team & Roles

| Name | Role | GitHub |
|------|------|--------|
| Owethu Jezile | Product Owner + Frontend/Backend | [@Owethudev](https://github.com/Owethudev) |
| Mandla Sikhosana | Tech Lead + Frontend/Backend | [@mandlenkosii](https://github.com/mandlenkosii) |
| Malebo Nkuna | QA/Test Lead+ Frontend/Backend | [@codingwithlebo](https://github.com/codingwithlebo) |
| Ntokozo Maselela | DevOps/Release + Frontend/Backend | [@shaunmaselela25](https://github.com/shaunmaselela25) |


## Project documents

- [Product Requirements Document](docs/PRD.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Design references](docs/designs/README.md)

## Getting Started

Requirements: Node.js 24 LTS and npm.

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

```sh
npm run lint
npm run format:check
npm run typecheck
npm test -- --run
npm run build
```

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
