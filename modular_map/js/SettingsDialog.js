/**
 * SettingsDialog.js - Simple About/Info Dialog Module
 * Creates a clean, professional information dialog
 */

export class SettingsDialog {
    constructor(options = {}) {
        this.isOpen = false;
        this.onOpen = options.onOpen || null;
        this.onClose = options.onClose || null;
        
        // Dialog elements
        this.wrapper = null;
        this.dialog = null;
        this.closeButton = null;
    }

    /**
     * Initialize the dialog and inject into DOM
     */
    init() {
        this.createDialog();
        this.attachEventListeners();
        console.log('About Dialog initialized');
    }

    /**
     * Create and inject dialog HTML into the DOM
     */
    createDialog() {
        // Create wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'about-dialog-wrapper';
        this.wrapper.style.display = 'none';

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'about-backdrop';
        
        // Create the dialog
        this.dialog = document.createElement('div');
        this.dialog.className = 'about-dialog';
        this.dialog.innerHTML = this.generateDialogContent();

        // Assemble
        this.wrapper.appendChild(backdrop);
        this.wrapper.appendChild(this.dialog);
        document.body.appendChild(this.wrapper);

        // Get close button reference
        this.closeButton = this.dialog.querySelector('.about-close-btn');
    }

    /**
     * Generate the dialog content HTML
     * @returns {string} HTML content for the dialog
     */
    generateDialogContent() {
        return `
            <div class="about-header">
                <h2>ℹ️ About This Project</h2>
                <button class="about-close-btn" aria-label="Close">×</button>
            </div>
            <div class="about-content">
                <!-- Developer Profile Section -->
                <div class="about-profile">
                    <div class="profile-image-container">
                        <img src="/assets/pro_pic.jpg" alt="Developer Profile" class="profile-image">
                    </div>
                    <div class="profile-info">
                        <h3>Developer</h3>
                        <p class="profile-name">Graham Joss</p>
                        <a href="https://github.com/gramjos" target="_blank" rel="noopener noreferrer" class="github-link">
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" class="github-logo" style="fill: currentColor;">
                                <title>GitHub</title>
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                            </svg>
                            <span>github.com/gramjos</span>
                        </a>
                    </div>
                </div>

                <div class="about-divider"></div>

                <!-- Project Information -->
                <div class="about-section">
                    <h3>📊 Project Overview</h3>
                    <p><strong>Modular Map Application</strong></p>
                    <p>An exploratory data analysis tool for visualizing geospatial freight transportation networks.</p>
                    <p class="about-version">Version 1.0.0 • October 2025</p>
                </div>

                <!-- Data Sources Section -->
                <div class="about-section">
                    <h3>🗂️ Data Sources</h3>
                    
                    <div class="data-source">
                        <h4>BNSF Rail Network</h4>
                        <p>North American Rail Network Lines (BNSF)</p>
                        <p class="data-citation">
                            Source: <a href="https://data-usdot.opendata.arcgis.com/datasets/usdot::north-american-rail-network-lines/about" 
                                     target="_blank" rel="noopener noreferrer">
                                U.S. Department of Transportation - National Transportation Atlas Database (NTAD)
                            </a>
                        </p>
                        <p class="data-details">
                            <strong>Features:</strong> 21,004 rail line segments<br>
                            <strong>Operator:</strong> BNSF Railway Company<br>
                            <strong>Coverage:</strong> Western and Midwestern United States
                        </p>
                    </div>

                    <div class="data-source">
                        <h4>FAF5 Freight Data</h4>
                        <p>Freight Analysis Framework (FAF5.7.1)</p>
                        <p class="data-citation">
                            Source: <a href="https://www.bts.gov/faf" 
                                     target="_blank" rel="noopener noreferrer">
                                U.S. Bureau of Transportation Statistics (BTS)
                            </a>
                        </p>
                        <p class="data-details">
                            <strong>Version:</strong> 5.7.1<br>
                            <strong>Purpose:</strong> Freight flow analysis between regions<br>
                            <strong>Coverage:</strong> Commodity movements by mode and geography
                        </p>
                    </div>
                </div>

                <!-- Technology Stack -->
                <div class="about-section">
                    <h3>🛠️ Built With</h3>
                    <ul class="tech-list">
                        <li><strong>Leaflet.js</strong> - Interactive mapping library</li>
                        <li><strong>Vanilla JavaScript</strong> - ES6 modules, no frameworks</li>
                        <li><strong>GeoJSON</strong> - Spatial data format</li>
                        <li><strong>Modular Architecture</strong> - Clean separation of concerns</li>
                    </ul>
                </div>

                <!-- Footer -->
                <div class="about-footer">
                    <p>Built with ❤️ for transportation analysis and visualization</p>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }

        // Close on backdrop click
        const backdrop = this.wrapper.querySelector('.about-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close());
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent dialog clicks from closing
        if (this.dialog) {
            this.dialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    /**
     * Open the dialog with fade-in
     */
    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.wrapper.style.display = 'flex';

        // Force reflow
        this.wrapper.offsetHeight;

        // Trigger animation
        requestAnimationFrame(() => {
            this.wrapper.classList.add('active');
        });

        // Callback
        if (this.onOpen) {
            this.onOpen();
        }

        console.log('About dialog opened');
    }

    /**
     * Close the dialog with fade-out
     */
    close() {
        if (!this.isOpen) return;

        this.wrapper.classList.remove('active');

        // Wait for animation to complete
        setTimeout(() => {
            this.isOpen = false;
            this.wrapper.style.display = 'none';
        }, 300);

        // Callback
        if (this.onClose) {
            this.onClose();
        }

        console.log('About dialog closed');
    }

    /**
     * Toggle dialog open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Get current open state
     * @returns {boolean}
     */
    getIsOpen() {
        return this.isOpen;
    }

    /**
     * Destroy the dialog and remove from DOM
     */
    destroy() {
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
        this.isOpen = false;
        console.log('About dialog destroyed');
    }
}
