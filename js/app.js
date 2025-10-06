// Initialize map
const map = L.map('map').setView([37.91, -104.66], 5);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Add scale control
L.control.scale().addTo(map);

// Global variables for rail data and layers (accessible by other modules)
let railData = null;
let railLayer = null;
let symbolLayer = null;

// Make railData available globally for charts panel
window.railData = null;

// Helper function to calculate midpoint of a LineString
function getLineMidpoint(coordinates) {
    if (!coordinates || coordinates.length === 0) return null;
    
    // For MultiLineString, use the first line
    const coords = Array.isArray(coordinates[0][0]) ? coordinates[0] : coordinates;
    
    // Find the middle index
    const midIndex = Math.floor(coords.length / 2);
    return coords[midIndex];
}

// Helper function to calculate rectangle dimensions based on Miles value
// Returns [width, height] where height is 8x the width
function getRectangleDimensions(miles, zoom) {
    if (!miles || miles <= 0) return [0, 0];
    
    // Base width calculation: larger values get bigger rectangles
    // Scale factor adjusts with zoom level for better visibility
    const baseScale = 50; // Smaller base scale since we're using width
    const zoomFactor = Math.pow(2, zoom - 10);
    const width = Math.sqrt(miles) * baseScale * zoomFactor;
    const height = width * 8; // 8:1 ratio (height:width)
    
    return [width, height];
}

// Helper function to get pixel bounds for a rectangle marker
function getRectangleBounds(lat, lng, width, height, map) {
    const point = map.latLngToLayerPoint([lat, lng]);
    
    // Rectangle centered on the point, standing up on its short side
    const bounds = L.bounds(
        L.point(point.x - width / 2, point.y - height), // top-left (standing up)
        L.point(point.x + width / 2, point.y)           // bottom-right
    );
    
    return [
        map.layerPointToLatLng(bounds.min),
        map.layerPointToLatLng(bounds.max)
    ];
}

// Load GeoJSON data
fetch('data/bnsf_rail.geojson')
    .then(response => response.json())
    .then(data => {
        railData = data;
        window.railData = data; // Make available globally for charts panel
        document.getElementById('loading').style.display = 'none';
        document.getElementById('feature-count').textContent = data.features.length;
        
        // Add rail lines to map
        railLayer = L.geoJSON(data, {
            style: {
                color: 'darkblue',
                weight: 2,
                opacity: 0.7
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                
                // Tooltip (hover)
                const tooltipText = `State: ${props.STATEAB || 'N/A'}<br>Type: ${props.BRANCH || 'N/A'}<br>Miles: ${props.MILES ? props.MILES.toFixed(2) : 'N/A'}`;
                layer.bindTooltip(tooltipText);
                
                // Popup (click)
                const popupHTML = `
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: darkblue;">BNSF Rail Segment</h4>
                        <table class="popup-table">
                            <tr><td>Arc ID:</td><td>${props.FRAARCID || 'N/A'}</td></tr>
                            <tr><td>State:</td><td>${props.STATEAB || 'N/A'}</td></tr>
                            <tr><td>County FIPS:</td><td>${props.CNTYFIPS || 'N/A'}</td></tr>
                            <tr><td>Owner:</td><td>${props.RROWNER1 || 'N/A'}</td></tr>
                            <tr><td>Track Rights:</td><td>${props.TRKRGHTS1 || 'N/A'}</td></tr>
                            <tr><td>Division:</td><td>${props.DIVISION || 'N/A'}</td></tr>
                            <tr><td>Subdivision:</td><td>${props.SUBDIV || 'N/A'}</td></tr>
                            <tr><td>Branch:</td><td>${props.BRANCH || 'N/A'}</td></tr>
                            <tr><td>Tracks:</td><td>${props.TRACKS || 'N/A'}</td></tr>
                            <tr><td>Miles:</td><td>${props.MILES ? props.MILES.toFixed(2) : 'N/A'}</td></tr>
                            <tr><td>Network:</td><td>${props.NET || 'N/A'}</td></tr>
                            <tr><td>Timezone:</td><td>${props.TIMEZONE || 'N/A'}</td></tr>
                        </table>
                    </div>
                `;
                layer.bindPopup(popupHTML, { maxWidth: 350 });
            }
        }).addTo(map);
        
        // Add rectangles at midpoints sized by Miles attribute
        const rectangles = [];
        data.features.forEach(feature => {
            const miles = feature.properties.MILES;
            if (!miles || miles <= 0) return;
            
            const midpoint = getLineMidpoint(feature.geometry.coordinates);
            if (!midpoint) return;
            
            // Create rectangle marker at midpoint (standing vertically)
            // Note: coordinates are [lng, lat], Leaflet expects [lat, lng]
            const lat = midpoint[1];
            const lng = midpoint[0];
            
            // Add popup with same info as line
            const props = feature.properties;
            const popupHTML = `
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #ff6b6b;">Segment: ${miles.toFixed(2)} miles</h4>
                    <table class="popup-table">
                        <tr><td>State:</td><td>${props.STATEAB || 'N/A'}</td></tr>
                        <tr><td>Branch:</td><td>${props.BRANCH || 'N/A'}</td></tr>
                        <tr><td>Division:</td><td>${props.DIVISION || 'N/A'}</td></tr>
                    </table>
                </div>
            `;
            
        });
        
        // Group rectangles in a layer
        symbolLayer = L.layerGroup(rectangles).addTo(map);
        
        // Populate attribute table (first 1000 features)
        populateAttributeTable(data.features.slice(0, 1000));
        
        // Initialize table interactions for click-to-zoom functionality
        if (typeof initializeTableInteractions === 'function') {
            initializeTableInteractions(map, data, railLayer);
        }
    })
    .catch(error => {
        document.getElementById('loading').innerHTML = 'Error loading data: ' + error.message;
        console.error('Error:', error);
    });

