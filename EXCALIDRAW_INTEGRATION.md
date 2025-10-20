# Excalidraw Frontend Integration Guide

This document provides a conceptual approach for rendering Excalidraw drawings on the frontend using the official `@excalidraw/excalidraw` npm package.

## Overview

The build script now processes `.excalidraw.md` files and generates placeholder `<div>` elements with the class `excalidraw-embed` for embedded drawings. The Excalidraw JSON data is stored in the `site-data.json` file under the `excalidrawData` property for pages with type `"excalidraw"`.

## Backend Changes

The Python `build.py` script has been modified to:

1. **Detect Excalidraw embeds**: The `MarkdownConverter` now recognizes `![[filename.excalidraw]]` or `![[filename.excalidraw.md]]` syntax and creates placeholder div elements instead of image tags.

2. **Generate placeholder HTML**: Excalidraw embeds are converted to:
   ```html
   <div class="excalidraw-embed" data-excalidraw-target="path/to/drawing.excalidraw.md"></div>
   ```

3. **Extract JSON data**: The script extracts the Excalidraw JSON data from the first `json` code block in `.excalidraw.md` files.

4. **Store in site-data.json**: Pages with Excalidraw data have:
   - `type`: `"excalidraw"`
   - `excalidrawData`: The extracted JSON object containing drawing elements

## Frontend Implementation (Conceptual)

To render the Excalidraw drawings on the client side, you'll need to integrate React and the official Excalidraw component. Here's the recommended approach:

### 1. Install Dependencies

```bash
npm install react react-dom @excalidraw/excalidraw
```

### 2. Add React to Your HTML

Update `index.html` to include React and ReactDOM:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vault</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Your existing app shell -->
  <div data-app-shell>
    <!-- ... existing content ... -->
  </div>
  
  <!-- Load React, ReactDOM, and Excalidraw -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script type="module" src="excalidraw-renderer.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
```

### 3. Create Excalidraw Renderer Module

Create a new file `excalidraw-renderer.js`:

```javascript
// excalidraw-renderer.js
import { Excalidraw } from '@excalidraw/excalidraw';

/**
 * Initialize all Excalidraw embeds on the page
 * @param {Object} siteData - The site-data.json object containing all pages
 */
export function initializeExcalidrawEmbeds(siteData) {
  // Find all placeholder divs
  const embeds = document.querySelectorAll('.excalidraw-embed');
  
  embeds.forEach(embedDiv => {
    const target = embedDiv.dataset.excalidrawTarget;
    if (!target) return;
    
    // Look up the page by various methods (alias, path, etc.)
    const pageId = resolvePageId(target, siteData);
    if (!pageId) {
      console.warn(`Could not resolve Excalidraw target: ${target}`);
      return;
    }
    
    const page = siteData.pages[pageId];
    if (!page || page.type !== 'excalidraw' || !page.excalidrawData) {
      console.warn(`No Excalidraw data found for: ${target}`);
      return;
    }
    
    // Render the Excalidraw component
    renderExcalidraw(embedDiv, page.excalidrawData);
  });
}

/**
 * Resolve a target string to a page ID
 * @param {string} target - The target from the embed (e.g., "drawing.excalidraw.md")
 * @param {Object} siteData - The site data object
 * @returns {string|null} The page ID or null if not found
 */
function resolvePageId(target, siteData) {
  // Check alias index
  const lowerTarget = target.toLowerCase();
  if (siteData.aliasIndex && siteData.aliasIndex[lowerTarget]) {
    return siteData.aliasIndex[lowerTarget];
  }
  
  // Check path index
  if (siteData.pathIndex && siteData.pathIndex[target]) {
    return siteData.pathIndex[target];
  }
  
  // Try to find by matching page IDs or paths
  for (const [pageId, page] of Object.entries(siteData.pages)) {
    if (pageId === target || page.relPath === target) {
      return pageId;
    }
    // Check if target matches the filename
    const pageName = pageId.split('/').pop();
    const targetName = target.split('/').pop();
    if (pageName === targetName) {
      return pageId;
    }
  }
  
  return null;
}

