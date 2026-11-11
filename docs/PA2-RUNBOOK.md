# PA#2 runbook — the GitHub part

Everything in the repository is done locally. What is left needs a GitHub account and `gh`.

## Once

```sh
sudo apt install gh            # or https://cli.github.com
gh auth login                  # GitHub.com, SSH, scopes: repo, workflow
```

## Then, from the repository root

```sh
REPO=<owner>/leetkob scripts/pa2-github.sh
```

The script, in order: creates the public repo and pushes `main`; protects `main` (four
required checks, admins included) and saves the API dump to `docs/evidence/`; pushes only the
red commit of `feat/publication-counts-reviewed`, opens PR 1 and waits for the red run; pauses
so you can look at the blocked Merge button; pushes the green commit, waits, merges; pushes
`break/foreign-lab-403`, opens PR 2, waits for the red run, leaves it open; fills every link
into `PA2.md`, `SELF_ASSESSMENT_REPORT.md` and `AI-LOG.md` on a branch, opens PR 3, merges;
tags `pa2` on `main` and pushes the tag.

## Before zipping

1. Check the team rows in `README.md`, `PA2.md`,
   `SELF_ASSESSMENT_REPORT.md` — through a PR, since `main` is protected. Then move the tag:
   `git tag -f pa2 && git push -f origin pa2`.
2. Optional: screenshot `https://github.com/<owner>/leetkob/settings/branches` to
   `docs/evidence/branch-protection.png` (same PR).
3. Re-read `SELF_ASSESSMENT_REPORT.md` and change any mark you do not agree with; the total
   goes in the file name.

```sh
scripts/pa2-zip.sh 23120279-23120321-23120322 <total>
```

Submit the zip from a `<StudentID>@student.hcmus.edu.vn` account.
