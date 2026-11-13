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

The current app is a deployable frontend scaffold. Sign-in, groups, and
wishlists are not implemented yet. Copy `.env.example` to `.env.local` when
connecting Supabase; never commit local environment files.

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test -- --run
npm run build
```

GitHub Actions runs these checks on pull requests to `main` and pushes to
`main`. The first product milestone is sign-in and working groups on the live
link. The database test job will be added once migrations and a local Supabase
configuration exist.

**Live deployment:** not configured yet.

## Contributing

- Submit changes through a pull request; do not push directly to `main`. An
administrator still needs to enable branch protection and required status
checks in the repository settings.
- Get at least one teammate's approval and a passing CI run before merging.
- Do not approve or merge your own pull request.
- Branch naming: `feature/<short-name>` or `fix/<short-name>`.
