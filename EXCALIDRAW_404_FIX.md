# Excalidraw 404 Fix - Root Cause Analysis

## Problem

When navigating to a note containing an Excalidraw diagram (e.g., `/notes/welcome`), the browser showed:
```
Error loading diagram: Failed to load Excalidraw file: 404
```

## Root Cause

The issue was a **relative path resolution problem** in the SPA's dynamic content loading:

### How It Happened

1. **Build Time** (`builder/markdown.py`):
   - Generated HTML: `<div data-excalidraw-src="graphics/t1.excalidraw.md">`
   - This is a **relative path**

2. **Content Store** (`notes/content-store.js`):
   - The `fetchHtml()` function fetches HTML fragments
   - The `rewriteRelativeUrls()` function rewrites `<img src="...">` to absolute paths
   - **BUT**: It didn't rewrite `data-excalidraw-src` attributes!

3. **Runtime** (when viewing `/notes/welcome`):
   - Browser URL: `http://localhost:8000/notes/welcome`
   - HTML contains: `data-excalidraw-src="graphics/t1.excalidraw.md"`
   - JavaScript tries to fetch: `http://localhost:8000/notes/graphics/t1.excalidraw.md` ❌
   - Actual file location: `http://localhost:8000/try1_ready_2_serve/graphics/t1.excalidraw.md` ✓

### Why Images Worked But Excalidraw Didn't

The `rewriteRelativeUrls()` function was only rewriting `<img src>` attributes:

```javascript
// Only handled img tags
return html.replace(/(<img\b[^>]*\ssrc\s*=\s*["'])([^"'?#]+)(["'])/gi, ...);
```

So images got rewritten to absolute paths like:
```html
<img src="/try1_ready_2_serve/graphics/map.png">
```

But Excalidraw divs kept their relative paths:
```html
<div data-excalidraw-src="graphics/t1.excalidraw.md">
```

## The Fix

### 1. Updated `notes/content-store.js`

Extended `rewriteRelativeUrls()` to also handle `data-excalidraw-src`:

```javascript
function rewriteRelativeUrls(html, relativePath) {
    const base = getContentBase();
    if (!base) {
        return html;
    }
    const dirSegments = relativePath.split('/').slice(0, -1).filter(Boolean);
    const prefix = dirSegments.length > 0
        ? `${base}/${dirSegments.join('/')}`.replace(/\/+/g, '/')
        : base;
    
    // Rewrite img src attributes
    let result = html.replace(/(<img\b[^>]*\ssrc\s*=\s*["'])([^"'?#]+)(["'])/gi, (match, start, src, end) => {
        const trimmedSrc = src.trim();
        if (/^(?:[a-z]+:|data:|\/)/i.test(trimmedSrc)) {
            return match;
        }
        const cleaned = trimmedSrc.replace(/^\.\//, '').replace(/^\/+/, '');
        const full = `${prefix}/${cleaned}`.replace(/\/+/g, '/');
        return `${start}${full}${end}`;
    });
    
    // ✨ NEW: Rewrite data-excalidraw-src attributes
    result = result.replace(/(data-excalidraw-src\s*=\s*["'])([^"'?#]+)(["'])/gi, (match, start, src, end) => {
        const trimmedSrc = src.trim();
        if (/^(?:[a-z]+:|data:|\/)/i.test(trimmedSrc)) {
            return match;
        }
        const cleaned = trimmedSrc.replace(/^\.\//, '').replace(/^\/+/, '');
        const full = `${prefix}/${cleaned}`.replace(/\/+/g, '/');
        return `${start}${full}${end}`;
    });
    
    return result;
}
```

### 2. Enhanced Error Handling in `utils/excalidraw.js`

Added better debugging and error messages:

