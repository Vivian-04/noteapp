# AGENTS.md

Notely is a note-taking app with a built-in to-do list. It is a static site in plain HTML, CSS and ES-module JavaScript, with no framework, no build step and no backend. All data lives in the browser's `localStorage`.

This file stays short on purpose. The detailed rules live in `.claude/rules/`. **Before starting a task, read the rule files listed for it below.** Don't load them all up front.

## Rule index

| When you are…                                              | Read                                   |
|------------------------------------------------------------|----------------------------------------|
| Adding a page, moving files, or touching routing/paths     | `.claude/rules/architecture.md`        |
| Reading or writing notes, tasks, users or settings data    | `.claude/rules/data-and-storage.md`    |
| Writing or changing JavaScript                             | `.claude/rules/javascript.md`          |
| Writing or changing CSS, layout, theming or icons          | `.claude/rules/styling.md`             |
| Verifying a change, before any commit                      | `.claude/rules/testing.md`             |
| Committing, pushing, or opening a PR                       | `.claude/rules/git.md`                 |
| Deploying, or adding any external dependency               | `.claude/rules/deployment.md`          |

## Agent roles

Role definitions live in `.claude/agents/`. Each one lists the rules that role must follow.

- `feature-builder`: builds or changes features end to end.
- `ui-reviewer`: reviews layout, responsiveness, theming and accessibility.
- `qa-tester`: runs the user flows in a real browser and reports failures.

## Always-on rules

These apply to every task, so they live here instead of in a rule file.

1. **No build tooling.** Don't add npm packages, bundlers, frameworks or TypeScript. Ship files the browser runs as-is.
2. **No external runtime requests.** Vendor third-party code under `assets/vendor/` (Quill already lives there).
3. **Keep changes scoped.** Fix what the task asks for. Report unrelated problems instead of fixing them silently.
4. **Every UI change must work at 1440px, 900px and 375px, in both light and dark theme.**
5. **Never break existing user data.** Changing a stored shape needs a migration; see `data-and-storage.md`.
6. **Verify before you claim it works.** Run the relevant flows from `testing.md` and report what you actually ran.

## Quick start

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

## Map

```
index.html             Landing page (public)
auth/                  Login, signup, forgot/reset password (guests only)
notes/notes.html       Notes app (auth required)
todos/todos.html       To-do list (auth required)
settings.html          Theme, font, password (auth required)
js/modules/            Shared: auth, authGuard, router, storage, themes, toast, passwordInput
js/pages/              One script per page
css/pages/, css/components/   Page and component styles; global styles in styles.css
variables.css          Design tokens (colors, spacing, type, radii, z-index)
data.json              Sample notes
```
