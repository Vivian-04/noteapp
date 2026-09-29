# Testing rules

Read this before claiming a change works, and before every commit.

There is no automated test suite. Verify changes in a real browser. Headless Playwright is fine: in cloud sessions Chromium is preinstalled; launch it with `executablePath` rather than running `playwright install`.

## Run the app

```bash
python3 -m http.server 8080
```

Test through the server, not `file://`. ES modules and `fetch('../data.json')` don't work from `file://`.

## Minimum check for any change

1. Load every page you touched at **1440px, 900px and 375px** widths.
2. Check the browser console: **no errors and no 404s**.
3. Confirm there's no horizontal scroll: `document.documentElement.scrollWidth <= innerWidth`.
4. Switch to dark mode and look again.

## Flows to run when related code changes

**Auth**
- Opening `/todos/todos.html` or `/notes/notes.html` while logged out redirects to login
- Sign up → lands on notes
- Log out → log in again with the same credentials

**Notes**
- Create (title + tags + body) → appears in the list
- Edit title → list updates
- Archive → leaves All Notes, appears under Archived → Restore brings it back
- Load sample notes, search (matches title, body and tags), filter by tag (sidebar on desktop, Tags button on mobile)
- Delete → confirm modal → gone
- Mobile: floating + button opens editor; Go Back returns to the list

**To-do**
- Add tasks with and without due dates and at each priority; an empty task is rejected
- Check off a task → progress bar and counts update
- Edit inline (pencil or double-click); Enter saves, Escape cancels
- Filters All / Active / Done / Overdue; sort by newest / due date / priority; search
- Delete a task; Clear done (confirm modal)
- Reload the page → tasks persist

**Settings**
- Color theme applies and persists; font theme applies on all pages
- Change password: a wrong current password is rejected, the new password works at login

## Reporting

State exactly which flows and widths you ran, and quote any failure output. If you couldn't run something, say so; don't write "should work".
