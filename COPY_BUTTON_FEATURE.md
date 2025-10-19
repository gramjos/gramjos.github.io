# Copy-to-Clipboard Feature

## Overview
All code blocks now have a "Copy" button in the top-right corner that copies the code to the system clipboard.

## Implementation

### JavaScript (`app.js`)
- **Function**: `addCopyButtonsToCodeBlocks()`
- **When**: Called after each page render in `renderCurrentPage()`
- **What it does**:
  1. Finds all `<pre><code>` blocks in the page content
  2. Creates a button with copy icon and label
  3. Wraps each code block in a positioned container
  4. Uses modern Clipboard API with fallback for older browsers
  5. Shows success feedback ("Copied!") for 2 seconds

### CSS (`styles.css`)
- **`.code-block-wrapper`**: Relative positioning container for code block + button
- **`.copy-code-button`**: Styled button with:
  - Semi-transparent background with backdrop blur
  - Hover effect (slight lift)
  - Success state (green highlight when copied)
  - Dark mode support
- **`.page pre`**: Updated with top padding to make room for button

## Features

### Visual Feedback
- **Default**: Translucent white button with "Copy" label
- **Hover**: Brighter background, slight upward movement
- **Copied**: Green background with "Copied!" text for 2 seconds
- **Failed**: Shows "Failed" message if clipboard access denied

### Browser Support
- **Modern browsers**: Uses `navigator.clipboard.writeText()` (Chrome, Firefox, Safari, Edge)
- **Fallback**: Uses `document.execCommand('copy')` for older browsers
- **Error handling**: Graceful degradation with user feedback

### Accessibility
- `aria-label="Copy code to clipboard"` for screen readers
- Keyboard accessible (can tab to button and press Enter/Space)
- Visual feedback doesn't rely on color alone

## User Experience

1. Navigate to any page with code blocks
2. Hover over a code block to see the copy button appear prominent
3. Click "Copy" to copy the code
4. Button shows "Copied!" in green for 2 seconds
5. Paste anywhere to use the copied code

## Technical Details

### SVG Icon
Uses inline SVG for the copy icon (overlapping rectangles) to avoid external dependencies.

### Performance
- Buttons are created once per page load
- Duplicate prevention checks if button already exists
- No polling or watchers - clean event-driven architecture

### Styling in Dark Mode
The button automatically adjusts for dark mode using CSS custom properties:
- Light mode: White translucent background
- Dark mode: Blue translucent background matching accent color
