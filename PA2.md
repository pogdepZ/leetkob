# PA#2 — LeeTKOB, harness and quality gate

Team: 23120322 Lê Thanh Phong, `<StudentID2>` `<Name>`, `<StudentID3>` `<Name>`.
Submitted at tag `pa2`.

| What                                     | Link                                                                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository (public)                      | <REPO_URL>                                                                                                                                                  |
| Protected-branch settings                | <REPO_URL>/settings/branches — API dump committed at `docs/evidence/branch-protection.json` (screenshot, if present: `docs/evidence/branch-protection.png`) |
| Pull request a red check stopped         | <PR_RED_URL> — red run: <RED_RUN_URL>, red commit: <RED_COMMIT_URL>                                                                                         |
| The commit that turned it green          | <GREEN_COMMIT_URL> — green run: <GREEN_RUN_URL>                                                                                                             |
| CI run for the tag                       | <REPO_URL>/actions?query=branch%3Apa2                                                                                                                       |
| Deliberate contract break that CI caught | <PR_BREAK_URL> (left open, unmerged) — red run: <BREAK_RUN_URL>, commit: <BREAK_COMMIT_URL>                                                                 |

## Where things are

| Criterion                     | Files                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------ |
| 1 Rules file                  | `CLAUDE.md` (`AGENTS.md` → symlink)                                            |
| 2 Permissions and secrets     | `docs/PERMISSIONS.md`, `.claude/settings.json`, `.env.example`, `.gitignore`   |
| 3 One command for every check | `package.json` scripts, `README.md` "The four checks"                          |
| 4 CI that blocks a merge      | `.github/workflows/ci.yml`, `scripts/branch-protection.json`, links above      |
| 5 Contract                    | `docs/contract/publish-lab.md`                                                 |
| 6 Contract tests              | `test/contract/publish.contract.test.ts`, `test/contract/contract-doc.test.ts` |
| 7 AI-LOG                      | `AI-LOG.md`                                                                    |

## Re-run the checks at the tag

```sh
git checkout pa2
npm ci
npm run check
```
