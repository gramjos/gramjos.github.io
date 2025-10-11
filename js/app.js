import { DataLayer } from './DataLayer.js';
import { BaseLayer } from './BaseLayer.js';

class MapApplication {
    constructor() {
        this.map = null;
        this.baseLayer = null;
    }

    init() {

		console.log('it it g time'); 
		let b = document.querySelector("#mybutton");
		b.addEventListener("click", () => { console.log("Thanks again!"); });

		// Create map instance
        this.map = L.map('map').setView([39.8283, -98.5795], 4); // Centered on USA

        // Initialize base layers
        this.baseLayer = new BaseLayer(this.map);
        this.baseLayer.setBaseLayer('osm'); // Set default layer
        this.baseLayer.addLayerControl(); // Add layer switcher control
        this.initDataLayer();

		// TODO: more exploratory data analysis feature for this web app


	}

    async initDataLayer() {
        this.dataLayer = new DataLayer(this.map, {
            style: {
                color: '#2E86AB',
                weight: 2,
                opacity: 0.7
            },
            onFeatureClick: (feature, layer, e) => {
                console.log('Rail line clicked:', feature.properties);
            },
            onDataLoaded: (data) => {
                console.log(`✅ ${data.features.length} rail features loaded and displayed`);
            }
        });

        // Load BNSF rail data
        try { await this.dataLayer.loadGeoJSON('data/bnsf_rail.geojson'); } 
		catch (error) { console.error('Failed to load rail data:', error); }
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const app = new MapApplication();
    app.init();
});

