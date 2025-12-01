// Starfield generator using the box-shadow technique.
// Creates thousands of stars on a single DOM element for high performance.

// Animation scroll height - must match the CSS translateY value in @keyframes animStar
export const STARFIELD_SCROLL_HEIGHT = 2000;

/**
 * Generates star positions using box-shadow and applies them to a layer element.
 * @param {string} selector - CSS selector for the star layer element
 * @param {number} count - Number of stars to generate
 * @param {number} contentHeight - Height of the scroll loop (should match CSS animation)
 */
export const generateStars = (selector, count, contentHeight) => {
    const layer = document.querySelector(selector);
    if (!layer) {
        console.warn(`Starfield: Element "${selector}" not found. Stars will not be rendered for this layer.`);
        return;
    }

    const boxShadows = [];
    
    for (let i = 0; i < count; i++) {
        // Random X position (0 to 100vw)
        const x = Math.floor(Math.random() * 100); 
        // Random Y position (0 to contentHeight)
        const y = Math.floor(Math.random() * contentHeight);
        
        // Add the main star
        boxShadows.push(`${x}vw ${y}px #FFF`);
        
        // Create a duplicate star exactly 'contentHeight' pixels below 
        // to ensure seamless looping when the animation resets.
        boxShadows.push(`${x}vw ${y + contentHeight}px #FFF`);
    }

    // Apply the massive shadow string
    layer.style.boxShadow = boxShadows.join(', ');
};

/**
 * Initializes all three star layers with appropriate star counts.
 * Call this once when the app loads.
 */
export const initStarfield = () => {
    generateStars('#stars-small', 700, STARFIELD_SCROLL_HEIGHT);  // Many small stars
    generateStars('#stars-medium', 200, STARFIELD_SCROLL_HEIGHT); // Fewer medium stars
    generateStars('#stars-large', 100, STARFIELD_SCROLL_HEIGHT);  // Rare large stars
};
