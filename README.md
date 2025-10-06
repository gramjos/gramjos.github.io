# BNSF Rail Network Web Viewer

Interactive web-based map viewer for BNSF rail network data.

## Stack

- Vanilla Node.js (built-in `http`, `fs`, `path` modules only)
- Leaflet.js (client-side mapping)
- No build step, no dependencies

## Files

- `index.html` - Interactive map with attribute table
- `server.js` - Simple HTTP server
- `package.json` - Project metadata
- `data/bnsf_rail.geojson` - Rail network data (21,004 features)

## Run

```bash
node server.js
```

Opens at **http://localhost:3000**

## Features

- OpenStreetMap basemap
- Vector rail overlay (dark blue)
- Hover tooltips (State, Branch, Miles)
- Click popups (full attributes)
- 📊 Floating action button → attribute table
- Search & sort table (1,000 features)
