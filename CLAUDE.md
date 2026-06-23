# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static personal CV/portfolio website for Pau Díaz Masero, deployed on GitHub Pages at `https://pdiazmas.github.io`. It is a single-page application with no build system, no package manager, and no dependencies to install.

## Local Development

Since there is no build step, open `index.html` in a browser. However, `js/populateHTML.js` uses ES module syntax (`import`), so it **must** be served over HTTP — it will not work when opened as a `file://` URL. Use any simple static server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Deployment is automatic: pushing to `main` triggers GitHub Pages to publish the site.

## Architecture

All CV content lives exclusively in `db/db.js` as a single default-exported JavaScript object. This is the only file to edit when updating CV data.

`js/populateHTML.js` imports that data and dynamically builds the DOM for every dynamic section: languages (progress bars), projects (accordion cards), experience and education (timeline entries). Static sections like "Sobre mí" and the contact links are hardcoded in `index.html`.

`js/main.js` handles all UI behaviour: scroll-triggered animations via jQuery Waypoints, sidebar navigation highlighting, mobile off-canvas menu, dark/light mode toggling, accordion, and scroll-to-top.

### Data shape in `db/db.js`

```
{
  languages: [{ title, skillName, color, percentage }],
  projects: {
    web: [{ projectName, image, summary, preview, techStack[] }],
    literature: [...],
    freelance: [...]
  },
  experience: [{ title, duration, subtitle, details[], tags[] }],
  education:  [{ title, duration, subtitle, details[], tags[] }]
}
```

> Note: `populateHTML.js` also calls `populateLinks(data.footer, "footer")`, but `db.js` has no `footer` key — this call silently no-ops.

### Styling conventions

- Accent color is `#f9bf3f` (yellow/gold), used inline and in CSS.
- Dark mode adds `.dark-mode` to `<body>`; light mode adds `.light-mode`. Both are toggled in `js/main.js` and auto-applied based on `prefers-color-scheme`.
- Bootstrap 3 (via CDN) provides the grid and utility classes. Custom styles are in `css/style.css`.
- `js/ext/` contains vendored copies of jQuery and its plugins; do not modify these files.

### External services

- **EmailJS** — contact form submission; the public key is initialized inline in `index.html`.
- Google Fonts and CDN-hosted Bootstrap/animate.css are loaded from external URLs.
