// Entry point wires the router to the DOM mount point.
import { createRoute, createRouter } from './router.js';
import { renderGuideDetail, renderGuides, renderHome, renderNotFound } from './views/index.js';

// Wire up the view functions to URL templates.
const router = createRouter({
    mountNode: document.getElementById('app'),
    routes: [
        createRoute('/', renderHome),
        createRoute('/guides', renderGuides),
        createRoute('/guides/:slug', renderGuideDetail),
        createRoute('*', renderNotFound),
    ],
});

// Sync the initial URL and attach listeners.
router.start();
