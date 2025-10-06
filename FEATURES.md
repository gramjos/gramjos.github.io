# Web Viewer Features

## Interactive Map Visualization

### Circle Markers

- **Location**: Circles are placed at the midpoint of each rail segment
- **Size**: Circle radius is proportional to the segment's Miles attribute
  - Larger circles = longer segments
  - Uses square root scaling for visual balance
- **Color**: Red (`#ff6b6b`) with semi-transparent fill
- **Interactivity**:
  - Hover over circles to see the exact mile value
  - Click circles for detailed segment information
- **Dynamic Sizing**: Circles automatically resize when zooming in/out

### Click-to-Zoom from Attribute Table

#### How to Use:

1. Open the attribute table by clicking the 📊 button (bottom right)
2. Click on any row in the table
3. The map will automatically:
   - Pan and zoom to the selected rail segment
   - Highlight the segment in yellow for 3 seconds
   - Open a popup with segment details
   - Highlight the clicked table row

#### Features:

- **Visual Feedback**:
  - Selected segment highlighted in bright yellow
  - Selected table row highlighted with yellow background
  - Highlights fade after 3 seconds
- **Smart Zoom**:
  - Automatically fits the segment in view with padding
  - Maximum zoom level capped at 14 for optimal viewing
- **Clickable Rows**:
  - All table rows show a pointer cursor on hover
  - Hover effect with light blue background

## File Structure

- `index.html` - Main HTML page
- `app.js` - Core map and data loading logic
- `table-interactions.js` - Click-to-zoom functionality
- `styles.css` - Styling including row highlights
- `data/bnsf_rail.geojson` - Rail network data

## Technical Details

### Table Interactions Module (`table-interactions.js`)

**Main Functions:**

- `zoomToFeature(fraarcid, map, railData, railLayer)` - Zooms map to specific feature
- `getFeatureBounds(geometry)` - Calculates bounding box for geometry
- `highlightFeature(fraarcid, railLayer)` - Temporarily highlights segment on map
- `highlightTableRow(row)` - Temporarily highlights row in table
- `initializeTableInteractions(map, railData, railLayer)` - Initializes click handlers

**How It Works:**

1. Event delegation on table body for efficient performance
2. Extracts FRAARCID from clicked row's first cell
3. Finds matching feature in GeoJSON data
4. Calculates geographic bounds of the feature
5. Fits map view to bounds with padding
6. Applies temporary visual highlights

### Integration

The module is automatically initialized when the page loads and data is ready. No user configuration needed.

## Browser Compatibility

- Modern browsers with ES6 support
- Leaflet 1.9.4 required
- Works best in Chrome, Firefox, Safari, Edge

## Performance Notes

- Table shows first 1000 features for performance
- Circle layer uses layer groups for efficient rendering
- Event delegation minimizes DOM event listeners
- Highlights automatically removed to prevent memory leaks
