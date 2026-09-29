# Data and storage rules

Read this before reading or writing any persisted data.

## Where data lives

Everything lives in the browser. There is no server and no sync between devices.

| Key                               | Store          | Contents                                  |
|-----------------------------------|----------------|-------------------------------------------|
| `notes-auth-users`                | localStorage   | `{ [email]: { email, password, createdAt } }` |
| `notes-current-user`              | localStorage   | `{ email, loggedInAt }`; present means logged in |
| `notes-user-notes-<email>`        | localStorage   | Array of notes                            |
| `notes-user-todos-<email>`        | localStorage   | Array of tasks                            |
| `notes-sample-loaded`             | localStorage   | `'true'` / `'false'`                      |
| `notes-theme`                     | localStorage   | `'light'` / `'dark'` / `'system'`         |
| `fontTheme`                       | localStorage   | `'sans-serif'` / `'serif'` / `'monospace'` |
| `note-draft-<email>`              | sessionStorage | Unsaved new-note draft                    |

## Shapes

```js
// Note
{ id, title, tags: string[], content /* plain text */, lastEdited /* ISO */, isArchived, deleted }

// Task
{ id, text, completed, priority: 'low'|'medium'|'high', dueDate /* 'YYYY-MM-DD' or '' */, createdAt /* ISO */, completedAt /* ISO|null */ }
```

- Note `content` is stored as **plain text**, not HTML. The editor converts on load and save (`formatNoteContentForQuill`, `convertQuillToPlainText` in `notes.js`). Don't store Quill HTML.
- Deleting a note is a soft delete (`deleted: true`). Deleting a task removes it.
- Due dates are local-date strings. Compare them as strings against the local "today" (`getTodayString()` in `todos.js`). Don't parse them with `new Date('YYYY-MM-DD')`, which treats them as UTC and shifts the day.

## Rules

1. **Go through `js/modules/storage.js` or `js/modules/auth.js`.** Don't call `localStorage` directly for notes, tasks or users from page code. Add a helper to the module instead.
2. **Wrap every storage access in try/catch.** Storage can throw (private mode, quota). Save helpers return `{ success, error }`; callers must check `success` and show `showErrorToast(error)` on failure.
3. **Scope user data by email** using the `<prefix>-<email>` key pattern.
4. **Adding a field:** make it optional and give old records a default when reading. Never assume existing data has the new field.
5. **Renaming or removing a field or key** needs a one-time migration on read. Existing users' data must keep loading.
6. **IDs** come from `generateNoteId()` in `storage.js`, for tasks too.

## Security limits

Passwords are stored in plain text in localStorage. That's acceptable only because this is a local, single-device demo app. Don't add features that suggest real security (e.g. "we'll email you"). If real accounts are ever needed, that means a backend, not more client code.
