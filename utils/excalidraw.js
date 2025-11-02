/**
 * Simple Excalidraw viewer for vanilla JS
 * Uses Excalidraw's web component for easy integration
 */

// Initialize all Excalidraw diagrams on the page
export function initExcalidrawDiagrams() {
    const containers = document.querySelectorAll('[data-excalidraw-file]');
    
    if (containers.length === 0) {
        return;
    }
    
    console.log(`[Excalidraw] Found ${containers.length} diagram(s) to render`);
    
    containers.forEach(container => {
        const filePath = container.getAttribute('data-excalidraw-file');
        if (filePath) {
            loadAndRenderDiagram(container, filePath);
        }
    });
}

async function loadAndRenderDiagram(container, filePath) {
    try {
        console.log(`[Excalidraw] Loading: ${filePath}`);
        
        // Fetch the .excalidraw.md file
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const content = await response.text();
        
        // Parse the Obsidian Excalidraw format
        const sceneData = parseObsidianExcalidraw(content);
        if (!sceneData) {
            throw new Error('Failed to parse Excalidraw data');
        }
        
        console.log(`[Excalidraw] Parsed ${sceneData.elements?.length || 0} elements`);
        
        // Render using simple canvas approach
        renderDiagramToCanvas(container, sceneData);
        
    } catch (error) {
        console.error('[Excalidraw] Error:', error);
        container.innerHTML = `
            <div style="padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c00;">
                <strong>Failed to load diagram:</strong> ${error.message}
            </div>
        `;
    }
}

function parseObsidianExcalidraw(markdown) {
    // Extract the compressed-json block
    const match = markdown.match(/```compressed-json\n([\s\S]*?)\n```/);
    if (!match) {
        console.error('[Excalidraw] No compressed-json block found');
        return null;
    }
    
    // Remove all whitespace from base64 string (Obsidian wraps it across lines)
    const compressed = match[1].replace(/\s/g, '');
    
    try {
        // Check if LZString is available
        if (typeof LZString === 'undefined') {
            console.error('[Excalidraw] LZString library not loaded');
            return null;
        }
        
        // Decompress
        const decompressed = LZString.decompressFromBase64(compressed);
        if (!decompressed) {
            console.error('[Excalidraw] Decompression failed');
            return null;
        }
        
        // Parse JSON
        return JSON.parse(decompressed);
        
    } catch (error) {
        console.error('[Excalidraw] Parse error:', error);
        return null;
    }
}