```javascript
async function loadAndRenderExcalidraw(container, src) {
    try {
        console.log('Loading Excalidraw diagram from:', src);
        const response = await fetch(src);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // ... rest of the code
    } catch (error) {
        console.error('Error loading Excalidraw diagram:', error);
        container.innerHTML = `
            <div style="border: 2px solid #ef4444; border-radius: 8px; padding: 1rem; background: #fee;">
                <p style="color: #991b1b; margin: 0;"><strong>Error loading diagram</strong></p>
                <p style="color: #7f1d1d; font-size: 0.875rem; margin: 0.5rem 0 0 0;">
                    ${error.message}<br>
                    <code style="font-size: 0.75rem;">Source: ${src}</code>
                </p>
            </div>
        `;
    }
}
```

## Path Resolution Flow (After Fix)

```
1. Build (Python):
   Welcome.md → Welcome.html
   data-excalidraw-src="graphics/t1.excalidraw.md"

2. Runtime - Fetch HTML:
   fetch('/try1_ready_2_serve/Welcome.html')

3. Runtime - Rewrite Paths:
   rewriteRelativeUrls() converts:
   "graphics/t1.excalidraw.md"
   → "/try1_ready_2_serve/graphics/t1.excalidraw.md"

4. Runtime - Render:
   <div data-excalidraw-src="/try1_ready_2_serve/graphics/t1.excalidraw.md">

5. Runtime - Fetch Excalidraw:
   fetch('/try1_ready_2_serve/graphics/t1.excalidraw.md') ✓ Works!
```

## Testing

Created `test-excalidraw.html` for isolated testing:
- Tests dependency loading (LZ-String, React, Excalidraw)
- Tests file fetching
- Tests decompression and parsing
- Tests rendering
- Provides detailed debug output

Access at: `http://localhost:8000/test-excalidraw.html`

## Key Learnings

### 1. SPA Path Resolution is Complex
In a Single Page Application:
- Browser URL might be `/notes/welcome`
- But HTML is loaded from `/try1_ready_2_serve/Welcome.html`
- Relative paths in HTML are relative to **browser URL**, not file location
- Solution: Always convert to absolute paths when loading dynamic content

### 2. Attribute Rewriting Must Be Comprehensive
When rewriting HTML for an SPA, consider ALL attributes that reference resources:
- `<img src="...">`
- `<link href="...">`
- `<script src="...">`
- `<video src="...">`
- `<audio src="...">`
- Custom attributes like `data-excalidraw-src="..."`

### 3. Vanilla JS Browser Integration Works!
The Excalidraw browser integration using ESM imports and import maps works perfectly:
- No build tools needed
- React loaded from CDN
- Dynamic imports for lazy loading
- Full functionality in plain HTML/JS

## Prevention

To prevent similar issues in the future:

### 1. Test with Relative Paths
Always test SPA features with:
- Deep routes (e.g., `/notes/section/subsection/file`)
- Root routes (e.g., `/notes`)
- Different content base paths

### 2. Use a Generic Rewriter
Consider a more generic attribute rewriter:

```javascript
function rewriteAllResourcePaths(html, prefix) {
    const attributes = ['src', 'href', 'data-excalidraw-src', 'data-src'];
    let result = html;
    
    attributes.forEach(attr => {
        const regex = new RegExp(`(${attr}\\s*=\\s*["'])([^"'?#]+)(["'])`, 'gi');
        result = result.replace(regex, (match, start, url, end) => {
            if (/^(?:[a-z]+:|data:|\/)/i.test(url)) return match;
            const cleaned = url.replace(/^\.\//, '').replace(/^\/+/, '');
            return `${start}${prefix}/${cleaned}${end}`;
        });
    });
    
    return result;
}
```

### 3. Add URL Debugging
Log the URLs being fetched:

```javascript
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetching:', args[0]);
    return originalFetch.apply(this, args);
};
```

## Summary

✅ **Fixed**: Added `data-excalidraw-src` rewriting to `rewriteRelativeUrls()`  
✅ **Enhanced**: Better error messages showing the actual URL being fetched  
✅ **Created**: Test page for isolated debugging  
✅ **Documented**: Root cause, fix, and prevention strategies  

The issue was a classic SPA path resolution problem where relative paths in dynamically loaded HTML needed to be converted to absolute paths based on the content's actual location, not the browser's current URL.
