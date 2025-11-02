# Excalidraw Support Documentation

## Overview
This project now supports **fully interactive** Excalidraw diagrams from `.excalidraw` and `.excalidraw.md` files stored in `graphics` folders within your Obsidian vault. The implementation uses **plain vanilla JavaScript** - no React build tools or bundlers required!

## Architecture: Vanilla JS with ESM Imports

This implementation uses **Excalidraw's browser-based integration** which works with plain HTML, CSS, and JavaScript. Here's how:

### Browser-Based React (No Build Step!)
- Excalidraw is built with React, but we load React from a CDN
- Uses **ES Module imports** (import maps) to share React dependencies
- No npm, no webpack, no build process - just plain files served by a static host

### Key Components
1. **Import Maps** - Tells the browser where to get React from
2. **ESM CDN** - Loads Excalidraw and React from `esm.sh`
3. **Dynamic Imports** - Loads libraries only when needed
4. **LZ-String** - Decompresses Obsidian's Excalidraw format

## How It Works

### 1. Build-Time Processing (Python)
The `builder/markdown.py` module recognizes Excalidraw file references in Markdown:
- `![[diagram.excalidraw]]` (Obsidian-style)
- `![[diagram.excalidraw.md]]` (Obsidian Excalidraw plugin format)

When encountered, it:
1. Automatically appends `.md` extension if needed
2. Resolves the file path using the asset resolution system
3. Generates a `<div>` container with:
   - Unique ID (hash-based)
   - `excalidraw-wrapper` class
   - `data-excalidraw-src` attribute pointing to the `.excalidraw.md` file
   - Default dimensions (100% width, 500px height)

**Example Output:**
```html
<div id="excalidraw-5664979537505791752" 
     class="excalidraw-wrapper" 
     data-excalidraw-src="graphics/t1.excalidraw.md" 
     style="width: 100%; height: 500px;">
</div>
```

### 3. Runtime Rendering (JavaScript)
The `utils/excalidraw.js` module handles client-side rendering using **vanilla JavaScript with dynamic ESM imports**:

**Process:**
1. `initExcalidrawDiagrams()` is called after page content loads
2. Lazily loads Excalidraw library via `import('https://esm.sh/@excalidraw/excalidraw@0.18.0')`
3. Finds all `.excalidraw-wrapper` elements
4. Fetches each `.excalidraw.md` file
5. Parses the Obsidian format:
   - Extracts `compressed-json` code block
   - Decompresses using LZ-String library
   - Parses the JSON scene data
6. **Renders interactive Excalidraw viewer** using React (loaded from CDN):
   - Creates a React root in the container
   - Renders the full Excalidraw component
   - Sets `viewModeEnabled: true` for read-only interaction
   - Supports pan, zoom, and element inspection

### 3. File Format
Excalidraw files are stored in Obsidian's `.excalidraw.md` format:
---
excalidraw-plugin: parsed
tags: [excalidraw]
---

# Excalidraw Data

## Text Elements
here we go! ^UAcMMfcd

%%
## Drawing
```compressed-json
N4KAkARALgngDgUwgLgAQQQDwMYEMA2AlgCYBOuA7hADTgQBuCpAzoQPYB2KqATLZMz...
```
%%
```

## Integration Points

### Views (views/index.js)
After rendering notes content, calls `initExcalidrawDiagrams()`:
```javascript
ctx.mount.innerHTML = buildFileMarkup(result.node, fileHtml);
initExcalidrawDiagrams(); // Initialize Excalidraw diagrams
```

### HTML (index.html)
Includes all necessary dependencies via CDN (no build step):

**Import Maps** for React dependencies:
```html
<script type="importmap">
{
    "imports": {
        "react": "https://esm.sh/react@18.2.0",
        "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
        "react-dom": "https://esm.sh/react-dom@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"
    }
}
</script>
```

**Excalidraw configuration:**
```html
<link rel="stylesheet" href="https://esm.sh/@excalidraw/excalidraw@0.18.0/dist/excalidraw.min.css">
<script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
<script>
    window.EXCALIDRAW_ASSET_PATH = "https://esm.sh/@excalidraw/excalidraw@0.18.0/dist/";
</script>
```

### JavaScript (utils/excalidraw.js)
Uses **dynamic ES module imports** to load Excalidraw on-demand:
```javascript
// Lazy load Excalidraw library (vanilla JS, no bundler!)
const ExcalidrawLib = await import('https://esm.sh/@excalidraw/excalidraw@0.18.0');

// Import React dynamically too
const React = await import('https://esm.sh/react@18.2.0');
const ReactDOM = await import('https://esm.sh/react-dom@18.2.0/client');

