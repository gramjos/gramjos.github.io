// Lightweight client-side manifest loader for dynamically rendered notes.
const CONTENT_BASE = '/try1_ready_2_serve';
const MANIFEST_URL = `${CONTENT_BASE}/manifest.json`;

let manifestPromise;
const htmlCache = new Map();

export function loadManifest() {
    if (!manifestPromise) {
        manifestPromise = fetch(MANIFEST_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Unable to fetch notes manifest (status ${response.status}).`);
                }
                return response.json();
            })
            .catch((error) => {
                manifestPromise = undefined;
                throw error;
            });
    }
    return manifestPromise;
}

export async function resolveNode(slugSegments) {
    const manifest = await loadManifest();
    const segments = slugSegments.filter(Boolean);
    if (segments.length === 0) {
        return { node: manifest.root, kind: 'directory' };
    }
    const result = walk(manifest.root, segments);
    if (!result) {
        throw new Error('Not Found');
    }
    return result;
}

export function fetchHtml(relativePath) {
    const normalised = relativePath.replace(/^\/+/, '');
    if (htmlCache.has(normalised)) {
        return htmlCache.get(normalised);
    }
    const url = `${CONTENT_BASE}/${normalised}`;
    const promise = fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Unable to fetch HTML fragment (${response.status}).`);
            }
            return response.text();
        })
        .catch((error) => {
            htmlCache.delete(normalised);
            throw error;
        });
    htmlCache.set(normalised, promise);
    return promise;
}

function walk(directoryNode, segments) {
    if (segments.length === 0) {
        return { node: directoryNode, kind: 'directory' };
    }
    const [head, ...rest] = segments;
    const nextDirectory = (directoryNode.directories || []).find((entry) => entry.slug === head);
    if (nextDirectory) {
        return walk(nextDirectory, rest);
    }
    const fileMatch = (directoryNode.files || []).find((entry) => entry.slug === head);
    if (fileMatch && rest.length === 0) {
        return { node: fileMatch, kind: 'file' };
    }
    return null;
}

export function toNotesHref(slugPath) {
    if (!slugPath) {
        return '/notes';
    }
    return `/notes/${slugPath}`;
}
