# Theme Guide

ANIS OS ships a full theme engine (`assets/js/theme.js`) with **dark**, **light** and
**auto** modes, persisted choice, and an animated transition.

---

## Architecture

```
ThemeEngine (orchestrator)
 ├─ ThemeStorage   — localStorage persistence
 ├─ ThemeEvents    — CustomEvent emitter (`theme:changed`, `theme:loaded`, …)
 ├─ ThemeAnimations — 400ms blur/scale color-morph transition
 ├─ themes         — curated palettes (dark / light)
 └─ modes          — auto / light / dark
```

Public API: `window.ANIS_OS_THEME`

```js
window.ANIS_OS_THEME.toggleTheme();   // dark ⇄ light
window.ANIS_OS_THEME.setTheme('dark');
window.ANIS_OS_THEME.setMode('auto');
window.ANIS_OS_THEME.getTheme();
window.ANIS_OS_THEME.openPanel();
```

## How themes are applied

Each theme id maps to a `body.theme--<id>` class. The `:root` tokens in
`assets/css/style.css` switch values for light vs. dark (see the `[data-theme="light"]`
selector and token overrides). Adding a new theme means:

1. Add a new palette block in `assets/css/style.css` (overriding `--color-*`).
2. Register the theme in `theme.js` `THEMES` / `THEME_ORDER`.
3. Add it to the panel (theme.js builds the panel from `THEMES`).

## Keyboard

| Shortcut | Action | Owner |
|----------|--------|-------|
| `Ctrl + Shift + T` | Open theme panel | theme.js |
| `Alt + T` | Quick toggle | theme.js |
| `Shift + T` | Toggle theme (+ toast) | interaction.js |
| Palette → Theme | Switch via command palette | interaction.js |

## Reduced motion

Theme transitions respect `prefers-reduced-motion` — the color morph is skipped and
switches apply instantly.