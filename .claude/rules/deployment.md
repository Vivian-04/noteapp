# Deployment rules

Read this before deploying, or before adding anything that loads from outside the repo.

## Hosting

This is a static site with no build step.

- **Vercel:** Framework Preset "Other", build command empty, output directory `.` (the repo root).
- **Netlify:** build command empty, publish directory `.`.

Pushing to `main` redeploys on hosts connected to the repo.

## Paths must survive any hosting location

- Use relative paths only (`./`, `../`). Never root-absolute `/assets/...`: they break if the site is served from a subpath.
- CSS `url()` values resolve from **the CSS file's location**, not the page. `variables.css` sits at the root, so its fonts are `./assets/fonts/...`.
- Links between pages include the `.html` extension (e.g. `../todos/todos.html`). Don't rely on host-level "clean URLs".

## Dependencies

- No runtime CDNs. Vendor third-party files under `assets/vendor/<lib>/` and pin the version in the folder or filename comment. Quill 1.3.7 already lives in `assets/vendor/quill/`.
- Fonts are self-hosted in `assets/fonts/` and declared in `variables.css`.
- Before adding any dependency, ask whether ~50 lines of your own code would do. Usually they will.

## Before you deploy

1. Run the full flow list in `testing.md` against the local server.
2. After deploying, open the live URL, check the console for 404s, then sign up and add one note and one task.
