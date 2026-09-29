# Git rules

Read this before committing, pushing or opening a PR.

## Remote and branches

- Remote: `origin` → `https://github.com/Vivian-04/noteapp.git`
- `main` is the deployed branch. Every push to it can go live.
- Do feature work on a branch (`feature/<short-name>` or `fix/<short-name>`) and merge through a PR, unless the owner asks for a direct commit to `main`.
- Never force-push to `main` or rewrite its published history without the owner's explicit say-so.

## Authorship

- Commits are authored and committed as **Viv** `<ifechukwudenduka@gmail.com>`.
- **Don't add AI attribution** to commits or PRs: no `Co-Authored-By` lines, no session links, no tool footers.

## Commits

- Commit only after the checks in `testing.md` pass.
- One logical change per commit. Don't mix a refactor with a feature.
- Subject line in the imperative mood, at most 72 characters, no trailing period ("Add due-date sorting to tasks").
- Add a body only when the *why* isn't obvious from the diff.
- Never commit secrets, `.env` files, `node_modules`, screenshots or scratch test scripts.

## Pull requests

- Title: same style as a commit subject.
- Body: what changed, why, and how you tested it (which flows, which widths), with screenshots for UI changes.
