# Assistant permissions

What the coding assistant (Claude Code, in VS Code) may do in this repository, in three tiers.
The machine-readable version is `.claude/settings.json`; this file explains it. When the two
disagree, fix the JSON and this file in the same commit.

## Allowed without asking

- Read any file in the repository except `.env*` (see Never).
- Edit `src/`, `test/`, `docs/` and the Markdown files at the root.
- Run the four checks and their underlying tools: `npm run lint`, `npm run format:check`,
  `npm run format`, `npm run typecheck`, `npm test`, `npm run check`, and `npx eslint | prettier | tsc | vitest`.
- Read-only git: `status`, `diff`, `log`, `show`, `branch`.

## Ask first

- Edit anything that changes what runs or how: `.github/`, `package.json`, `package-lock.json`,
  `.claude/`, `.env.example`.
- Install or remove dependencies.
- Any git command that moves history or leaves the machine: `add`, `commit`, `checkout`,
  `switch`, `merge`, `rebase`, `tag`, `push`, and all `gh` commands.
- Docker, web fetches and web searches.

A commit the assistant proposes is read before it is approved; the commit message says what
the assistant wrote. A push goes to a branch, never to `main` (`main` is protected anyway).

## Never

- Read or edit `.env` or any `.env.*` except `.env.example`, or anything under `~/.ssh`,
  `~/.aws`, `~/.config/gh`.
- Edit the eval data or its labels (`eval/`, `data/eval/`). From PA#4 the eval gates CI; a
  label changed to make it pass is a wrongful deduction hidden, not fixed.
- Rewrite shared history: `push --force`, `reset --hard`, `filter-branch`, `commit --no-verify`.
- `rm -rf`, `curl`, `wget`: nothing is deleted wholesale or downloaded by the assistant.

## Why these lines

- `Read(./.env)` is denied because the model API key will live there from PA#3 and the brief
  says it must never reach the sandbox or the logs. The assistant reading it is one copy too many.
- `Edit(./eval/**)` is denied because the rubric for criterion 6 gives 0–2 points when
  "the tests were edited in the same commit as the code to make them pass": the same
  temptation applies to eval labels, with a student's mark at stake.
- Tests and the contract are editable (they are how work gets done), but `CLAUDE.md` says the
  contract changes first and the test second, and the PR reviewer checks the order.
