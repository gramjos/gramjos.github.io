const state = {
  data: null,
  currentId: null,
  pathLookup: {},
};

const elements = {
  navHome: document.getElementById("nav-home"),
  navAbout: document.getElementById("nav-about"),
  pageTitle: document.getElementById("page-title"),
  content: document.getElementById("page-content"),
  directoryList: document.getElementById("directory-list"),
  fileList: document.getElementById("file-list"),
  breadcrumb: document.getElementById("breadcrumb"),
  footerMeta: document.getElementById("footer-meta"),
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  try {
    state.data = await loadSiteData();
    state.pathLookup = buildPathLookup(state.data.pages);
    configureNav();
    hydrateFooter();
    bindContentLinkHandler();
    const initialId = hashToPageId() || state.data.homePageId;
    requestPage(initialId);
    window.addEventListener("hashchange", () => {
      const target = hashToPageId() || state.data.homePageId;
      applyPage(target);
    });
  } catch (error) {
    renderFatalError(error);
  }
}

async function loadSiteData() {
  const cacheBreaker = Date.now().toString(36);
  const response = await fetch(`site-data.json?v=${cacheBreaker}`);
  if (!response.ok) {
    throw new Error("Unable to load site-data.json");
  }
  return response.json();
}

function buildPathLookup(pages) {
  const lookup = {};
  for (const page of Object.values(pages)) {
    if (!page) {
      continue;
    }
    const paths = [page.sourcePath, ...(page.aliases || [])].filter(Boolean);
    paths.forEach((path) => {
      const key = normalizePath(path);
      if (key) {
        lookup[key] = page.id;
      }
    });
  }
  return lookup;
}

function configureNav() {
  const { navHome, navAbout } = elements;
  const { homePageId, aboutPageId } = state.data;
  if (!homePageId) {
    navHome.disabled = true;
  } else {
    navHome.addEventListener("click", () => requestPage(homePageId));
  }

  if (aboutPageId) {
    navAbout.addEventListener("click", () => requestPage(aboutPageId));
  } else {
    navAbout.disabled = true;
    navAbout.classList.add("is-hidden");
  }
}

function hydrateFooter() {
  const { generatedAt, source, siteTitle } = state.data;
  const stamp = new Date(generatedAt);
  const formatted = Number.isNaN(stamp.getTime()) ? generatedAt : stamp.toUTCString();
  elements.footerMeta.textContent = `Built ${formatted} from ${source}`;
  document.title = `${siteTitle} | Vault`;
}

function bindContentLinkHandler() {
  elements.content.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute("href");
    if (!href || isHashLink(href) || isAbsoluteUrl(href)) {
      return;
    }
    const pageId = resolvePageIdFromLink(href, state.pathLookup);
    if (pageId) {
      event.preventDefault();
      requestPage(pageId);
    }
  });
}

