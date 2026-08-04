# Customization Guide

Learn how to change content, colors, and interactions without redesigning anything.

---

## Where content lives

Most visible text is authorable directly in `index.html` (static markup). The
Developer Dashboard and a few dynamic feeds pull from `assets/js/data.js` (provide it at
deploy time) and the GitHub API (graceful placeholder).

To change **your name / title / roles / socials / section copy**, edit the matching
landmarks in `index.html`:
- Navbar brand + social icons (`lines ~135–260`)
- Hero (roles are rotated by `Typed.js`, configured under `typed` in `app.js`)
- Each `<section>` keeps its own content and `aria-labelledby`.

## Colors & the Design System

Open `assets/css/style.css` → top `:root` block. The entire theme is token-driven:

```css
--color-primary:    #4F46E5;   /* indigo */
--color-secondary:  #06B6D4;   /* cyan  */
--color-accent:     #8B5CF6;   /* violet */
--color-background: #050816;   /* deep space */
--gradient-brand: linear-gradient(135deg, #4F46E5 0%, #06B6D4 50%, #8B5CF6 100%);
```

Change one token and every glass panel, aurora, glow and gradient follows.

## Interactions (Interaction Engine)

**Command Palette search** — entries are assembled in `assets/js/interaction.js` →
`CommandPalette.buildIndex()`. Add a section, command, or social entry there.

**Cursor labels** — add `data-cursor-label="View"` to any element to show a label;
`data-cursor-glow`, `data-cursor-play`, `data-copy` extend the heuristics.

**Buttons** — add `data-load-state` to a button to demonstrate the loading→success
state machine. Add `data-ripple` for the material ripple.

**Scroll reveal** — use `data-rv="fade|slide|scale|rotate"` (with `data-rv-y`,
`data-rv-delay`) and `data-rv-text` for a word-split reveal.

## Keyboard shortcuts

Defined in `assets/js/interaction.js` → `Shortcuts`. Adjust shortcuts there.
Note: `Ctrl+Shift+A` (dev console) and `Ctrl+Shift+T` / `Alt+T` (theme) are owned by
`app.js`/`theme.js` respectively.

## PWA identity

`manifest.webmanifest` and the `<head>` metadata hold the app name, theme color, and icons.
Swap `assets/icons/*` for your branding.

## Analytics

See the `OPT-IN ANALYTICS` block in `index.html` and `docs/DEPLOYMENT.md`.