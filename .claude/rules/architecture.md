# Architecture rules

Read this when adding a page, moving files, or touching navigation and asset paths.

## Pages

Each page is a standalone HTML file with one module script:

| Page                     | Script                     | Access      |
|--------------------------|----------------------------|-------------|
| `index.html`             | `js/pages/landing.js`      | public      |
| `auth/*.html`            | `js/pages/<name>.js`       | guests only |
| `notes/notes.html`       | `js/pages/notes.js` (+ `notes-list.js`) | logged in |
| `todos/todos.html`       | `js/pages/todos.js`        | logged in   |
| `settings.html`          | `js/pages/settings.js`     | logged in   |

- Logged-in pages call `requireAuth()` first thing in their init function and return if it fails.
- Guest pages call `requireGuest()`.
- Every page script ends with the same bootstrap:
  ```js
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeXPage);
  } else {
    initializeXPage();
  }
  ```

## Folder depth matters

Pages live at two depths: the root (`index.html`, `settings.html`) and one folder down (`auth/`, `notes/`, `todos/`). Asset and link paths are relative, so a page's depth decides its prefix (`./` or `../`).

Several modules detect the current folder by looking at `location.pathname`:

- `js/modules/router.js`: `navigateTo()` checks for `/auth` and `/notes`/`/todos`
- `js/modules/toast.js`: icon paths check `/auth/`, `/notes/`, `/todos/` (two places)

**If you add a new subfolder page, update both files**, or redirects and toast icons will 404. Grep for `includes('/notes` to find every spot.

`js/modules/themes.js` and `notes.js` instead look for `../` in an existing `src`. That keeps working as long as the page uses relative paths.

## Adding a new logged-in page

1. Create `<folder>/<name>.html`. Copy the sidebar, the desktop header, the mobile header and the mobile bottom nav from `todos/todos.html`.
2. Add a nav entry to **every** logged-in page: the desktop sidebar (`.sidebar-nav`) and the mobile bottom nav (`.mobile-bottom-nav`) in `notes/notes.html`, `todos/todos.html` and `settings.html`.
3. Put page styles in `css/pages/<name>.css` and link it after `styles.css` and `base.css`.
4. Update `router.js` and `toast.js` as described above.
5. Add a card to the landing page's features grid if it's a user-facing feature. Keep the grid count even (currently 8).

## Deep links

`notes/notes.html` supports `#archived`, `#search` and `#tags` (see `applyHashRoute()` in `notes.js`). Other pages link to these instead of duplicating logic. Use bare tokens only, no `#key=value`.

## Cross-module state on `window`

The notes page shares state through `window.*` globals (`window.renderNotes`, `window.currentNoteId`, `window.setActiveView`, `window.hideEditor`, …). This is existing code; don't spread it further. New pages (like `todos.js`) keep state in module-level variables. Only put something on `window` when an existing notes-page function needs to call it.
