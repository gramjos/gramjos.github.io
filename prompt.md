# Prompt: Recreate This Obsidian Vault SPA

You are an experienced engineer tasked with recreating a static single-page app that mirrors an Obsidian vault. Follow these requirements precisely:

1. **Project Layout**
   - Root files: `build.py`, `README.md`, this prompt, and a `docs/` output directory. Include a `templates/` mirror of the SPA shell used for regeneration.
   - `docs/` must contain `index.html`, `app.js`, `styles.css`, `site-data.json`, and any emitted folders (e.g., graphics).

2. **Build Pipeline (`build.py`)**
   - Accepts CLI args: source vault path (positional) and optional `-o/--output` for destination (default `./docs`).
   - Walk the vault, requiring each published directory to include `README.md` or `README.html` (except directories named exactly `graphics`).
   - Convert Markdown into HTML using a lightweight parser that supports headings, lists, code fences, inline formatting, images, and Obsidian-style wiki links.
   - Emit `site-data.json` with metadata: generation timestamp, source path, `siteTitle`, `homePageId`, optional `aboutPageId`, and a dictionary of page entries containing ids, titles, content fragments, parent relations, directories, files, aliases, and base paths.
   - Copy non-markdown assets (images, etc.) into the output, preserving relative paths.

3. **Front-End (`docs/app.js` + `docs/index.html`)**
   - On load, fetch `site-data.json`, map aliases to ids, wire navigation buttons, handle hash routing, and render pages without full reloads.
   - Breadcrumb algorithm: first crumb labeled `Root`; subsequent crumbs use the parent folder name when sourced from a README, otherwise page title.
   - Render directory and file panels highlighting the active entry, rewrite relative links, and support client-side navigation for vault-internal links.
   - Ensure fatal errors show a readable message in the UI.

4. **Styling (`docs/styles.css`)
   - Provide a centered shell with header navigation, breadcrumb trail, main content pane, sidebar panels, and footer metadata.
   - Use modern, accessible styling (flexbox layout, readable typography, responsive widths up to 960px).

5. **Regeneration Workflow**
   - Running `python build.py <vault_path> -o docs` must fully regenerate the SPA, ready for static hosting (e.g., GitHub Pages).
   - Keep `templates/` synchronized with the emitted assets to serve as a scaffold for future builds.

Produce the complete implementation, validate it with at least one sample vault, and confirm no copy-code button logic exists until reimplemented separately.