// Populate attribute table
function populateAttributeTable(features) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    features.forEach(feature => {
        const props = feature.properties;
        const row = document.createElement('tr');
        
        const values = [
            props.FRAARCID,
            props.STATEAB,
            props.CNTYFIPS,
            props.RROWNER1,
            props.TRKRGHTS1,
            props.DIVISION,
            props.BRANCH,
            props.TRACKS,
            props.MILES ? props.MILES.toFixed(2) : '',
            props.NET
        ];
        
        values.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val || '';
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
}

// Toggle attribute table
function toggleAttrTable() {
    document.getElementById('attr-table-panel').classList.toggle('open');
}

// Filter table
function filterTable() {
    const filter = document.getElementById('search-box').value.toLowerCase();
    const rows = document.getElementById('table-body').getElementsByTagName('tr');
    
    let visibleCount = 0;
    let hiddenCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent.toLowerCase();
        const isVisible = text.includes(filter);
        
        rows[i].style.display = isVisible ? '' : 'none';
        
        if (isVisible) {
            visibleCount++;
        } else {
            hiddenCount++;
        }
    }
}

// Sort table
function sortTable(colIndex) {
    const table = document.getElementById('data-table');
    const tbody = document.getElementById('table-body');
    const rows = Array.from(tbody.rows);
    const header = table.rows[0].cells[colIndex];
    const isAsc = header.textContent.includes('▼');
    
    rows.sort((a, b) => {
        const aVal = a.cells[colIndex].textContent;
        const bVal = b.cells[colIndex].textContent;
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAsc ? aNum - bNum : bNum - aNum;
        }
        return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    
    rows.forEach(row => tbody.appendChild(row));
    
    // Update sort indicators
    for (let i = 0; i < table.rows[0].cells.length; i++) {
        const cell = table.rows[0].cells[i];
        const text = cell.textContent.replace(/[▼▲]/, '');
        cell.textContent = i === colIndex ? text + (isAsc ? ' ▲' : ' ▼') : text + ' ▼';
    }
}
