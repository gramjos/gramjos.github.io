// Magnetic micro-interaction utility
// Creates a "magnetic" effect where elements move towards the cursor when nearby

const DAMPING_FACTOR = 0.3;
const DEFAULT_SELECTOR = '.button-primary, .button-secondary, .site-nav a, .brand a, .card a, .notes-directory-panel li a, .notes-backlink, .breadcrumb a';

/**
 * Applies a magnetic effect to an element.
 * @param {HTMLElement} element - The element to apply the effect to
 * @param {Object} options - Configuration options
 * @param {number} options.damping - How much to dampen the movement (0-1, default 0.3)
 */
export function applyMagneticEffect(element, options = {}) {
    const damping = options.damping ?? DAMPING_FACTOR;
    
    // Store original transition to restore on cleanup
    const originalTransition = element.style.transition;
    
    // Cache element bounds to avoid forced layout recalculation on every mouse move
    let cachedRect = null;
    
    const updateCache = () => {
        cachedRect = element.getBoundingClientRect();
    };
    
    const handleMouseEnter = () => {
        // Update cache when mouse enters
        updateCache();
    };
    
    const handleMouseMove = (e) => {
        // Use cached bounds if available, otherwise update
        if (!cachedRect) {
            updateCache();
        }
        
        const centerX = cachedRect.left + cachedRect.width / 2;
        const centerY = cachedRect.top + cachedRect.height / 2;
        
        // Calculate distance from center
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        
        // Apply dampened translation
        const translateX = deltaX * damping;
        const translateY = deltaY * damping;
        
        // Apply transform without transition for smooth tracking
        element.style.transition = 'none';
        element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    };
    
    const handleMouseLeave = () => {
        // Clear cached bounds
        cachedRect = null;
        
        // Spring back with elastic transition
        element.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        element.style.transform = 'translate(0, 0)';
    };
    
    // Use the element itself for event listeners
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    // Store cleanup function on the element
    element._magneticCleanup = () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.style.transition = originalTransition;
        element.style.transform = '';
    };
    
    return element._magneticCleanup;
}

/**
 * Removes the magnetic effect from an element.
 * @param {HTMLElement} element - The element to clean up
 */
export function removeMagneticEffect(element) {
    if (element._magneticCleanup) {
        element._magneticCleanup();
        delete element._magneticCleanup;
    }
}

/**
 * Initializes magnetic effects on all clickable elements matching the selector.
 * @param {string} selector - CSS selector for elements to apply effect to
 * @param {Object} options - Configuration options
 */
export function initMagneticEffects(selector = DEFAULT_SELECTOR, options = {}) {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
        // Skip if already has magnetic effect
        if (element._magneticCleanup) return;
        applyMagneticEffect(element, options);
    });
}

/**
 * Re-initializes magnetic effects - useful after SPA navigation.
 * Cleans up existing effects and applies to new elements.
 * @param {string} selector - CSS selector for elements to apply effect to
 * @param {Object} options - Configuration options
 */
export function refreshMagneticEffects(selector = DEFAULT_SELECTOR, options = {}) {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    
    // Apply to elements that don't have the effect yet
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
        if (!element._magneticCleanup) {
            applyMagneticEffect(element, options);
        }
    });
}

// Default export for convenience
export default {
    applyMagneticEffect,
    removeMagneticEffect,
    initMagneticEffects,
    refreshMagneticEffects,
};
