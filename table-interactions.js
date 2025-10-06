/**
 * Table Interactions Module
 * Handles interaction between the attribute table and the map view
 */

/**
 * Zooms and pans the map to a specific feature based on its FRAARCID
 * @param {number} fraarcid - The unique identifier for the rail segment
 * @param {Object} map - The Leaflet map instance
 * @param {Object} railData - The GeoJSON data containing all features
 * @param {Object} railLayer - The Leaflet GeoJSON layer
 */
function zoomToFeature(fraarcid, map, railData, railLayer) {
    if (!railData || !railData.features) {
        console.error('Rail data not available');
        return;
    }

    // Find the feature with matching FRAARCID
    const feature = railData.features.find(f => f.properties.FRAARCID === fraarcid);
    
    if (!feature) {
        console.warn(`Feature with FRAARCID ${fraarcid} not found`);
        return;
    }

    // Calculate bounds for the feature
    const bounds = getFeatureBounds(feature.geometry);
    
    if (bounds) {
        // Fit map to feature bounds with padding
        map.fitBounds(bounds, {
            padding: [100, 100],
            maxZoom: 14
        });

        // Highlight the feature temporarily
        highlightFeature(fraarcid, railLayer);
    }
}

/**
 * Calculates the bounding box for a geometry
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Array|null} Leaflet LatLngBounds or null
 */
function getFeatureBounds(geometry) {
    if (!geometry || !geometry.coordinates) return null;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    function processCoordinates(coords) {
        if (typeof coords[0] === 'number') {
            // Single coordinate [lng, lat]
            const [lng, lat] = coords;
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
        } else {
            // Array of coordinates
            coords.forEach(processCoordinates);
        }
    }

    processCoordinates(geometry.coordinates);

    if (minLat === Infinity) return null;

    return L.latLngBounds(
        L.latLng(minLat, minLng),
        L.latLng(maxLat, maxLng)
    );
}

/**
 * Temporarily highlights a feature on the map
 * @param {number} fraarcid - The unique identifier for the rail segment
 * @param {Object} railLayer - The Leaflet GeoJSON layer
 */
function highlightFeature(fraarcid, railLayer) {
    // Remove any existing highlights
    removeHighlight();

    // Find and highlight the layer
    railLayer.eachLayer(layer => {
        if (layer.feature && layer.feature.properties.FRAARCID === fraarcid) {
            // Store original style
            layer._originalStyle = {
                color: layer.options.color,
                weight: layer.options.weight,
                opacity: layer.options.opacity
            };

            // Apply highlight style
            layer.setStyle({
                color: '#ffff00',
                weight: 5,
                opacity: 1
            });

            // Store reference for later removal
            window._highlightedLayer = layer;

            // Open popup if available
            if (layer.getPopup()) {
                layer.openPopup();
            }

            // Remove highlight after 3 seconds
            setTimeout(() => {
                removeHighlight();
            }, 3000);
        }
    });
}

/**
 * Removes the highlight from the currently highlighted feature
 */
function removeHighlight() {
    if (window._highlightedLayer) {
        const layer = window._highlightedLayer;
        if (layer._originalStyle) {
            layer.setStyle(layer._originalStyle);
        }
        window._highlightedLayer = null;
    }
}

/**
 * Attaches click handlers to table rows
 * @param {Object} map - The Leaflet map instance
 * @param {Object} railData - The GeoJSON data
 * @param {Object} railLayer - The Leaflet GeoJSON layer
 */
function attachTableClickHandlers(map, railData, railLayer) {
    const tableBody = document.getElementById('table-body');
    
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }

    // Use event delegation for better performance
    tableBody.addEventListener('click', function(event) {
        // Find the closest tr element
        const row = event.target.closest('tr');
        
        if (!row) return;

        // Get FRAARCID from first cell
        const fraarcidCell = row.cells[0];
        if (!fraarcidCell) return;

        const fraarcid = parseInt(fraarcidCell.textContent, 10);
        
        if (isNaN(fraarcid)) {
            console.warn('Invalid FRAARCID in table row');
            return;
        }

        // Highlight the clicked row temporarily
        highlightTableRow(row);

        // Zoom to the feature
        zoomToFeature(fraarcid, map, railData, railLayer);
    });
}

/**
 * Temporarily highlights a table row
 * @param {HTMLElement} row - The table row element
 */
function highlightTableRow(row) {
    // Remove previous row highlights
    const previousHighlight = document.querySelector('tr.highlighted-row');
    if (previousHighlight) {
        previousHighlight.classList.remove('highlighted-row');
    }

    // Add highlight class
    row.classList.add('highlighted-row');

    // Remove highlight after 3 seconds
    setTimeout(() => {
        row.classList.remove('highlighted-row');
    }, 3000);
}

/**
 * Initializes table interactions
 * Call this after the data is loaded and the table is populated
 * @param {Object} map - The Leaflet map instance
 * @param {Object} railData - The GeoJSON data
 * @param {Object} railLayer - The Leaflet GeoJSON layer
 */
function initializeTableInteractions(map, railData, railLayer) {
    attachTableClickHandlers(map, railData, railLayer);
    console.log('Table interactions initialized');
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        zoomToFeature,
        highlightFeature,
        removeHighlight,
        attachTableClickHandlers,
        initializeTableInteractions
    };
}
