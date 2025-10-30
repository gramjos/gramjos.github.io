// Entry point wires the router to the DOM mount point.
import { createRoute, createRouter } from './router.js';
import { renderNoteDetail, renderGuideDetail, renderGuides, renderNotes, renderHome, renderNotFound } from './views/index.js';

// Wire up the view functions to URL templates.
const router = createRouter({
    mountNode: document.getElementById('app'),
    routes: [
        createRoute('/', renderHome),
        createRoute('/guides', renderGuides),
        createRoute('/notes', renderNotes),
        createRoute('/guides/:slug', renderGuideDetail),
        createRoute('/notes/:path*', renderNoteDetail),
        createRoute('*', renderNotFound),
    ],
});

// This call attaches the global click/popstate listeners
// and runs the first route match to render the initial page.
router.start();
