// Project definitions and metadata
export const projects = [
    {
        id: 'modular-map',
        title: 'Modular Map',
        description: 'An interactive mapping application with data layers, attribute tables, and Marimo integration for geospatial analysis.',
        url: '/modular_map/',
        tags: ['mapping', 'geospatial', 'data-visualization'],
        features: [
            'Interactive map with multiple base layers',
            'GeoJSON data loading and visualization',
            'Attribute table with search and filtering',
            'Marimo notebook integration',
            'Responsive design with FAB controls'
        ]
    },
    {
        id: 'obsidian-semantic-map',
        title: 'Obsidian Semantic Map',
        description: 'A 3D visualization of Obsidian notes using semantic mapping to explore connections and clusters within the knowledge base.',
        url: '/semantic-search-notes/obsidian_semantic_map.html',
        tags: ['visualization', '3d', 'obsidian', 'semantic-search'],
        features: [
            'Interactive 3D graph visualization',
            'Semantic clustering of notes',
            'Fullscreen exploration mode',
            'Node interaction and details'
        ]
    },
    // Future projects can be added here
];

export const projectsById = Object.fromEntries(
    projects.map((project) => [project.id, project])
);
