# Excalidraw Integration

## Overview

This system now supports embedding Excalidraw diagrams in your markdown notes. Excalidraw files are rendered as interactive diagrams using the Excalidraw viewer library.

## How It Works

### 1. Markdown Parser (`builder/markdown.py`)

When the markdown parser encounters an image reference to an `.excalidraw` or `.excalidraw.md` file, it:

1. Resolves the path to the actual `.excalidraw` file (stripping `.md` if present)
2. Uses the asset resolver to normalize the path
3. Generates a special HTML container with:
   - Class `excalidraw-embed` for styling
   - Data attribute `data-excalidraw-src` containing the path to the `.excalidraw` file
   - Unique ID for the container
   - Loading placeholder message

Example markdown:
```markdown
![[my-diagram.excalidraw]]
```

Generated HTML:
```html
<div class="excalidraw-embed" data-excalidraw-src="graphics/my-diagram.excalidraw" id="excalidraw-a1b2c3d4">
    <div class="excalidraw-loading">Loading Excalidraw diagram...</div>
</div>
```

### 2. Client-Side Rendering (`utils/excalidraw.js`)

The JavaScript module provides functions to:

- **Load Libraries**: Dynamically loads React, ReactDOM, and Excalidraw libraries from CDN
- **Load Diagram Data**: Fetches the `.excalidraw` JSON file
- **Render Viewer**: Creates an Excalidraw React component and mounts it in the container

Key functions:
- `loadExcalidrawLibraries()`: Lazy-loads required libraries
- `loadExcalidrawFile(path)`: Fetches and parses the diagram JSON
- `renderExcalidraw(container, path)`: Renders the diagram in the container
- `initializeExcalidrawEmbeds()`: Finds and initializes all embeds on the page

### 3. View Integration (`views/index.js`)

After rendering note content, the view calls `initializeExcalidrawEmbeds()` to:
1. Find all `.excalidraw-embed` elements on the page
2. Extract the diagram path from the `data-excalidraw-src` attribute
3. Render each diagram

### 4. Styling (`styles.css`)

CSS provides:
- Container sizing (600px min-height)
- Border and rounded corners
- Loading state styling
- Responsive behavior

## File Handling

### Build Process

The build script already handles `.excalidraw` files correctly:

1. **Copying**: `.excalidraw` files are copied to the output directory as non-markdown assets
2. **Path Resolution**: The asset resolver (`builder/assets.py`) handles `.excalidraw` files the same way as images, following Obsidian's resolution rules:
   - Check relative path from markdown file
   - Check same directory
   - Search in `graphics` subdirectories up the tree

### Obsidian Compatibility

The system handles both:
- Direct references: `![[diagram.excalidraw]]`
- With markdown extension: `![[diagram.excalidraw.md]]` (automatically strips `.md`)

This matches Obsidian's Excalidraw plugin behavior where `.excalidraw.md` files are created but the actual diagram data is in the `.excalidraw` file.

## Usage

### In Markdown Files

Simply reference the Excalidraw file using Obsidian's image syntax:

```markdown
# My Document

Here's my architecture diagram:

![[system-architecture.excalidraw]]

The diagram above shows...
```

### File Organization

Recommended structure:
```
your-vault/
├── README.md
├── some-note.md
├── graphics/
│   ├── diagram1.excalidraw
│   └── diagram2.excalidraw
└── subdirectory/
    ├── README.md
    ├── another-note.md
    └── graphics/
        └── local-diagram.excalidraw
```

## Technical Details

### Dependencies

The client-side rendering uses:
- React 18 (for component rendering)
- ReactDOM 18 (for DOM operations)
- Excalidraw 0.17.6 (the diagram viewer)

These are loaded dynamically from unpkg.com CDN only when needed.

### Viewer Configuration

Diagrams are rendered with:
- `viewModeEnabled: true` - Read-only by default
- `zenModeEnabled: false` - Show UI chrome
- `gridModeEnabled: false` - No grid overlay

### Performance

- Libraries are loaded once and cached
- Multiple diagrams on the same page share the same library instances
- Lazy loading ensures libraries are only fetched when diagrams are present

## Example

See `add_excalidraw.html` for a standalone proof-of-concept implementation.

The test file `test_excalidraw.md` demonstrates the markdown syntax.

## Troubleshooting

### Diagram Not Showing

1. Check browser console for errors
2. Verify the `.excalidraw` file exists in the expected location
3. Ensure the file was copied to the output directory
4. Check that the path in `data-excalidraw-src` is correct relative to the HTML file

### Loading Errors

If you see "Error loading Excalidraw file", check:
- File path is correct
- File is valid JSON
- Network request succeeded (check Network tab)

### Rendering Issues

If the diagram loads but doesn't display:
- Check if React/Excalidraw libraries loaded successfully
- Look for JavaScript errors in console
- Verify the `.excalidraw` file format is valid
