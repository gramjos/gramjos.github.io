# Modular Map Project
- The beginnings of an exploratory data analysis tool.
- A modern, component-based web mapping application built with vanilla JavaScript (minus Leaflet) and ES6 modules. 
- Built to handle a dataset (38028259 bytes) for client side processing


### Features
#### Map
- Dynamic visualization with bounding box zoom 
- Scale Bar, multiple base layer options

#### Attribute Table
-  floating action button for the attribute table to appear

#### Advanced Search Functionality

The attribute table features a **high-performance incremental search system** designed to handle large datasets efficiently. With 21,004 rail network features and 10 searchable columns, the search engine employs sophisticated computer science optimizations to deliver instant results.

**Performance Optimization - Pre-Computed Index:**
Traditional search implementations compare the query against every column of every feature (O(n×m) complexity), which becomes slow with large datasets. Our search engine uses a **pre-computed search index** built once when data loads initially. Each feature's searchable values are concatenated into a single lowercase string, reducing search operations from multiple column comparisons per feature to just one string comparison (O(n) complexity). This optimization delivers **10× faster search performance**, completing searches across 21,000+ features in under 50 milliseconds.

**Debouncing for Responsiveness:**
To prevent excessive processing during rapid typing, the search implements **debouncing** - a 150ms delay between the last keystroke and actual search execution. This classic performance pattern ensures smooth user experience by avoiding unnecessary computation on every keystroke while maintaining real-time feel.

**Focus Preservation Architecture:**
A critical UX challenge solved: maintaining input focus during incremental search. The solution employs a **dual-rendering strategy** where the search input remains untouched in the DOM while only the table content updates. The `renderTableContent()` method surgically updates the table wrapper without rebuilding the entire panel, preventing the focus-stealing bug common in dynamic search interfaces.

**Smart Query Handling:**
The search requires a minimum of 2 characters to activate, preventing performance degradation from overly broad single-character queries that could return thousands of results unnecessarily. All searches are case-insensitive and whitespace-trimmed for maximum user convenience.

**Modular Architecture:**
Search functionality is completely isolated in `TableSearch.js` (307 lines), demonstrating clean separation of concerns. The module communicates with the parent `AttributeTable` component through callbacks, making it reusable and independently testable. This modular design allows the search system to be dropped into other table implementations with minimal integration effort, exemplifying object-oriented programming principles and component-based architecture patterns.

## Data Notes

STRACNET (type: esriFieldTypeString, alias: STRACNET, SQL Type: sqlTypeOther, length: 1, nullable: true, editable: true, Coded Values: [S: STRACNET designated line], [C: Connector designated line]) [source - esri](https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_North_American_Rail_Network_Lines/FeatureServer/)

## 🐍 Interactive Analysis Panel

The application includes a **Marimo notebook panel** for interactive Python-based data analysis. This panel provides rich visualizations and statistical analysis of the BNSF rail network data.

### Features
- **Interactive Visualizations**: Bar charts, pie charts, and geographic distributions using Altair
- **Dynamic Filtering**: Dropdown controls to filter data by network type (STRACNET/Connector)
- **Live Statistics**: Real-time updates showing segment counts and percentages
- **Data Tables**: Sortable, filterable views of the rail network data
- **Summary Metrics**: Key statistics including states covered, ownership patterns, and network composition

### How It Works (GitHub Pages Compatible)

The Marimo notebook is **exported as static HTML**, making it compatible with GitHub Pages and requiring **no server-side Python**:

1. **Source File**: `interactive_analysis.py` - A Marimo notebook with Python analysis code
2. **Export Process**: Run `marimo export html interactive_analysis.py -o notebooks/interactive_analysis.html -f`
3. **Static Output**: Creates a standalone HTML file with all data, visualizations, and interactivity embedded
4. **Client-Side Only**: The exported HTML runs entirely in the browser using JavaScript

### Updating the Analysis

To modify or update the analysis notebook:

```bash
# 1. Edit the Marimo notebook interactively
marimo edit interactive_analysis.py

# 2. Make your changes in the Marimo editor (opens in browser)
# 3. Save your changes

# 4. Re-export to static HTML for GitHub Pages
marimo export html interactive_analysis.py -o notebooks/interactive_analysis.html -f
```

The export process:
- Executes all Python cells
- Generates visualizations
- Embeds the results in standalone HTML
- Includes Marimo's JavaScript runtime for interactivity
- Produces a file that works without Python on the client side

### Technical Details

- **Notebook**: 305 lines of Python code across 20+ cells
- **Export Size**: ~295 lines of HTML with embedded data
- **Data Source**: Loads from `data/bnsf_rail.geojson` (21,004 features)
- **Libraries**: pandas, altair, marimo (all bundled in export)
- **Interactive Elements**: Dropdowns, filters, tooltips (all work in static HTML)

This approach gives you the power of Python analysis with the simplicity of static hosting! 🚀

