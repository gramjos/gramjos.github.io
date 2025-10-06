/**
 * Charts Panel Module
 * 
 * Provides a resizable panel with bar charts for visualizing BNSF rail network data.
 * Features include:
 * - Toggle panel visibility via floating action button
 * - Drag-to-resize functionality (same as attribute table)
 * - Multiple bar charts showing different data distributions
 * - Automatic chart generation from rail network data
 */

/**
 * State management for the charts panel and resize operations
 */
const chartsPanelState = {
    isOpen: false,
    isResizing: false,
    initialMouseY: 0,
    initialPanelHeight: 0,
    minimumPanelHeight: 200, // Minimum height in pixels
    maximumPanelHeight: window.innerHeight - 100, // Maximum height
    chartsGenerated: false // Track if charts have been created
};

/**
 * Toggles the visibility of the charts panel.
 * Opens or closes the panel and updates button state.
 */
function toggleChartsPanel() {
    const chartsPanel = document.getElementById('charts-panel');
    const chartsFab = document.getElementById('charts-fab');
    
    if (!chartsPanel || !chartsFab) {
        console.error('Charts panel or FAB not found');
        return;
    }
    
    // Toggle the open state
    chartsPanelState.isOpen = !chartsPanelState.isOpen;
    chartsPanel.classList.toggle('open');
    
    // Update FAB title to reflect current state
    if (chartsPanelState.isOpen) {
        chartsFab.title = 'Close Charts Panel';
        
        // Generate charts on first open if data is available
        if (!chartsPanelState.chartsGenerated && window.railData) {
            generateAllCharts(window.railData);
            chartsPanelState.chartsGenerated = true;
        }
    } else {
        chartsFab.title = 'Open Charts Panel';
    }
    
    console.log('Charts panel toggled:', chartsPanelState.isOpen ? 'open' : 'closed');
}

/**
 * Initializes the charts panel resize functionality.
 * Sets up event listeners for drag-to-resize on the panel header.
 */
function initializeChartsPanelResize() {
    const chartsPanel = document.getElementById('charts-panel');
    const panelHeader = chartsPanel?.querySelector('.panel-header');
    
    if (!chartsPanel || !panelHeader) {
        console.error('Charts panel or header not found');
        return;
    }
    
    // Add visual indicator for resize capability
    addChartsPanelResizeCursor(panelHeader);
    
    // Attach mouse event handlers for resizing
    panelHeader.addEventListener('mousedown', handleChartsPanelResizeStart);
    document.addEventListener('mousemove', handleChartsPanelResizeMove);
    document.addEventListener('mouseup', handleChartsPanelResizeEnd);
    
    // Handle window resize to adjust max height
    window.addEventListener('resize', updateChartsPanelMaxHeight);
    
    console.log('Charts panel resize functionality initialized');
}

/**
 * Adds a visual cursor indicator showing the header is draggable for resizing.
 * 
 * @param {HTMLElement} headerElement - The panel header element
 */
function addChartsPanelResizeCursor(headerElement) {
    headerElement.style.cursor = 'ns-resize';
    headerElement.title = 'Drag to resize charts panel';
}

/**
 * Handles the start of a resize operation when user clicks the header.
 * Captures initial mouse position and panel height.
 * 
 * @param {MouseEvent} event - The mousedown event
 */
function handleChartsPanelResizeStart(event) {
    const chartsPanel = document.getElementById('charts-panel');
    
    // Only start resize if panel is open
    if (!chartsPanel.classList.contains('open')) {
        return;
    }
    
    // Prevent text selection during drag
    event.preventDefault();
    
    // Capture initial state for resize calculation
    chartsPanelState.isResizing = true;
    chartsPanelState.initialMouseY = event.clientY;
    chartsPanelState.initialPanelHeight = chartsPanel.offsetHeight;
    
    // Add visual feedback during resize
    addChartsPanelResizingFeedback(chartsPanel);
    
    console.log('Charts panel resize started at Y:', event.clientY);
}

/**
 * Handles mouse movement during resize operation.
 * Calculates new height based on mouse position and updates the panel.
 * 
 * @param {MouseEvent} event - The mousemove event
 */
function handleChartsPanelResizeMove(event) {
    if (!chartsPanelState.isResizing) {
        return;
    }
    
    const chartsPanel = document.getElementById('charts-panel');
    
    // Calculate mouse movement delta (negative = moving up = increasing height)
    const mouseYDelta = chartsPanelState.initialMouseY - event.clientY;
    
    // Calculate proposed new height
    const proposedHeight = chartsPanelState.initialPanelHeight + mouseYDelta;
    
    // Constrain within allowable bounds
    const constrainedHeight = constrainChartsPanelHeight(proposedHeight);
    
    // Apply the new height
    applyChartsPanelHeight(chartsPanel, constrainedHeight);
}

/**
 * Handles the end of a resize operation when user releases the mouse.
 * Cleans up visual feedback and resets state.
 * 
 * @param {MouseEvent} event - The mouseup event
 */
