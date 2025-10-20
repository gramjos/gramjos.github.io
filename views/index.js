// View functions stay modular so routing just chooses among them.
import { guides, guidesBySlug } from '../guides.js';
import { codeBlock, escapeHtml } from '../utils/rendering.js';

export function renderHome(ctx) {
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

export function renderGuides(ctx) {
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

export function renderGuideDetail(ctx) {
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
            ${guide.render()}
        </section>
    `;
}

export function renderNotFound(ctx) {
    document.title = '404 · Plain Vanilla SPA';
    ctx.mount.innerHTML = `
        <section>
            <h1>Lost in the twisty maze</h1>
            <p>Looks like <code>${escapeHtml(ctx.location.path)}</code> does not map to a registered route.</p>
            <p>Head <a href="/">home</a> or explore the <a href="/guides">guided tour</a>.</p>
        </section>
    `;
}