function renderDiagramToCanvas(container, sceneData) {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.border = '1px solid #ddd';
    canvas.style.borderRadius = '8px';
    canvas.style.background = '#fff';
    
    // Calculate bounds
    const elements = sceneData.elements || [];
    if (elements.length === 0) {
        container.innerHTML = '<p>No elements in diagram</p>';
        return;
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        if (el.x < minX) minX = el.x;
        if (el.y < minY) minY = el.y;
        if (el.x + el.width > maxX) maxX = el.x + el.width;
        if (el.y + el.height > maxY) maxY = el.y + el.height;
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const scale = Math.min(width / contentWidth, height / contentHeight) * 0.9;
    const offsetX = (width - contentWidth * scale) / 2 - minX * scale;
    const offsetY = (height - contentHeight * scale) / 2 - minY * scale;
    
    // Simple rendering
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    elements.forEach(el => {
        if (el.isDeleted) return;
        
        ctx.strokeStyle = el.strokeColor || '#000';
        ctx.fillStyle = el.backgroundColor || 'transparent';
        ctx.lineWidth = (el.strokeWidth || 1) / scale;
        
        if (el.type === 'rectangle') {
            ctx.beginPath();
            ctx.rect(el.x, el.y, el.width, el.height);
            if (el.backgroundColor && el.backgroundColor !== 'transparent') {
                ctx.fill();
            }
            ctx.stroke();
        } else if (el.type === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(
                el.x + el.width / 2,
                el.y + el.height / 2,
                Math.abs(el.width / 2),
                Math.abs(el.height / 2),
                0, 0, Math.PI * 2
            );
            if (el.backgroundColor && el.backgroundColor !== 'transparent') {
                ctx.fill();
            }
            ctx.stroke();
        } else if (el.type === 'line' || el.type === 'arrow') {
            const points = el.points || [];
            if (points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(el.x + points[0][0], el.y + points[0][1]);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(el.x + points[i][0], el.y + points[i][1]);
                }
                ctx.stroke();
                
                // Simple arrow head for arrows
                if (el.type === 'arrow' && points.length > 1) {
                    const last = points[points.length - 1];
                    const prev = points[points.length - 2];
                    const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
                    const headLen = 10 / scale;
                    
                    ctx.beginPath();
                    ctx.moveTo(el.x + last[0], el.y + last[1]);
                    ctx.lineTo(
                        el.x + last[0] - headLen * Math.cos(angle - Math.PI / 6),
                        el.y + last[1] - headLen * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.moveTo(el.x + last[0], el.y + last[1]);
                    ctx.lineTo(
                        el.x + last[0] - headLen * Math.cos(angle + Math.PI / 6),
                        el.y + last[1] - headLen * Math.sin(angle + Math.PI / 6)
                    );
                    ctx.stroke();
                }
            }
        } else if (el.type === 'text') {
            ctx.font = `${(el.fontSize || 20) * scale}px ${el.fontFamily || 'sans-serif'}`;
            ctx.fillStyle = el.strokeColor || '#000';
            ctx.fillText(el.text || '', el.x, el.y + (el.fontSize || 20));
        }
    });
    
    ctx.restore();
    
    // Add canvas to container
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Add pan/zoom support
    makeCanvasInteractive(canvas, sceneData);
}

function makeCanvasInteractive(canvas, sceneData) {
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    function redraw() {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(scale, scale);
        
        // Redraw all elements
        const elements = sceneData.elements || [];
        elements.forEach(el => {
            if (el.isDeleted) return;
            
            ctx.strokeStyle = el.strokeColor || '#000';
            ctx.fillStyle = el.backgroundColor || 'transparent';
            ctx.lineWidth = (el.strokeWidth || 1) / scale;
            
            if (el.type === 'rectangle') {
                ctx.beginPath();
                ctx.rect(el.x, el.y, el.width, el.height);
                if (el.backgroundColor && el.backgroundColor !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (el.type === 'ellipse') {
                ctx.beginPath();
                ctx.ellipse(
                    el.x + el.width / 2,
                    el.y + el.height / 2,
                    Math.abs(el.width / 2),
                    Math.abs(el.height / 2),
                    0, 0, Math.PI * 2
                );
                if (el.backgroundColor && el.backgroundColor !== 'transparent') {
                    ctx.fill();
                }
                ctx.stroke();
            } else if (el.type === 'line' || el.type === 'arrow') {
                const points = el.points || [];
                if (points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(el.x + points[0][0], el.y + points[0][1]);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(el.x + points[i][0], el.y + points[i][1]);
                    }
                    ctx.stroke();
                    
                    if (el.type === 'arrow' && points.length > 1) {
                        const last = points[points.length - 1];
                        const prev = points[points.length - 2];
                        const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
                        const headLen = 10 / scale;
                        
                        ctx.beginPath();
                        ctx.moveTo(el.x + last[0], el.y + last[1]);
                        ctx.lineTo(
                            el.x + last[0] - headLen * Math.cos(angle - Math.PI / 6),
                            el.y + last[1] - headLen * Math.sin(angle - Math.PI / 6)
                        );
                        ctx.moveTo(el.x + last[0], el.y + last[1]);
                        ctx.lineTo(
                            el.x + last[0] - headLen * Math.cos(angle + Math.PI / 6),
                            el.y + last[1] - headLen * Math.sin(angle + Math.PI / 6)
                        );
                        ctx.stroke();
                    }
                }
            } else if (el.type === 'text') {
                ctx.font = `${el.fontSize || 20}px ${el.fontFamily || 'sans-serif'}`;
                ctx.fillStyle = el.strokeColor || '#000';
                ctx.fillText(el.text || '', el.x, el.y + (el.fontSize || 20));
            }
        });
        
        ctx.restore();
    }
    
    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        scale *= delta;
        scale = Math.max(0.1, Math.min(5, scale)); // Limit zoom
        redraw();
    });
    
    // Mouse drag pan
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            panX += dx;
            panY += dy;
            lastX = e.clientX;
            lastY = e.clientY;
            redraw();
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });
    
    canvas.style.cursor = 'grab';
}
