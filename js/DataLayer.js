export class DataLayer {
    constructor(map, options = {}) {
        this.map = map;
        this.dataLayer = null;
        this.style = options.style || {};
        this.onFeatureClick = options.onFeatureClick || null;
        this.onDataLoaded = options.onDataLoaded || null;
    }

    async loadGeoJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json();
            // If a layer already exists, remove it before adding the new one.
            if (this.dataLayer) { this.map.removeLayer(this.dataLayer); }
            // Create a new GeoJSON layer.
            this.dataLayer = L.geoJSON(data, {
                style: this.style,
                onEachFeature: (feature, layer) => {
                    // Attach the click event listener if a callback was provided.
                    if (this.onFeatureClick) {
                        layer.on('click', (e) => { this.onFeatureClick(feature, layer, e); });
                    }
                }
            }).addTo(this.map);
            // Execute the data loaded callback.
            if (this.onDataLoaded) { this.onDataLoaded(data); }
            return data;
        } catch (error) {
            console.error('Failed to load GeoJSON data:', error);
            throw error; // Re-throw error to allow the caller to handle it.
        }
    }
}
