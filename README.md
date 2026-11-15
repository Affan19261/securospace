# SecuroSpace

SecuroSpace is a privacy-first personal productivity platform that combines a daily task planner, habit tracker, finance ledger, and encrypted vault in one secure home.

## Project structure

- `index.html` — landing page for the SecuroSpace website
- `styles.css` — design system, layout, and responsive styling
- `script.js` — small script for dynamic site behavior
- `assets/` — brand assets and favicon
- `CNAME` — domain configuration for `securospace.com`

## Run locally

From the project root, start a static server:

```bash
python -m http.server 3000
```

Then open:

```text
http://localhost:3000
```

## Deployment

This project is prepared for a custom domain setup. The `CNAME` file points the site to `securospace.com` for GitHub Pages or similar static hosting.

