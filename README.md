# Obsidian Vault SPA Builder

This repository recreates a static Single Page Application that mirrors an Obsidian vault. Running the build pipeline converts Markdown notes into HTML, emits navigation metadata, and refreshes a client-side experience ready for GitHub Pages or any static host.

## Quick Start

```bash
python build.py examples/sample-vault -o docs
```

- `examples/sample-vault` contains a miniature vault used for validation.
- `docs/` is the output folder served by GitHub Pages. The command above rewrites its contents with fresh assets, metadata, and copied media.

## Project Layout

- `build.py` — CLI builder that walks a vault, converts Markdown, assembles metadata, and copies assets.
- `templates/` — source of the SPA shell (`index.html`, `app.js`, `styles.css`). Each build mirrors these files into `docs/`.
- `docs/` — generated site. After running the build it holds the SPA shell plus `site-data.json` and any copied assets.
- `examples/sample-vault/` — example vault used for regression checks.

## Build Pipeline

The builder performs the following steps:

1. Validates every published directory contains a `README.md` or `README.html` (except folders named `graphics`).
2. Parses Markdown with a lightweight converter that supports headings, lists, fenced code, inline formatting, images, and Obsidian-style wiki links.
3. Emits `site-data.json` with:
   - metadata (generation timestamp, source path, home/about page ids, title),
   - a page dictionary (html fragments, aliases, relations),
   - directory listings (children, readme references),
   - alias/path indexes for client-side routing.
4. Copies non-Markdown assets into the output folder while preserving the relative structure.
5. Rehydrates `docs/` with the SPA shell from `templates/`.

## Front-End Overview

The vanilla JavaScript SPA in `docs/app.js`:

- Fetches `site-data.json`, maps aliases, and wires navigation controls.
- Implements hash-based routing with breadcrumb generation (`Root` crumb first, folders for readme pages, titles for leaf notes).
- Renders directory and file panels that highlight the active entry and enable instant navigation.
- Rewrites wiki links and relative anchors to internal routes, flagging broken links in-place.
- Displays friendly error states when critical data is missing.

## Regeneration Workflow

1. Update or add content within your source vault.
2. Run `python build.py /path/to/vault -o docs`.
3. Commit the refreshed `docs/` folder. GitHub Pages can host the SPA directly.
4. Keep `templates/` in sync with any front-end edits so future builds stay aligned.

## Validation

The repository ships with `examples/sample-vault`. After modifying the pipeline, rebuild the example vault and open `docs/index.html` in a browser. Verify that navigation works, breadcrumbs are correct, and media assets (e.g., `graphics/vault-diagram.svg`) load as expected.
