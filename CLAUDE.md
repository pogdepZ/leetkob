# LeeTKOB — rules for the assistant

Read this before touching anything. Permissions are in `docs/PERMISSIONS.md`.

## Stack

- Node 22 (`.nvmrc`), TypeScript strict, ESM (`"type": "module"`, imports end in `.js`).
- Fastify 5 for HTTP. Errors are RFC 9457 problem details from `src/problem.ts`, nowhere else.
- Vitest for tests; contract tests use `app.inject()`, no port, no network.
- PA#2 stores data in memory (`src/store.ts`). PA#3 adds a database behind the same interface.

## Commands

Same four locally and in CI (`.github/workflows/ci.yml`), one job each:

| Check  | Command                                          |
| ------ | ------------------------------------------------ |
| lint   | `npm run lint`                                   |
| format | `npm run format:check` (`npm run format` to fix) |
| types  | `npm run typecheck`                              |
| tests  | `npm test`                                       |

`npm run check` runs all four. Run it before proposing a commit.

## Conventions

- Contract first: `docs/contract/<endpoint>.md` changes before the route and before the tests, in the same PR.
- Every error type lives in `PROBLEMS` (`src/problem.ts`) and in the contract's error table; `test/contract/contract-doc.test.ts` keeps them equal.
- A lab the caller may not see answers `404 lab-not-found`, never `403`: do not leak that it exists.
- A test that loops over parsed data asserts the data is non-empty first. (AI-LOG #3: the contract-doc test passed on zero rows after Prettier re-padded the table.)
- Do not assume a path with an empty segment is unrouted: Fastify matched `/labs//publish` with `labId = ""`. Reject bad IDs in the handler. (AI-LOG #4)
- Small PRs, one concern each, conventional commit subjects (`feat:`, `fix:`, `docs:`, `ci:`, `test:`, `chore:`).

## Never

- Never put a secret in the sandbox, in a log line, in a test or in a fixture. The model key reaches the checker process only.
- Never make a real model call in unit or contract tests; stub the provider.
- Never edit a test, the eval data or a label to make a check pass. Change the contract, then the code, or leave the check red and say so.
- Never push to `main`; never `--force`, `--no-verify`, `reset --hard`.
- Never write a CI step that cannot fail (`|| true`, `continue-on-error`, `exit 0` after a check).
- Never let a check pass on an empty set (zero tests, zero rows, zero files).
