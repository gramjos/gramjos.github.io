const guides = [
    {
        slug: "history-api",
        title: "History API essentials",
        summary: "Understand pushState, replaceState, and popstate for deep-link friendly navigation.",
        render: ({ codeBlock }) => `
            <p>The History API lets us change the browser address bar without full page reloads. We push a new entry when navigating forward, replace the current one for redirects, and listen to <code>popstate</code> for back/forward.</p>
            ${codeBlock(`history.pushState(stateObject, '', '/details');
window.addEventListener('popstate', (event) => {
  // restore your UI using event.state
});`)}
            <p>Routers bridge this API and the DOM by mapping URLs to view functions.</p>
        `,
    },
    {
        slug: "link-interception",
        title: "Intercepting anchor navigation",
        summary: "Convert standard anchor clicks into client-side route changes while preserving accessibility.",
        render: ({ codeBlock }) => `
            <p>Anchors remain fully accessible and crawlable, but the SPA hijacks clicks so the browser stays on the same document.</p>
            ${codeBlock(`document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.metaKey) return;
  const anchor = event.target.closest('a[href]');
  if (!anchor || anchor.target && anchor.target !== '_self') return;
  event.preventDefault();
  history.pushState({}, '', anchor.pathname);
});`)}
            <p>Always allow modified clicks (cmd/ctrl) to preserve expected browser behaviour.</p>
        `,
    },
    {
        slug: "routing-architecture",
        title: "Designing a tiny router",
        summary: "Compose route patterns, renderers, and navigation helpers into a clear architecture.",
        render: ({ codeBlock }) => `
            <p>A minimal router only needs a route table, a render loop, and a navigation helper. The clarity comes from keeping those responsibilities explicit.</p>
            ${codeBlock(`const routes = [
  { pattern: /^\/$/, render: renderHome },
  { pattern: /^\/guides$/, render: renderGuides },
  { pattern: /^\/guides\/(?<slug>[^/]+)$/, render: renderGuide },
];`)}
            <p>Everything else (state stores, transitions) can layer on top.</p>
        `,
    },
];

const guidesBySlug = new Map(guides.map((guide) => [guide.slug, guide]));

const router = createRouter({
    mountNode: document.getElementById('app'),
    routes: [
        createRoute('/', renderHome),
        createRoute('/guides', renderGuides),
        createRoute('/guides/:slug', renderGuideDetail),
        createRoute('*', renderNotFound),
    ],
});

router.start();

function renderHome(ctx) {
    document.title = 'Plain Vanilla SPA';
    ctx.mount.innerHTML = `
        <section>
            <h1>Deep linking with zero frameworks</h1>
            <p>
                This single-page app uses nothing more than the History API and a tiny dispatcher.
                Links stay semantic, URLs stay clean, and every view is just a function.
            </p>
            <ul>
                <li>Intercept anchors and emit navigation intents</li>
                <li>Use <code>pushState</code>/<code>replaceState</code> to keep the address bar honest</li>
                <li>Listen to <code>popstate</code> to sync browser chrome with your views</li>
            </ul>
            <p>
                Ready for the deeper dive? Browse the <a href="/guides">routing guides</a> to see each building block explained.
            </p>
        </section>
        <section>
            <h2>Route-aware rendering</h2>
            <p>
                The router keeps track of the current path (<strong>${escapeHtml(ctx.location.path)}</strong>)
                and hands that information to declarative view functions. No framework magic needed.
            </p>
            ${codeBlock(`// a view is just a function
function renderHome(ctx) {
  ctx.mount.innerHTML = '<h1>Hello</h1>';
}`)}
        </section>
    `;
}

function renderGuides(ctx) {
    document.title = 'Guides · Plain Vanilla SPA';
    ctx.mount.innerHTML = `
        <section>
            <h1>Routing building blocks</h1>
            <p>Pick a guide to explore a focused topic. Each one is a live route, so you can deep link straight to it.</p>
            <div class="card-grid">
                ${guides.map((guide) => `
                    <article class="card">
                        <h2>${escapeHtml(guide.title)}</h2>
                        <p>${escapeHtml(guide.summary)}</p>
                        <a href="/guides/${escapeHtml(guide.slug)}">Open guide</a>
                    </article>
                `).join('')}
            </div>
        </section>
    `;
}

function renderGuideDetail(ctx) {
    const guide = guidesBySlug.get(ctx.params.slug);
    if (!guide) {
        document.title = 'Guide not found · Plain Vanilla SPA';
        ctx.mount.innerHTML = `
            <section>
                <h1>We could not find that guide</h1>
                <p>No guide exists for <code>${escapeHtml(ctx.params.slug)}</code>.</p>
                <p><a href="/guides">Return to the list</a> and choose another topic.</p>
            </section>
        `;
        return;
    }

    document.title = `${guide.title} · Plain Vanilla SPA`;
    ctx.mount.innerHTML = `
        <section>
            <a class="back-link" href="/guides">← Back to guides</a>
            <h1>${escapeHtml(guide.title)}</h1>
            <p class="muted">Deep link: <code>${escapeHtml(ctx.location.path)}</code></p>
            ${guide.render({ codeBlock })}
        </section>
    `;
}

function renderNotFound(ctx) {
    document.title = '404 · Plain Vanilla SPA';
    ctx.mount.innerHTML = `
        <section>
            <h1>Lost in the twisty maze</h1>
            <p>Looks like <code>${escapeHtml(ctx.location.path)}</code> does not map to a registered route.</p>
            <p>Head <a href="/">home</a> or explore the <a href="/guides">guided tour</a>.</p>
        </section>
    `;
}

