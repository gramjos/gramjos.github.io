// Excalidraw rendering utilities for converting .excalidraw.md files into interactive diagrams
// Uses vanilla JS with Excalidraw's browser-based integration (no bundler required)

let ExcalidrawLib = null;

/**
 * Lazy load the Excalidraw library
 */
async function loadExcalidrawLibrary() {
    if (ExcalidrawLib) {
        return ExcalidrawLib;
    }
    
    try {
        // Import Excalidraw from ESM CDN
        ExcalidrawLib = await import('https://esm.sh/@excalidraw/excalidraw@0.18.0');
        return ExcalidrawLib;
    } catch (error) {
        console.error('Failed to load Excalidraw library:', error);
        throw error;
    }
}

/**
 * Initializes all Excalidraw diagrams on the current page
 */
export async function initExcalidrawDiagrams() {
    const wrappers = document.querySelectorAll('.excalidraw-wrapper');
    if (wrappers.length === 0) {
        return;
    }
    
    // Load Excalidraw library once for all diagrams
    try {
        await loadExcalidrawLibrary();
    } catch (error) {
        console.error('Cannot initialize Excalidraw diagrams:', error);
        return;
    }
    
    // Initialize each diagram
    wrappers.forEach((wrapper) => {
        const src = wrapper.dataset.excalidrawSrc;
        if (src) {
            loadAndRenderExcalidraw(wrapper, src);
        }
    });
}

/**
 * Loads an Excalidraw .md file and renders it in the specified container
 */
async function loadAndRenderExcalidraw(container, src) {
    try {
        console.log('Loading Excalidraw diagram from:', src);
        const response = await fetch(src);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        console.log('Excalidraw file loaded, size:', content.length, 'bytes');
        const sceneData = parseExcalidrawMarkdown(content);
        
        if (sceneData) {
            console.log('Excalidraw scene parsed successfully, elements:', sceneData.elements?.length || 0);
            await renderExcalidrawScene(container, sceneData);
        } else {
            console.error('Failed to parse Excalidraw markdown');
            container.innerHTML = '<p class="muted">Unable to parse Excalidraw data</p>';
        }
    } catch (error) {
        console.error('Error loading Excalidraw diagram:', error);
        container.innerHTML = `
            <div style="border: 2px solid #ef4444; border-radius: 8px; padding: 1rem; background: #fee;">
                <p style="color: #991b1b; margin: 0;"><strong>Error loading diagram</strong></p>
                <p style="color: #7f1d1d; font-size: 0.875rem; margin: 0.5rem 0 0 0;">
                    ${error.message}<br>
                    <code style="font-size: 0.75rem;">Source: ${src}</code>
                </p>
            </div>
        `;
    }
}

/**
 * Parses the Obsidian .excalidraw.md format to extract the JSON scene data
 */
function parseExcalidrawMarkdown(markdown) {
    // Look for the compressed-json code block
    const jsonMatch = markdown.match(/```compressed-json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
        return null;
    }
    
    const compressed = jsonMatch[1].trim();
    
    try {
        // Decompress the data using LZ-String
        const decompressed = decompressFromBase64(compressed);
        if (!decompressed) {
            return null;
        }
        return JSON.parse(decompressed);
    } catch (error) {
        console.error('Error parsing Excalidraw data:', error);
        return null;
    }
}

/**
 * Decompression using the lz-string library
 */
function decompressFromBase64(compressed) {
    try {
        // Use the global LZString library loaded from CDN
        if (typeof LZString !== 'undefined' && LZString.decompressFromBase64) {
            return LZString.decompressFromBase64(compressed);
        }
        
        console.error('LZString library not available');
        return null;
    } catch (e) {
        console.error('Decompression failed:', e);
        return null;
    }
}

/**
 * Renders the Excalidraw scene using the actual Excalidraw viewer
 * This creates a fully interactive, read-only diagram
 */
async function renderExcalidrawScene(container, sceneData) {
    if (!sceneData || !sceneData.elements) {
        container.innerHTML = '<p class="muted">No diagram elements found</p>';
        return;
    }
    
    if (!ExcalidrawLib) {
        container.innerHTML = '<p class="muted">Excalidraw library not loaded</p>';
        return;
    }
    
    try {
        // Import React and ReactDOM for rendering
        const React = await import('https://esm.sh/react@18.2.0');
        const ReactDOM = await import('https://esm.sh/react-dom@18.2.0/client');
        
        // Get the Excalidraw component
        const { Excalidraw } = ExcalidrawLib;
        
        // Prepare the initial data
        const initialData = {
            elements: sceneData.elements || [],
            appState: {
                ...(sceneData.appState || {}),
                viewModeEnabled: true, // Read-only mode
                zenModeEnabled: false,
                gridSize: null,
            },
            files: sceneData.files || null,
        };
        
        // Create a root and render the Excalidraw component
        const root = ReactDOM.createRoot(container);
        root.render(
            React.createElement(Excalidraw, {
                initialData: initialData,
                viewModeEnabled: true,
            })
        );
        
        console.log('Excalidraw diagram rendered successfully');
    } catch (error) {
        console.error('Error rendering Excalidraw scene:', error);
        
        // Fallback to a simple preview
        const elements = sceneData.elements || [];
        const textElements = elements.filter(el => el.type === 'text');
        const shapes = elements.filter(el => ['rectangle', 'ellipse', 'diamond', 'line', 'arrow'].includes(el.type));
        
        const textContent = textElements
            .map(el => el.text || el.rawText)
            .filter(Boolean)
            .join(' ');
        
        container.innerHTML = `
            <div style="border: 2px solid var(--border); border-radius: 8px; padding: 1.5rem; background: #fafafa;">
                <div style="margin-bottom: 0.5rem; font-weight: 600; color: var(--fg);">📊 Excalidraw Diagram (Preview Mode)</div>
                ${textContent ? `<div style="margin: 0.75rem 0; padding: 0.75rem; background: white; border-radius: 6px; font-size: 0.95rem;">${escapeHtmlForExcalidraw(textContent)}</div>` : ''}
                <div style="display: flex; gap: 1rem; margin-top: 0.75rem; font-size: 0.875rem; color: var(--muted);">
                    <span>📝 ${textElements.length} text element${textElements.length !== 1 ? 's' : ''}</span>
                    <span>⬜ ${shapes.length} shape${shapes.length !== 1 ? 's' : ''}</span>
                    <span>✨ ${elements.length} total element${elements.length !== 1 ? 's' : ''}</span>
                </div>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--muted);">
                    ⚠️ Full rendering failed: ${error.message}
                </div>
            </div>
        `;
    }
}

/**
 * Simple HTML escape for Excalidraw text content
 */
function escapeHtmlForExcalidraw(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
