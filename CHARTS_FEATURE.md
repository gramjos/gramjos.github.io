# Charts Panel Feature Documentation

## Overview

Added a new resizable charts panel to the BNSF Rail Network web viewer that displays interactive bar charts visualizing the rail network data.

## New Files Created

### `charts-panel.js`

A comprehensive JavaScript module that provides:

- **Toggle functionality** for opening/closing the charts panel
- **Drag-to-resize capability** identical to the attribute table
- **Automatic chart generation** from rail network GeoJSON data
- **Five different bar charts** showing various data distributions

## Components Added

### 1. Floating Action Button (FAB)

- **Location**: Bottom right, below the attribute table FAB
- **Icon**: 📈 (chart emoji)
- **Color**: Orange (#f57c00)
- **Function**: Toggles the charts panel visibility

### 2. Charts Panel

- **Position**: Fixed to bottom of viewport (like attribute table)
- **Default Height**: 40% of viewport
- **Resizable**: Drag the header bar to resize vertically
- **Constraints**:
  - Minimum height: 200px
  - Maximum height: viewport height - 100px

### 3. Data Visualizations

The panel generates five bar charts automatically when opened:

#### a) **Rail Segments by State**

- Shows distribution of rail segments across states
- Displays top 15 states by segment count
- Color: Blue (#1976d2)

#### b) **Segments by Track Count**

- Distribution of segments by number of tracks
- Shows all track count categories
- Color: Green (#388e3c)

#### c) **Segments by Division**

- Distribution across BNSF divisions
- Shows top 10 divisions
- Color: Orange (#f57c00)

#### d) **Segments by Branch Type**

- Distribution by branch/line type
- Shows all branch categories
- Color: Purple (#7b1fa2)

#### e) **Segment Length Distribution**

- Histogram of segment lengths in miles
- Bins: 0-5, 5-10, 10-20, 20-50, 50+ miles
- Color: Red (#d32f2f)

## Technical Features

### Resize Functionality

```javascript
// State management
const chartsPanelState = {
  isResizing: false,
  initialMouseY: 0,
  initialPanelHeight: 0,
  minimumPanelHeight: 200,
  maximumPanelHeight: window.innerHeight - 100,
};
```

### Chart Rendering

- **No external libraries required** - uses pure CSS and HTML
- Horizontal bar charts with percentage-based widths
- Automatic scaling based on maximum value
- Responsive and animated

### Event Handlers

- `handleChartsPanelResizeStart()` - Initiates resize on mousedown
- `handleChartsPanelResizeMove()` - Updates height during drag
- `handleChartsPanelResizeEnd()` - Completes resize on mouseup
- Window resize listener for responsive max height

## Code Quality

### Naming Conventions

- **Functions**: Descriptive verbs (e.g., `generateStateDistributionChart`, `constrainChartsPanelHeight`)
- **Variables**: Clear intent (e.g., `chartsPanelState`, `barColor`, `maximumPanelHeight`)
- **Constants**: Meaningful labels (e.g., `minimumPanelHeight`)

### Documentation

- Comprehensive JSDoc comments for all functions
- Inline comments explaining complex logic
- Parameter descriptions and return types

### Best Practices

- State encapsulation in dedicated object
- Event delegation and proper cleanup
- Responsive design considerations
- Graceful error handling

## Files Modified

1. **index.html**

   - Added charts FAB button
   - Added charts panel HTML structure
   - Included charts-panel.js script

2. **styles.css**

   - Added charts FAB styling
   - Added charts panel styling
   - Added bar chart component styles

3. **app.js**
   - Exposed `railData` globally via `window.railData`
   - Enables charts panel to access data

## Usage

1. **Open Charts Panel**: Click the orange 📈 FAB button in bottom right
2. **View Charts**: Scroll through the five data visualizations
3. **Resize Panel**: Click and drag the header bar up/down to adjust height
4. **Close Panel**: Click the "Close ✕" button in the header

## Integration

The charts panel:

- Works alongside the attribute table (both can be open simultaneously)
- Uses the same resize pattern for consistency
- Automatically generates charts on first open
- Caches generated charts for performance

## Future Enhancements

Potential improvements:

- Interactive chart elements (click to filter map)
- Additional chart types (pie charts, scatter plots)
- Export chart data functionality
- Custom date range filtering
- Real-time updates when map view changes