/**
 * Render an Excalidraw drawing into a container
 * @param {HTMLElement} container - The container div
 * @param {Object} excalidrawData - The Excalidraw JSON data
 */
function renderExcalidraw(container, excalidrawData) {
  // Create a wrapper for the Excalidraw component
  const wrapper = document.createElement('div');
  wrapper.className = 'excalidraw-wrapper';
  wrapper.style.width = '100%';
  wrapper.style.height = '500px'; // Adjust as needed
  wrapper.style.border = '1px solid #e0e0e0';
  wrapper.style.borderRadius = '4px';
  wrapper.style.marginTop = '1rem';
  wrapper.style.marginBottom = '1rem';
  
  // Replace the placeholder div with the wrapper
  container.replaceWith(wrapper);
  
  // Use React to render the Excalidraw component
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  
  const ExcalidrawComponent = React.createElement(Excalidraw, {
    initialData: excalidrawData,
    viewModeEnabled: true, // Read-only mode
    zenModeEnabled: false,
    gridModeEnabled: false,
    theme: 'light',
    renderTopRightUI: () => null, // Hide unnecessary UI elements
    renderFooter: () => null,
  });
  
  const root = ReactDOM.createRoot(wrapper);
  root.render(ExcalidrawComponent);
}

// Export for use in app.js
window.initializeExcalidrawEmbeds = initializeExcalidrawEmbeds;
```

### 4. Update app.js

In your `app.js`, call `initializeExcalidrawEmbeds()` after rendering page content:

```javascript
// In your renderPage() function, after setting the page content:
function renderPage(pageId) {
  // ... existing code to render page content ...
  
  dom.pageContent.innerHTML = page.html;
  
  // Initialize Excalidraw embeds after content is rendered
  if (window.initializeExcalidrawEmbeds) {
    window.initializeExcalidrawEmbeds(state.site);
  }
  
  // ... rest of your rendering code ...
}
```

### 5. Alternative: ES Modules Build

If you prefer a module bundler approach (recommended for production):

```javascript
// excalidraw-renderer.mjs
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Excalidraw } from '@excalidraw/excalidraw';

// ... same implementation as above, but using ES6 imports
```

Then build with a bundler like Vite, Webpack, or Rollup:

```bash
# Using Vite
npm install -D vite
npx vite build
```

### 6. Styling Considerations

Add CSS to ensure Excalidraw renders properly:

```css
/* In styles.css */
.excalidraw-wrapper {
  width: 100%;
  min-height: 400px;
  max-height: 600px;
  margin: 1.5rem 0;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  overflow: hidden;
}

.excalidraw-embed {
  /* Placeholder styling before React mounts */
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  margin: 1rem 0;
}

.excalidraw-embed::before {
  content: 'Loading Excalidraw drawing...';
  color: #666;
  font-style: italic;
}
```

## Usage Example

In your Obsidian vault:

1. Create an Excalidraw drawing: `My Diagram.excalidraw.md`
2. Embed it in another note: `![[My Diagram.excalidraw.md]]`
3. Run the build script: `python build.py vault -o docs`
4. The frontend will automatically render the drawing in view-only mode

## Notes

- The drawings are rendered in **view-only mode** to prevent accidental modifications
- The Excalidraw component is loaded only when needed
- All drawing data is embedded in `site-data.json`, so no separate requests are needed
- The approach is fully compatible with static hosting (GitHub Pages, Netlify, etc.)

## Troubleshooting

- **Drawing not showing**: Check browser console for errors. Verify that the page has `type: "excalidraw"` and `excalidrawData` in site-data.json.
- **React not loaded**: Ensure React and ReactDOM are loaded before the Excalidraw component.
- **Module errors**: If using ES modules, ensure your server supports module MIME types or use a bundler.
