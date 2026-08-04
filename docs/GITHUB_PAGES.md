# GitHub Pages Guide

Deploy ANIS OS to GitHub Pages.

---

## Option A — Root (custom domain)

1. Push the repo to GitHub.
2. Go to the repository **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select the `main`
   branch and the **root** (`/`) folder.
4. Set a **Custom domain** (recommended) — e.g. `https://anis.dev` — and add the CNAME.
5. Update the canonical / sitemap URLs to your domain (see DEPLOYMENT.md).

Everything is relative (`./`, `assets/...`) so the site works at the domain root.

## Option B — Project site (`https://<user>.github.io/<repo>/`)

If you host under a repo sub-path (no custom domain):

1. The **relative paths already handle this** — `start_url: "./"`, `scope: "./"`,
   `register('./sw.js')`, and `assets/js/...` are all relative.
2. Confirm the repository name matches the sub-path exactly.
3. Service worker scope is limited to the directory it lives in (the repo root), which is
   correct for a project site.

## 404 / SPA fallback

- `404.html` is served by GitHub Pages for missing paths and shows a branded 404.
- The site is a single page with hash navigation, so there are no client routes to fall
  back to — deep links render the SPA at the root.
- `404.html` also accepts `?to=/path#anchor` for programmatic redirects.

## Custom domain (optional)

```
# In repository Settings → Pages → Custom domain, add:
anis.dev
```
Then create a `CNAME` file in the repo root containing your domain (only when not using
the GitHub-provided sub-path).

## Known limits on GitHub Pages

- Static content only — there is no server. Data feeds must be static (`assets/data/`)
  or pull from an external API (the Developer Dashboard is designed to degrade).
- The service worker requires HTTPS — GitHub Pages serves HTTPS automatically.