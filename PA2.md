# PA#2 — LeeTKOB, harness and quality gate

Team: 23120279 Nguyễn Lê Quang Kan, 23120321 Lâm Nhật Phong, 23120322 Lê Thanh Phong.
Submitted at tag `pa2`.

| What                                     | Link                                                                                                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository (public)                      | https://github.com/pogdepZ/leetkob                                                                                                                                                                                                                             |
| Protected-branch settings                | https://github.com/pogdepZ/leetkob/settings/branches — screenshot committed at `docs/evidence/branch-protection.jpg`; the blocked merge box at `docs/evidence/pr1-blocked-red-checks.jpg`, the contract-break PR at `docs/evidence/pr2-contract-break-red.jpg` |
| Pull request a red check stopped         | https://github.com/pogdepZ/leetkob/pull/1 — red run: https://github.com/pogdepZ/leetkob/actions/runs/42978807292, red commit: https://github.com/pogdepZ/leetkob/commit/81f9ae7                                                                                |
| The commit that turned it green          | https://github.com/pogdepZ/leetkob/commit/3a6f6d2 — green run: https://github.com/pogdepZ/leetkob/actions/runs/42978948452                                                                                                                                     |
| CI run for the tag                       | https://github.com/pogdepZ/leetkob/actions?query=branch%3Apa2                                                                                                                                                                                                  |
| Deliberate contract break that CI caught | https://github.com/pogdepZ/leetkob/pull/2 (left open, unmerged) — red run: https://github.com/pogdepZ/leetkob/actions/runs/42980922214, commit: https://github.com/pogdepZ/leetkob/commit/0fde427                                                              |

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
