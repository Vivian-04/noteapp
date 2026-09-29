# JavaScript rules

Read this before writing or changing any `.js` file.

## Style

- ES modules only (`<script type="module">`), with named `export { … }` at the bottom of the file.
- `const`/`let`, arrow functions for callbacks, 2-space indent, single quotes, semicolons.
- Each page script has small `setupX()` functions and one `initializeXPage()` that calls them in order.
- Look up elements with `getDocument(id, 'id')` from `getDocument.js`, the project's helper. `document.querySelector` is fine for class or complex selectors.
- Guard every element before using it (`if (el) …`). Some elements only exist at certain widths or on certain pages.
- Match the surrounding code's comment density: brief comments explaining *why*, no narration.

## Rendering user content

- **Never put user text into `innerHTML`.** Build elements and set `textContent`, as `renderTodoItem()` does in `todos.js`. Titles, tags, task text and search queries are all user input.
- The only `innerHTML` allowed is static markup you wrote, or Quill's own editor root.

## Feedback and dialogs

- Report results with `showSuccessToast` / `showErrorToast` from `js/modules/toast.js`. Import them explicitly; they are **not** globals. (A missing import once crashed the font setting.)
- Don't use `alert`, `confirm` or `prompt`. Destructive actions use the in-page modal pattern (`.modal-overlay` + `.modal-container`, closable by Cancel, clicking the backdrop, and Escape), e.g. `#clearModalOverlay` in `todos/todos.html`.
- Validation errors say what's wrong and how to fix it ("Please enter a task"), not just "Invalid".
- Don't toast routine successes that are already visible on screen (e.g. adding a task). Toast outcomes the user can't otherwise see.

## Forms

- Handle `submit` with `e.preventDefault()`. Never post anywhere.
- Mark the invalid input (`.has-error` or `aria-invalid="true"`) and clear the mark on the next input.

## Responsiveness in JS

- Breakpoints in JS must match CSS: mobile `<= 768`, tablet `769–1024`, desktop `>= 1025`.
- Debounce resize and search handlers (the existing code uses 200–300 ms).

## Accessibility

- Icon-only buttons need an `aria-label`. Decorative images get `alt=""` and `aria-hidden="true"`.
- Keep `aria-current="page"` on the active nav item and `aria-selected` on active filter tabs up to date.
- Everything clickable must be a `<button>` or `<a>`, never a `<div>` with a click handler.