function resolvePageIdFromLink(link, lookup) {
  let target = normalizePath(link.split(/[?#]/)[0]);
  if (!target) {
    return null;
  }
  if (lookup[target]) {
    return lookup[target];
  }
  if (!target.endsWith(".html")) {
    const htmlCandidate = `${target.replace(/\/$/, "")}.html`;
    if (lookup[htmlCandidate]) {
      return lookup[htmlCandidate];
    }
  }
  if (!target.endsWith("README.html")) {
    const readmeCandidate = normaliseDirectoryReadme(target);
    if (lookup[readmeCandidate]) {
      return lookup[readmeCandidate];
    }
  }
  return null;
}

function normaliseDirectoryReadme(target) {
  const clean = target.replace(/\/$/, "");
  if (!clean) {
    return "README.html";
  }
  return `${clean}/README.html`;
}

function requestPage(pageId) {
  if (!state.data.pages[pageId]) {
    renderNotFound(pageId);
    return;
  }
  const targetHash = idToHash(pageId);
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
    return;
  }
  applyPage(pageId);
}

function applyPage(pageId) {
  const page = state.data.pages[pageId];
  if (!page) {
    renderNotFound(pageId);
    return;
  }
  state.currentId = pageId;
  document.title = `${page.title} | ${state.data.siteTitle}`;
  updateNavButtons(pageId);
  renderBreadcrumbs(page);
  renderContent(page);
  renderPanels(page);
}

function updateNavButtons(pageId) {
  const { navHome, navAbout } = elements;
  const { homePageId, aboutPageId } = state.data;
  toggleActive(navHome, pageId === homePageId);
  toggleActive(navAbout, aboutPageId ? pageId === aboutPageId : false);
}

function renderBreadcrumbs(page) {
  const frag = document.createDocumentFragment();
  const trail = buildBreadcrumbTrail(page);
  trail.forEach((crumb, index) => {
    if (index > 0) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = " / ";
      frag.appendChild(separator);
    }
    const label = pageLabel(crumb);
    if (index === trail.length - 1) {
      const span = document.createElement("span");
      span.className = "breadcrumb-current";
      span.textContent = label;
      frag.appendChild(span);
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "breadcrumb-link";
    button.textContent = label;
    button.addEventListener("click", () => requestPage(crumb.id));
    frag.appendChild(button);
  });
  replaceChildren(elements.breadcrumb, frag);
}

function buildBreadcrumbTrail(page) {
  const trail = [];
  let cursor = page;
  while (cursor) {
    trail.push(cursor);
    cursor = cursor.parent ? state.data.pages[cursor.parent] : null;
  }
  return trail.reverse();
}

function renderContent(page) {
  elements.pageTitle.textContent = page.title;
  elements.content.innerHTML = page.content;
  rewriteRelativeUrls(elements.content, page.basePath);
  enhanceCodeBlocks(elements.content);
}

function renderPanels(page) {
  const context = page.type === "directory" ? page : state.data.pages[page.parent] || null;
  const activeDirectoryId = page.type === "directory" ? page.id : page.parent;
  const activeFileId = page.type === "file" ? page.id : null;
  renderPanelList(elements.directoryList, context ? context.directories : [], activeDirectoryId);
  renderPanelList(elements.fileList, context ? context.files : [], activeFileId);
}

function renderPanelList(target, ids, activeId) {
  if (!ids || ids.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No entries";
    replaceChildren(target, empty);
    return;
  }
  const frag = document.createDocumentFragment();
  ids.forEach((id) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = state.data.pages[id].title;
    if (id === activeId) {
      button.classList.add("is-active");
    }
    button.addEventListener("click", () => requestPage(id));
    item.appendChild(button);
    frag.appendChild(item);
  });
  replaceChildren(target, frag);
}

function rewriteRelativeUrls(container, basePath) {
  if (!basePath) {
    return;
  }
  const baseUrl = new URL(basePath.endsWith("/") ? basePath : `${basePath}/`, "https://vault.local/");
  container.querySelectorAll("[href],[src]").forEach((node) => {
    const attr = node.hasAttribute("href") ? "href" : "src";
    const value = node.getAttribute(attr);
    if (!value || isHashLink(value) || isAbsoluteUrl(value)) {
      return;
    }
    const resolved = new URL(value, baseUrl);
    const normalized = resolved.pathname.replace(/^\//, "");
    node.setAttribute(attr, normalized);
  });
}

function toggleActive(element, isActive) {
  if (!element) {
    return;
  }
  element.classList.toggle("active", isActive);
}

function renderNotFound(pageId) {
  elements.pageTitle.textContent = "Page missing";
  elements.content.innerHTML = `<p>The page "${pageId}" is not available.</p>`;
  replaceChildren(elements.directoryList, createEmptyNode("No directories"));
  replaceChildren(elements.fileList, createEmptyNode("No files"));
}

function renderFatalError(error) {
  elements.pageTitle.textContent = "Site unavailable";
  elements.content.innerHTML = `<p>${error.message}</p>`;
  replaceChildren(elements.directoryList, createEmptyNode(""));
  replaceChildren(elements.fileList, createEmptyNode(""));
  console.error(error);
}

function replaceChildren(target, nodeOrFragment) {
  if (!target) {
    return;
  }
  target.textContent = "";
  if (nodeOrFragment) {
    target.appendChild(nodeOrFragment);
  }
}

function createEmptyNode(text) {
  const li = document.createElement("li");
  li.className = "empty-state";
  li.textContent = text;
  return li;
}

function hashToPageId() {
  const raw = window.location.hash.slice(1);
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch (error) {
    return null;
  }
}

function idToHash(id) {
  return `#${encodeURIComponent(id)}`;
}

function normalizePath(value) {
  const trimmed = value.replace(/^\.\//, "").replace(/^\/+/, "");
  try {
    return decodeURIComponent(trimmed);
  } catch (error) {
    return trimmed;
  }
}

function isHashLink(value) {
  return value.startsWith("#");
}

function isAbsoluteUrl(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value) || /^(?:[a-z]+:)/i.test(value) || value.startsWith("/");
}

function pageLabel(page) {
  if (!page || !page.sourcePath) {
    return page ? page.title : "";
  }
  const parts = normalizePath(page.sourcePath).split("/");
  const last = parts[parts.length - 1] || "";
  const stem = last.replace(/\.[^.]+$/, "");
  return stem || page.title;
}

function enhanceCodeBlocks(container) {
  if (!container) {
    return;
  }
  container.querySelectorAll(".copy-button").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }
    const targetId = button.getAttribute("data-target-id");
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
      return;
    }
    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      const codeElement = target.querySelector("code") || target;
      await copyCodeToClipboard(codeElement.textContent || "", button);
    });
  });
}

async function copyCodeToClipboard(text, button) {
  if (!text) {
    return;
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      legacyCopyToClipboard(text);
    }
    indicateCopied(button);
  } catch (error) {
    legacyCopyToClipboard(text);
    indicateCopied(button);
  }
}

function legacyCopyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (error) {
    console.warn("Legacy clipboard copy failed", error);
  }
  document.body.removeChild(textarea);
}

function indicateCopied(button) {
  if (!button) {
    return;
  }
  const previous = button.textContent;
  button.textContent = "Copied";
  button.classList.add("is-copied");
  setTimeout(() => {
    button.textContent = previous;
    button.classList.remove("is-copied");
  }, 1500);
}

