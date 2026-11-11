# LeeTKOB

Constraint review for C++ lab submissions, built for CSC13114 (class 2609-AWAD-23/3).
A TA declares constraints on a lab ("implement merge sort yourself", "no `std::sort`"); hard
rules and then a model check every Accepted submission; the TA reviews the verdicts and
publishes the marks. The class brief is the product definition; this repository is one team's
implementation.

**PA#2 — harness and quality gate.** This checkpoint contains the assistant's rules file, the
permissions, the four checks, the CI that blocks a merge, and the contract plus contract tests
for one endpoint, `POST /labs/{labId}/publish`. The LLM feature arrives in PA#3.

## Team

| Student ID | Name           |
| ---------- | -------------- |
| 23120322   | Lê Thanh Phong |
| 23120279   | `<Name>`       |
| 23120321   | `<Name>`       |

## Stack

Node 22, TypeScript (strict), Fastify 5, Vitest, ESLint 9 + typescript-eslint, Prettier.
One process, in-memory storage for PA#2. Fewer moving parts on purpose; see `docs/DECISIONS.md`.

## Fresh clone to green

```sh
git clone https://github.com/pogdepZ/leetkob.git
cd leetkob
nvm use            # Node 22, from .nvmrc
npm ci
npm run check      # lint, format check, type check, tests — all four must be green
```

## The four checks

| Check      | Command                | What it runs                                                     |
| ---------- | ---------------------- | ---------------------------------------------------------------- |
| Lint       | `npm run lint`         | `eslint .` with typescript-eslint strict + stylistic, type-aware |
| Format     | `npm run format:check` | `prettier --check .` (`npm run format` rewrites)                 |
| Type check | `npm run typecheck`    | `tsc --noEmit` on `src`, `test` and the configs                  |
| Tests      | `npm test`             | `vitest run`: unit tests and the contract tests                  |

`npm run check` runs them in that order. CI (`.github/workflows/ci.yml`) runs the same four
scripts as four jobs named `lint`, `format:check`, `typecheck`, `test`; all four are required
on `main`.

## Run it

```sh
npm run dev        # http://localhost:3000, hot reload
curl -i -X POST http://localhost:3000/labs/lab_sorting/publish \
  -H 'Authorization: Bearer dev-ta-a' \
  -H 'Content-Type: application/json' \
  -d '{"note":"Marks for the Sorting lab."}'
```

PA#2 authenticates with static development tokens from `src/seed.ts` (`dev-ta-a`, `dev-ta-b`,
`dev-student`, `dev-admin`). They are not secrets; real sessions replace them in PA#3.

## Contract

`docs/contract/publish-lab.md` — who may call it, request and response shape with field rules,
every error as RFC 9457 problem details, idempotency, and what happens when it changes.
`test/contract/publish.contract.test.ts` holds the code to it; `test/contract/contract-doc.test.ts`
fails when the error table in the document and the registry in `src/problem.ts` drift apart.

## Assistant, permissions, secrets

- Rules file: `CLAUDE.md` (`AGENTS.md` is a symlink to it).
- Permissions in three tiers: `docs/PERMISSIONS.md`, enforced by `.claude/settings.json`.
- Configuration comes from the environment. `.env.example` lists every variable without a
  value; `.env` is git-ignored and nothing in the history contains a secret.
- Model and cost (PA#3+): provider `<provider>`, model `<model>`. The API key has a hard
  spending cap of `<amount>` per month set on the provider's billing page on `<date>`, and
  `LLM_SPEND_CAP_USD_PER_LAB` stops the checker before a single lab exceeds its budget.
  What one lab costs is measured in PA#3 and recorded here and in `AI-LOG.md`.

## Checkpoint files

`PA2.md` (links to the repository, the protected-branch settings, the blocked PR, the PR that
turned green, the CI run for the tag and the deliberate contract break), `AI-LOG.md`,
`SELF_ASSESSMENT_REPORT.md`.