function handleChartsPanelResizeEnd(event) {
    if (!chartsPanelState.isResizing) {
        return;
    }
    
    const chartsPanel = document.getElementById('charts-panel');
    
    // Reset resize state
    chartsPanelState.isResizing = false;
    
    // Remove visual feedback
    removeChartsPanelResizingFeedback(chartsPanel);
    
    console.log('Charts panel resize ended. Final height:', chartsPanel.offsetHeight);
}

/**
 * Constrains a proposed panel height within allowable minimum and maximum bounds.
 * 
 * @param {number} proposedHeight - The desired height in pixels
 * @returns {number} The constrained height value
 */
function constrainChartsPanelHeight(proposedHeight) {
    const minHeight = chartsPanelState.minimumPanelHeight;
    const maxHeight = chartsPanelState.maximumPanelHeight;
    
    return Math.max(minHeight, Math.min(proposedHeight, maxHeight));
}

/**
 * Applies a height value to the charts panel element.
 * 
 * @param {HTMLElement} panelElement - The charts panel element
 * @param {number} heightInPixels - The height to apply
 */
function applyChartsPanelHeight(panelElement, heightInPixels) {
    panelElement.style.height = `${heightInPixels}px`;
}

/**
 * Adds visual feedback during resize operation.
 * 
 * @param {HTMLElement} panelElement - The charts panel element
 */
function addChartsPanelResizingFeedback(panelElement) {
    panelElement.style.transition = 'none';
    panelElement.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
}

/**
 * Removes visual feedback after resize operation ends.
 * 
 * @param {HTMLElement} panelElement - The charts panel element
 */
function removeChartsPanelResizingFeedback(panelElement) {
    panelElement.style.transition = '';
    panelElement.style.userSelect = '';
    document.body.style.cursor = '';
}

/**
 * Updates maximum allowable panel height when window is resized.
 */
function updateChartsPanelMaxHeight() {
    chartsPanelState.maximumPanelHeight = window.innerHeight - 100;
    
    // Resize panel down if it exceeds new maximum
    const chartsPanel = document.getElementById('charts-panel');
    if (chartsPanel && chartsPanel.classList.contains('open')) {
        const currentHeight = chartsPanel.offsetHeight;
        if (currentHeight > chartsPanelState.maximumPanelHeight) {
            applyChartsPanelHeight(chartsPanel, chartsPanelState.maximumPanelHeight);
        }
    }
}

/**
 * Generates all data visualizations for the charts panel.
 * Creates the state distribution chart showing rail network data by state.
 * 
 * @param {Object} railData - The GeoJSON data containing rail network features
 */
function generateAllCharts(railData) {
    if (!railData || !railData.features) {
        console.error('No rail data available for chart generation');
        return;
    }
    
    console.log('Generating charts from', railData.features.length, 'features');
    
    // Generate state distribution chart
    generateStateDistributionChart(railData.features);
}

/**
 * Generates a bar chart showing distribution of rail segments by state.
 * 
 * @param {Array} features - Array of GeoJSON features
 */
function generateStateDistributionChart(features) {
    const stateCount = {};
    
    // Count segments per state
    features.forEach(feature => {
        const state = feature.properties.STATEAB || 'Unknown';
        stateCount[state] = (stateCount[state] || 0) + 1;
    });
    
    // Sort by count descending and take top 15
    const sortedStates = Object.entries(stateCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    
    renderBarChart(
        'state-chart',
        'Rail Segments by State',
        sortedStates,
        '#1976d2'
    );
}

/**
 * Renders a horizontal bar chart in the specified container.
 * Uses pure CSS and HTML for visualization (no external chart library needed).
 * 
 * @param {string} containerId - The ID of the container element
 * @param {string} title - The chart title
 * @param {Array} data - Array of [label, value] pairs
 * @param {string} barColor - CSS color for the bars
 */
function renderBarChart(containerId, title, data, barColor) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    // Find maximum value for scaling
    const maxValue = Math.max(...data.map(d => d[1]));
    
    // Build chart HTML
    let chartHTML = `<div class="chart-title">${title}</div>`;
    chartHTML += '<div class="chart-bars">';
    
    data.forEach(([label, value]) => {
        const percentage = (value / maxValue) * 100;
        chartHTML += `
            <div class="chart-row">
                <div class="chart-label">${label}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${percentage}%; background-color: ${barColor};">
                        <span class="chart-value">${value}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    container.innerHTML = chartHTML;
}

/**
 * Resets the charts panel to its default height (40% of viewport).
 */
function resetChartsPanelHeight() {
    const chartsPanel = document.getElementById('charts-panel');
    if (chartsPanel) {
        const defaultHeight = window.innerHeight * 0.4; // 40% of viewport
        applyChartsPanelHeight(chartsPanel, defaultHeight);
        console.log('Charts panel height reset to default:', defaultHeight);
    }
}

// Initialize resize functionality when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChartsPanelResize);
} else {
    // DOM is already loaded
    initializeChartsPanelResize();
}
