# Styling rules

Read this before writing or changing CSS, layout, theming or icons.

## Files

- `variables.css`: design tokens and `@font-face`. It's imported by `styles.css` and `base.css`; don't link it directly.
- `styles.css`: global styles, including the shared app shell (sidebar, headers, bottom nav, modals). It starts with the global reset (`box-sizing: border-box`, zero body margin).
- `base.css`: font-theme switching and utilities (`.sr-only`, `.hidden`, animations).
- `css/pages/<page>.css`: styles for one page. **New page styles go here, not into `styles.css`.**

## Tokens

Use tokens from `variables.css`. Don't write raw values:

- Colors: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border-color`, `--accent-color`, `--accent-hover`, `--accent-light`, `--error-color`, `--success-color`, `--warning-color`, and the `--neutral-0…950` scale.
- Spacing `--spacing-xs…2xl`, type `--font-size-xs…3xl`, radii `--radius-sm…xl`, shadows `--shadow-sm…xl`, motion `--transition-fast|base|slow`, layering `--z-*`.

Don't hardcode `#FFFFFF` backgrounds. It breaks dark mode under the "system" theme; use `var(--bg-primary)`. White text on the accent button is fine.

## Theming

The theme is set by `data-theme` on `<html>`: `light`, `dark` or `system`.

- Theme-sensitive colors should come from the semantic tokens, which already switch.
- When a component needs a dark-specific override, write it as `[data-theme="dark"] .thing { … }` in the same file as the base rule.
- Icons are black SVGs. In dark mode `themes.js` adds `.icon-theme-white` to every `<img>` automatically. Don't recolor icons by hand. Use CSS shapes (not `<img>`) for things that must keep their own color, like the task checkbox tick.
- New icons: 24×24 viewBox, `#0E121B` fill or stroke, saved in `assets/images/icon-<name>.svg`.

## Breakpoints and layout

| Range        | Query                                          | Layout                                             |
|--------------|------------------------------------------------|----------------------------------------------------|
| Desktop      | `min-width: 1025px`                            | Fixed 242px sidebar + content grid                 |
| Tablet       | `min-width: 769px and max-width: 1024px`       | No sidebar; mobile header + bottom nav             |
| Mobile       | `max-width: 768px`                             | Same as tablet, tighter padding, icon-only bottom nav |

- Elements that only show on tablet/mobile (like `.mobile-page-title`) must be hidden in the `min-width: 1025px` block.
- Bottom nav items are `flex: 1` with `max-width: 80px`, so 6 items fit at 375px. Don't give them fixed widths.
- Scrolling content on tablet/mobile needs `padding-bottom` of at least `80px` so the fixed bottom nav doesn't cover it.
- The page must **never scroll horizontally**. Flex/grid children holding text need `min-width: 0`; let rows wrap.
- Use `gap` for spacing between siblings, not margins on each child.

## Cascade hygiene

- `styles.css` is long and has repeated media blocks. Before adding an override, grep for the selector and extend the existing rule instead of stacking another one.
- Avoid `!important` except to beat existing `!important` rules; if you add one, say why in a comment.
- Check that a later base rule doesn't silently undo your media-query rule. Order matters in this file (see `.editor-title-input`).