function createRoute(template, render) {
    if (template === '*') {
        return {
            template,
            render,
            isCatchAll: true,
            match: () => ({ params: {} }),
        };
    }
    const { pattern } = compileRoute(template);
    return {
        template,
        render,
        isCatchAll: false,
        match: (path) => {
            const match = pattern.exec(path);
            return match ? { params: match.groups || {} } : null;
        },
    };
}

function createRouter({ mountNode, routes }) {
    const baseUrl = new URL(window.originalHref || window.location.href);
    const baseDir = new URL('.', baseUrl).pathname.replace(/\/$/, '');
    const navLinks = Array.from(document.querySelectorAll('.site-nav a'));
    const state = { currentPath: null };

    const normalRoutes = routes.filter((route) => !route.isCatchAll);
    const fallbackRoute = routes.find((route) => route.isCatchAll);

    const onLinkClick = (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = event.target.closest('a[href]');
        if (!anchor) return;
        if (anchor.target && anchor.target !== '_self') return;
        if (anchor.hasAttribute('download') || anchor.getAttribute('rel') === 'external') return;
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

        const resolved = new URL(anchor.href, baseUrl);
        if (resolved.origin !== baseUrl.origin) return;

        const appPath = toAppPath(resolved.pathname);
        if (appPath == null) return;

        event.preventDefault();
        navigate(appPath + resolved.search + resolved.hash);
    };

    const onPopState = () => onLocationChange({ triggeredByPop: true });

    const onLocationChange = ({ triggeredByPop = false } = {}) => {
        const currentUrl = new URL(window.location.href);
        const path = toAppPath(currentUrl.pathname);
        if (path == null) {
            console.warn('Ignoring navigation outside the SPA base path.');
            return;
        }

        if (!triggeredByPop && state.currentPath === path && currentUrl.search === '' && currentUrl.hash === '') {
            return;
        }

        state.currentPath = path;
        const locationState = {
            path,
            search: currentUrl.search,
            hash: currentUrl.hash,
            url: currentUrl,
        };

        updateActiveNav(locationState);
        resolveRoute(path, locationState);
    };

    const resolveRoute = (path, locationState) => {
        for (const route of normalRoutes) {
            const match = route.match(path);
            if (match) {
                renderRoute(route, match.params, locationState);
                return;
            }
        }
        if (fallbackRoute) {
            renderRoute(fallbackRoute, { path }, locationState);
        }
    };

    const renderRoute = (route, params, locationState) => {
        const context = {
            mount: mountNode,
            params,
            location: locationState,
            navigate,
            route: route.template,
        };
        route.render(context);
    };

    const updateActiveNav = (locationState) => {
        navLinks.forEach((link) => {
            const resolved = new URL(link.getAttribute('href'), baseUrl);
            const linkPath = toAppPath(resolved.pathname);
            const isActive = linkPath === '/'
                ? locationState.path === '/'
                : locationState.path === linkPath || locationState.path.startsWith(linkPath + '/');
            if (isActive) {
                link.dataset.active = 'true';
            } else {
                delete link.dataset.active;
            }
        });
    };

    const navigate = (destination, { replace = false } = {}) => {
        const [pathname, suffix] = splitDestination(destination);
        if (!pathname.startsWith('/')) {
            throw new Error('Router.navigate expects an absolute path.');
        }
        const browserPath = toBrowserPath(pathname) + suffix;
        if (replace) {
            history.replaceState({}, '', browserPath);
        } else if (browserPath !== window.location.pathname + window.location.search + window.location.hash) {
            history.pushState({}, '', browserPath);
        }
        onLocationChange();
    };

    const toAppPath = (pathname) => {
        if (baseDir) {
            if (!pathname.startsWith(baseDir)) return null;
            const relative = pathname.slice(baseDir.length) || '/';
            return normalisePath(relative);
        }
        return normalisePath(pathname);
    };

    const toBrowserPath = (pathname) => {
        const clean = normalisePath(pathname);
        if (baseDir) {
            return clean === '/'
                ? `${baseDir}/`
                : `${baseDir}${clean}`;
        }
        return clean;
    };

    const normalisePath = (value) => {
        if (!value) return '/';
        let result = value.startsWith('/') ? value : `/${value}`;
        if (result.length > 1 && result.endsWith('/')) {
            result = result.replace(/\/+$/, '');
        }
        if (result === '/index.html') {
            return '/';
        }
        return result || '/';
    };

    const splitDestination = (destination) => {
        const index = destination.search(/[?#]/);
        if (index === -1) return [destination, ''];
        return [destination.slice(0, index), destination.slice(index)];
    };

    return {
        start: () => {
            window.addEventListener('popstate', onPopState);
            document.addEventListener('click', onLinkClick);
            onLocationChange({ triggeredByPop: true });
        },
        navigate,
        toAppPath,
    };
}

function compileRoute(template) {
    const cleaned = template === '/' ? '/' : template.replace(/\/+$/, '');
    const paramRegex = /:([A-Za-z0-9_]+)/g;
    let pattern = '';
    let cursor = 0;
    let match;
    while ((match = paramRegex.exec(cleaned)) !== null) {
        pattern += escapeRegExp(cleaned.slice(cursor, match.index));
        pattern += `(?<${match[1]}>[^/]+)`;
        cursor = match.index + match[0].length;
    }
    pattern += escapeRegExp(cleaned.slice(cursor));
    const full = `^${pattern}/?$`;
    return { pattern: new RegExp(full) };
}

function codeBlock(source) {
    return `<pre class="code-block"><code>${escapeHtml(source)}</code></pre>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
