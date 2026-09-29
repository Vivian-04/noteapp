# Notely: Notes + To-Do

A note-taking app with a built-in to-do list, built mostly by working with AI coding tools. It's plain HTML, CSS and JavaScript with no build step, so any static host can serve it.

## Features

- **Notes**: create, edit, archive/restore and delete notes in a rich text editor (Quill).
- **To-do list**: add tasks, mark them done, edit them inline (double-click or the pencil icon) and delete them.
  - Priorities (low / medium / high) and optional due dates, with "Today", "Tomorrow" and **Overdue** labels
  - Filters: All, Active, Done, Overdue, plus sorting by newest, due date or priority
  - Progress bar, search, and a "Clear done" action
- **Extras**: tag filtering, instant search, light/dark/system theme, custom fonts, change password, and sample notes.
- Responsive layouts for desktop, tablet and mobile.

Accounts and data are stored in the browser's `localStorage`. There's no backend, so each browser keeps its own data.

## Run locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy

**Vercel**: import the repo with Framework Preset set to "Other", no build command, and the root directory as the output directory.

**Netlify**: drag the project folder into the Netlify dashboard, or connect the repo with no build command and publish directory `.`.

## Project structure

```
index.html            Landing page
auth/                 Login, signup, forgot/reset password
notes/notes.html      Notes app
todos/todos.html      To-do list
settings.html         Theme, font, password settings
js/modules/           Shared modules (auth, storage, theme, router, toast)
js/pages/             Page scripts
css/                  Page and component styles
assets/vendor/quill/  Bundled Quill editor
```

## Working with AI agents

Agent instructions live in `AGENTS.md` (Claude Code picks them up through `CLAUDE.md`). Detailed project rules are in `.claude/rules/`, and agent role definitions are in `.claude/agents/`.
