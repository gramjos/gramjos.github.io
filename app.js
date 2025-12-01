// Entry point wires the router to the DOM mount point.
import { createRoute, createRouter } from './router.js';
import { renderNoteDetail, renderGuideDetail, renderAbout, renderGuides, renderNotes, renderHome, renderNotFound } from './views/index.js';
import { renderProjects, renderProjectDetail } from './projects/projects-view.js';
import { initStarfield } from './utils/starfield.js';
import { initMagneticEffects } from './utils/magnetic.js';

// Initialize the starfield background
initStarfield();

// Initialize magnetic effects on header navigation
initMagneticEffects('.site-nav a, .brand a');

// Initialize brand click animation
function initBrandClickAnimation() {
    const brandLink = document.querySelector('.brand a');
    if (!brandLink) return;
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    
    brandLink.addEventListener('click', (e) => {
        // Remove class if already present (from a previous click)
        brandLink.classList.remove('brand--clicked');
        
        // Force reflow to restart animation
        void brandLink.offsetWidth;
        
        // Add class to trigger animation
        brandLink.classList.add('brand--clicked');
        
        // Remove class after animation completes
        setTimeout(() => {
            brandLink.classList.remove('brand--clicked');
        }, 600); // Match animation duration
    });
}

initBrandClickAnimation();

// Initialize mobile navigation toggle
function initMobileNavToggle() {
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.querySelector('.site-nav');
    
    if (!navToggle || !siteNav) return;
    
    navToggle.addEventListener('click', () => {
        const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isOpen);
        siteNav.classList.toggle('nav-open', !isOpen);
    });
    
    // Close menu when a link is clicked
    siteNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', 'false');
            siteNav.classList.remove('nav-open');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!siteNav.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.setAttribute('aria-expanded', 'false');
            siteNav.classList.remove('nav-open');
        }
    });
}

initMobileNavToggle();

// Wire up the view functions to URL templates.
debugger; 
const router = createRouter({
    mountNode: document.getElementById('app'),
    routes: [
        createRoute('/', renderHome),
        createRoute('/about', renderAbout),
        createRoute('/guides', renderGuides),
        createRoute('/notes', renderNotes),
        createRoute('/projects', renderProjects),
        createRoute('/guides/:slug', renderGuideDetail),
        createRoute('/notes/:path*', renderNoteDetail),
        createRoute('/projects/:id', renderProjectDetail),
        createRoute('*', renderNotFound),
    ],
});

// This call attaches the global click/popstate listeners
// and runs the first route match to render the initial page.
debugger; 
router.start();
