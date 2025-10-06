// Info Modal Content and Functionality
// This module handles the info modal that explains how to use the website

// Function to create and inject the info modal HTML into the page
function createInfoModal() {
    const modalHTML = `
    <!-- Info Modal -->
    <div id="info-modal" class="modal">
      <div class="modal-overlay" onclick="toggleInfoModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>How to Use This Website</h3>
          <button class="close-btn" onclick="toggleInfoModal()">Close ✕</button>
        </div>
        <div class="modal-body">
          <h4>BNSF Rail Network Interactive Map</h4>
          <p> Data from the <a href="https://geodata.bts.gov/datasets/usdot::north-american-rail-network-lines-bnsf-view/about" target="_blank" rel="noopener noreferrer">U.S. Department of Transportation</a>.</p>
          <h3> Map Features</h3>


          <div class="feature-section">
            <h5>🗺️ Interactive Map</h5>
            <ul>
              <li><strong>Rail Lines:</strong> Click on any rail line to view detailed information in a popup</li>
              <li><strong>Navigation:</strong> Shift click and drag to pan, scroll to zoom</li>
            </ul>
          </div>

          <div class="feature-section">
            <h5>🗄️ Attribute Table</h5>
            <ul>
              <li><strong>Access:</strong> Click the table icon in the bottom-right to open the attribute table</li>
              <li><strong>Search:</strong> Use the search box to filter table rows by any text</li>
              <li><strong>Sorting:</strong> Click on column headers to sort data</li>
              <li><strong>Highlighting:</strong> Click on any table row to highlight the corresponding rail segment on the map</li>
            </ul>
          </div>

          <div class="feature-section">
            <h5>📈 Data Visualizations</h5>
            <ul>
              <li><strong>Insights:</strong> Understand distribution patterns across different states and divisions</li>
            </ul>
          </div>



          <div class="author-section">
            <hr>
            <div class="author-info">
              <img src="data/pro_pic.jpg" alt="Author Profile" class="author-photo" onerror="this.style.display='none'">
              <div class="author-details">
                <p><strong>Created by:</strong> Graham Joss</p>
                <p><em>Interactive Rail Network Visualization</em></p>
                <div class="author-links">
                  <a href="https://github.com/gramjos" target="_blank" rel="noopener noreferrer" class="github-link" title="View GitHub Profile">
                    <svg class="github-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    // Find the info modal placeholder and replace it with the full modal
    const placeholder = document.getElementById('info-modal-placeholder');
    if (placeholder) {
        placeholder.outerHTML = modalHTML;
    } else {
        // If no placeholder exists, append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Enhanced toggle function for the info modal
function toggleInfoModal() {
    // Ensure modal exists
    let modal = document.getElementById('info-modal');
    if (!modal) {
        createInfoModal();
        modal = document.getElementById('info-modal');
    }
    
    // Toggle the modal
    modal.classList.toggle('open');
}

// Initialize the modal when the page loads
document.addEventListener('DOMContentLoaded', function() {
    createInfoModal();
});