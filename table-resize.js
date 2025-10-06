/**
 * Attribute Table Resize Module
 * 
 * Provides drag-to-resize functionality for the attribute table panel.
 * Users can click and drag the top border of the attribute table to 
 * adjust its height dynamically while it's open.
 */

/**
 * State management for resize operations
 */
const attributeTableResizeState = {
    isResizing: false,
    initialMouseY: 0,
    initialPanelHeight: 0,
    minimumTableHeight: 150, // Minimum height in pixels to prevent collapse
    maximumTableHeight: window.innerHeight - 100 // Maximum height (leave space for controls)
};

/**
 * Initializes the resize functionality for the attribute table.
 * Sets up event listeners on the table header to enable drag-to-resize.
 * 
 * Should be called after the DOM is fully loaded.
 */
function initializeAttributeTableResize() {
    const attributeTablePanel = document.getElementById('attr-table-panel');
    const tableHeader = attributeTablePanel.querySelector('.table-header');
    
    if (!attributeTablePanel || !tableHeader) {
        console.error('Attribute table panel or header not found');
        return;
    }
    
    // Add visual indicator for resize capability
    addResizeCursor(tableHeader);
    
    // Attach mouse event handlers
    tableHeader.addEventListener('mousedown', handleResizeStart);
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    
    // Handle window resize to adjust max height
    window.addEventListener('resize', updateMaximumTableHeight);
    
    console.log('Attribute table resize functionality initialized');
}

/**
 * Adds a visual cursor indicator to show that the header is draggable.
 * 
 * @param {HTMLElement} headerElement - The table header element
 */
function addResizeCursor(headerElement) {
    headerElement.style.cursor = 'ns-resize';
    headerElement.title = 'Drag to resize attribute table';
}

/**
 * Handles the start of a resize operation when user clicks on the header.
 * Captures initial mouse position and panel height.
 * 
 * @param {MouseEvent} event - The mousedown event
 */
function handleResizeStart(event) {
    const attributeTablePanel = document.getElementById('attr-table-panel');
    
    // Only start resize if table is open
    if (!attributeTablePanel.classList.contains('open')) {
        return;
    }
    
    // Prevent text selection during drag
    event.preventDefault();
    
    // Capture initial state
    attributeTableResizeState.isResizing = true;
    attributeTableResizeState.initialMouseY = event.clientY;
    attributeTableResizeState.initialPanelHeight = attributeTablePanel.offsetHeight;
    
    // Add visual feedback
    addResizingVisualFeedback(attributeTablePanel);
    
    console.log('Resize started at Y:', event.clientY, 'Panel height:', attributeTablePanel.offsetHeight);
}

/**
 * Handles mouse movement during resize operation.
 * Calculates new height based on mouse position and updates the panel.
 * 
 * @param {MouseEvent} event - The mousemove event
 */
function handleResizeMove(event) {
    if (!attributeTableResizeState.isResizing) {
        return;
    }
    
    const attributeTablePanel = document.getElementById('attr-table-panel');
    
    // Calculate how far the mouse has moved (negative because moving up increases height)
    const mouseYDelta = attributeTableResizeState.initialMouseY - event.clientY;
    
    // Calculate new height based on mouse movement
    const proposedNewHeight = attributeTableResizeState.initialPanelHeight + mouseYDelta;
    
    // Constrain height within minimum and maximum bounds
    const constrainedHeight = constrainTableHeight(proposedNewHeight);
    
    // Apply the new height to the panel
    applyTableHeight(attributeTablePanel, constrainedHeight);
}

/**
 * Handles the end of a resize operation when user releases mouse button.
 * Cleans up visual feedback and resets state.
 * 
 * @param {MouseEvent} event - The mouseup event
 */
function handleResizeEnd(event) {
    if (!attributeTableResizeState.isResizing) {
        return;
    }
    
    const attributeTablePanel = document.getElementById('attr-table-panel');
    
    // Reset resize state
    attributeTableResizeState.isResizing = false;
    
    // Remove visual feedback
    removeResizingVisualFeedback(attributeTablePanel);
    
    console.log('Resize ended. Final height:', attributeTablePanel.offsetHeight);
}

/**
 * Constrains a proposed table height within allowable bounds.
 * Ensures the table doesn't become too small or too large.
 * 
 * @param {number} proposedHeight - The desired height in pixels
 * @returns {number} The constrained height value
 */
function constrainTableHeight(proposedHeight) {
    const minHeight = attributeTableResizeState.minimumTableHeight;
    const maxHeight = attributeTableResizeState.maximumTableHeight;
    
    // Clamp the value between min and max
    return Math.max(minHeight, Math.min(proposedHeight, maxHeight));
}

/**
 * Applies a height value to the attribute table panel.
 * 
 * @param {HTMLElement} panelElement - The attribute table panel element
 * @param {number} heightInPixels - The height to apply
 */
function applyTableHeight(panelElement, heightInPixels) {
    panelElement.style.height = `${heightInPixels}px`;
}

/**
 * Adds visual feedback during resize operation.
 * Makes it clear to the user that resize is active.
 * 
 * @param {HTMLElement} panelElement - The attribute table panel element
 */
function addResizingVisualFeedback(panelElement) {
    panelElement.style.transition = 'none'; // Disable transitions during drag
    panelElement.style.userSelect = 'none'; // Prevent text selection
    document.body.style.cursor = 'ns-resize'; // Show resize cursor globally
}

/**
 * Removes visual feedback after resize operation ends.
 * Restores normal appearance and behavior.
 * 
 * @param {HTMLElement} panelElement - The attribute table panel element
 */
function removeResizingVisualFeedback(panelElement) {
    panelElement.style.transition = ''; // Re-enable transitions
    panelElement.style.userSelect = ''; // Restore text selection
    document.body.style.cursor = ''; // Restore normal cursor
}

/**
 * Updates the maximum allowable table height when window is resized.
 * Ensures the table doesn't exceed viewport dimensions.
 */
function updateMaximumTableHeight() {
    attributeTableResizeState.maximumTableHeight = window.innerHeight - 100;
    
    // If current table is too tall, resize it down
    const attributeTablePanel = document.getElementById('attr-table-panel');
    if (attributeTablePanel && attributeTablePanel.classList.contains('open')) {
        const currentHeight = attributeTablePanel.offsetHeight;
        if (currentHeight > attributeTableResizeState.maximumTableHeight) {
            applyTableHeight(attributeTablePanel, attributeTableResizeState.maximumTableHeight);
        }
    }
}

/**
 * Resets the attribute table to its default height (50% of viewport).
 * Useful if user wants to restore original size after resizing.
 */
function resetAttributeTableHeight() {
    const attributeTablePanel = document.getElementById('attr-table-panel');
    if (attributeTablePanel) {
        const defaultHeight = window.innerHeight * 0.5; // 50% of viewport
        applyTableHeight(attributeTablePanel, defaultHeight);
        console.log('Attribute table height reset to default:', defaultHeight);
    }
}

// Initialize resize functionality when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAttributeTableResize);
} else {
    // DOM is already loaded
    initializeAttributeTableResize();
}