// Create React component using createElement (no JSX needed!)
const root = ReactDOM.createRoot(container);
root.render(
    React.createElement(Excalidraw, {
        initialData: sceneData,
        viewModeEnabled: true
    })
);
```

## Usage in Your Vault

### Creating Excalidraw Diagrams
1. In Obsidian, create a diagram using the Excalidraw plugin
2. Save it in a `graphics` folder (e.g., `graphics/my-diagram.excalidraw.md`)
3. Reference it in any Markdown file: `![[my-diagram.excalidraw]]`

### Build and Deploy
```bash
python build.py ~/Documents/YourVault
```

The build process will:
- Copy `.excalidraw.md` files to the output `graphics` folder
- Generate HTML with Excalidraw containers
- Preserve all diagram data for client-side rendering

## Current Limitations

1. **Static Preview Only**: Currently renders a text-based preview, not the full interactive diagram
2. **No Editing**: Diagrams are read-only in the web view
3. **Compressed Data**: Requires LZ-String library for decompression

## Future Enhancements

### Editable Mode
To allow editing diagrams in the browser:
```javascript
root.render(
    React.createElement(Excalidraw, {
        initialData: sceneData,
        viewModeEnabled: false, // Enable editing
        onChange: (elements, appState, files) => {
            // Save changes back to server
            console.log('Diagram updated', elements);
        }
    })
);
```

### Local Caching
Cache loaded diagrams for faster subsequent loads:
```javascript
const diagramCache = new Map();
if (diagramCache.has(src)) {
    return diagramCache.get(src);
}
// ... fetch and parse ...
diagramCache.set(src, sceneData);
```

## Troubleshooting

### Diagrams Not Appearing
1. **Check file extension**: Ensure files are `.excalidraw.md` (with `.md`)
2. **Verify location**: Files must be in a `graphics` folder
3. **Check browser console**: Look for fetch errors or parsing issues
4. **Inspect HTML**: Verify `data-excalidraw-src` path is correct

### Path Issues
If diagrams show "Error loading diagram":
- Check that the `.excalidraw.md` file exists in `output/graphics/`
- Verify the relative path in the generated HTML
- Ensure the file was copied during the build process

### Decompression Failures
If you see "Decompression failed":
- Verify LZ-String library is loaded (check Network tab)
- Check that the `compressed-json` block is valid
- Try opening the file in Obsidian to verify it's not corrupted

## Technical Architecture

```
Markdown File (Source)
    ↓
![[diagram.excalidraw]]
    ↓
builder/markdown.py (Build Time)
    ↓
<div class="excalidraw-wrapper" data-excalidraw-src="...">
    ↓
views/index.js (Runtime)
    ↓
utils/excalidraw.js
    ↓
Fetch & Parse .excalidraw.md
    ↓
LZ-String Decompression
    ↓
JSON Scene Data
    ↓
Rendered Preview (Current)
OR
SVG/Interactive Diagram (Future)
```

## Files Modified

### Python (Build)
- `builder/markdown.py` - Added Excalidraw file detection and HTML generation
- `builder/assets.py` - Asset resolution system (unchanged, already handles .md files)

### JavaScript (Runtime)
- `utils/excalidraw.js` - New module for Excalidraw rendering
- `views/index.js` - Added `initExcalidrawDiagrams()` calls
- `index.html` - Added LZ-String library

### Test Files
- `try1_ready_2_serve/Welcome.html` - Example output
- `try1_ready_2_serve/graphics/t1.excalidraw.md` - Example source file

## Example

**Input Markdown** (`Welcome.md`):
```markdown
## hi there
![[t1.excalidraw]]
```

**Generated HTML** (`Welcome.html`):
```html
<h2>hi there</h2>
<div id="excalidraw-5664979537505791752" 
     class="excalidraw-wrapper" 
     data-excalidraw-src="graphics/t1.excalidraw.md" 
     style="width: 100%; height: 500px;">
</div>
```

**Rendered Output** (in browser):
```
[Fully Interactive Excalidraw Diagram]
- Pan with mouse drag or spacebar
- Zoom with scroll wheel
- Click elements to select
- View properties panel
- All drawing tools visible but disabled (view-only mode)
```

## Why This Works Without a Bundler

This implementation leverages modern browser features that make React and Excalidraw work without build tools:

### 1. **ES Modules (ESM)**
Modern browsers natively support `import` statements:
```javascript
import { Excalidraw } from 'https://esm.sh/@excalidraw/excalidraw';
```

### 2. **Import Maps**
Tells the browser where to find dependencies:
```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0"
  }
}
</script>
```

### 3. **ESM CDN (esm.sh)**
Converts npm packages to browser-compatible ES modules on-the-fly:
- Handles CommonJS → ESM conversion
- Resolves transitive dependencies
- Provides TypeScript types
- Caches aggressively

### 4. **React Without JSX**
Uses `React.createElement()` instead of JSX:
```javascript
// Instead of: <Excalidraw initialData={data} />
React.createElement(Excalidraw, { initialData: data })
```

### 5. **Dynamic Imports**
Loads code only when needed:
```javascript
const ExcalidrawLib = await import('https://esm.sh/@excalidraw/excalidraw');
```

This approach is perfect for static sites because:
- ✅ No npm install
- ✅ No build step
- ✅ No node_modules folder
- ✅ Works on any static host (GitHub Pages, Netlify, etc.)
- ✅ Automatic updates when CDN packages update
- ✅ Browser handles all module resolution

- [Excalidraw Docs](https://docs.excalidraw.com/)
- [Excalidraw Integration Guide](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)
- [LZ-String Library](https://github.com/pieroxy/lz-string)
- [Obsidian Excalidraw Plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin)
