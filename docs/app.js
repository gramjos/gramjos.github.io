const ROUTE_PREFIX = "#/page/";

const state = {
  site: null,
  aliasIndex: {},
  pathIndex: {},
  currentPageId: null,
};

const dom = {
  appShell: document.querySelector("[data-app-shell]"),
  errorRegion: document.querySelector("[data-error-region]"),
  errorMessage: document.querySelector("[data-error-message]"),
  siteTitle: document.querySelector("[data-site-title]"),
  navHome: document.querySelector("[data-nav-home]"),
  navAbout: document.querySelector("[data-nav-about]"),
  breadcrumb: document.querySelector("[data-breadcrumbs]"),
  directoryList: document.querySelector("[data-directory-list]"),
  fileList: document.querySelector("[data-file-list]"),
  contentRegion: document.querySelector("[data-content-region]"),
  pageContent: document.querySelector("[data-page-content]"),
  footerMeta: document.querySelector("[data-footer-meta]"),
};

init();

async function init() {
  if (!validateDom()) {
    displayFatalError("Required layout nodes were not found in the document.");
    return;
  }

  try {
    const response = await fetch("site-data.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const siteData = await response.json();
    hydrate(siteData);
    handleRoute({ replaceHash: true });
    window.addEventListener("hashchange", () => handleRoute());
  } catch (error) {
    console.error(error);
    displayFatalError("We couldn't load the published vault data.");
  }
}

function validateDom() {
  return (
    dom.appShell &&
    dom.errorRegion &&
    dom.siteTitle &&
    dom.navHome &&
    dom.breadcrumb &&
    dom.directoryList &&
    dom.fileList &&
    dom.contentRegion &&
    dom.pageContent &&
    dom.footerMeta
  );
}

function hydrate(siteData) {
  state.site = siteData;
  state.pathIndex = { ...(siteData.pathIndex || {}) };
  state.aliasIndex = buildAliasIndex(siteData);

  const title = siteData.siteTitle || "Vault";
  dom.siteTitle.textContent = title;
  document.title = title;

  dom.navHome.addEventListener("click", () => navigateTo(siteData.homePageId));

  if (dom.navAbout) {
    const hasAbout = Boolean(siteData.aboutPageId && siteData.pages?.[siteData.aboutPageId]);
    dom.navAbout.classList.toggle("is-hidden", !hasAbout);
    if (hasAbout) {
      dom.navAbout.addEventListener("click", () => navigateTo(siteData.aboutPageId));
    }
  }
}

function buildAliasIndex(siteData) {
  const aliases = { ...(siteData.aliasIndex || {}) };
  const pages = siteData.pages || {};
  Object.values(pages).forEach((page) => {
    (page.aliases || []).forEach((alias) => {
      const key = alias.trim().toLowerCase();
      if (key && !aliases[key]) {
        aliases[key] = page.id;
      }
    });
    if (page.relPath && !aliases[page.relPath.toLowerCase()]) {
      aliases[page.relPath.toLowerCase()] = page.id;
    }
  });
  return aliases;
}

function handleRoute(options = {}) {
  if (!state.site) {
    return;
  }
  const requestedId = parseHash();
  let resolvedId = null;

  if (requestedId && state.site.pages?.[requestedId]) {
    resolvedId = requestedId;
  } else if (requestedId) {
    resolvedId = resolveAlias(requestedId) || null;
  }

  if (!resolvedId && state.site.homePageId) {
    resolvedId = state.site.homePageId;
  }

  if (!resolvedId || !state.site.pages?.[resolvedId]) {
    displayFatalError("The requested page could not be found in this build.");
    return;
  }

  state.currentPageId = resolvedId;
  renderCurrentPage();

  const targetHash = composeHash(resolvedId);
  if (options.replaceHash) {
    if (window.location.hash !== targetHash) {
      history.replaceState(null, "", targetHash);
    }
  } else if (window.location.hash !== targetHash) {
    history.replaceState(null, "", targetHash);
  }
}

function renderCurrentPage() {
  const page = state.site.pages[state.currentPageId];
  if (!page) {
    displayFatalError("The page metadata is missing from site-data.");
    return;
  }

  const title = page.title || page.relPath || "Untitled";
  document.title = `${title} • ${state.site.siteTitle || "Vault"}`;

  dom.pageContent.innerHTML = page.html || "<p>This page has no content.</p>";
  dom.contentRegion.scrollTop = 0;

  renderBreadcrumbs(page);
  renderDirectoryPanel(page);
  renderFilePanel(page);
  renderFooter();
  rewriteLinks(page);
  addCopyButtonsToCodeBlocks();
  renderDownloadButton(page);
  queueMathTypeset();
}

function renderBreadcrumbs(page) {
  const container = dom.breadcrumb;
  container.innerHTML = "";

  const crumbs = [];
  crumbs.push({ label: "Root", id: state.site.homePageId });

  const dirChain = getDirectoryChain(page.dirPath);
  dirChain.forEach((dirKey) => {
    if (dirKey === ".") {
      return;
    }
    const dirInfo = state.site.directories?.[dirKey];
    if (!dirInfo) {
      return;
    }
    const label = dirInfo.name || dirKey.split("/").pop() || dirKey;
    crumbs.push({ label, id: dirInfo.readmeId || null });
  });

  if (page.type !== "readme") {
    crumbs.push({ label: page.title || page.relPath, id: page.id });
  }

  crumbs.forEach((crumb, index) => {
    const isLast = index === crumbs.length - 1;
    const element = document.createElement(crumb.id && !isLast ? "button" : "span");
    element.className = "breadcrumb-item";

    if (!isLast && crumb.id) {
      element.type = "button";
      element.textContent = crumb.label;
      element.addEventListener("click", () => navigateTo(crumb.id));
    } else {
      element.textContent = crumb.label;
      if (isLast) {
        element.setAttribute("aria-current", "page");
      }
    }

    container.appendChild(element);
    if (index < crumbs.length - 1) {
      const divider = document.createElement("span");
      divider.className = "breadcrumb-divider";
      divider.textContent = "/";
      container.appendChild(divider);
    }
  });
}

function renderDirectoryPanel(page) {
  const list = dom.directoryList;
  list.innerHTML = "";
  const dirInfo = state.site.directories?.[page.dirPath] || {
    subdirectories: [],
  };
  const subdirs = [...(dirInfo.subdirectories || [])];
  if (!subdirs.length) {
    const empty = document.createElement("li");
    empty.className = "is-empty";
    empty.textContent = "No subdirectories";
    list.appendChild(empty);
    return;
  }

  subdirs
    .map((key) => ({ key, info: state.site.directories?.[key] }))
    .sort((a, b) => {
      const aLabel = a.info?.name || a.key;
      const bLabel = b.info?.name || b.key;
      return aLabel.localeCompare(bLabel);
    })
    .forEach(({ key, info }) => {
      const label = info?.name || key.split("/").pop() || key;
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.textContent = label;

      const readmeId = info?.readmeId || null;
      const pageDir = page.dirPath || ".";
      const isActive = pageDir === key || pageDir.startsWith(`${key}/`);
      if (isActive) {
        li.classList.add("is-active");
      }

      if (readmeId) {
        button.addEventListener("click", () => navigateTo(readmeId));
      } else {
        button.disabled = true;
        button.title = "This folder is included for assets and has no page.";
      }

      li.appendChild(button);
      list.appendChild(li);
    });
}

function renderFilePanel(page) {
  const list = dom.fileList;
  list.innerHTML = "";
  const dirInfo = state.site.directories?.[page.dirPath] || { pageIds: [], readmeId: null };
  const entries = [];

  // Don't add README to the file panel - it's shown when clicking the directory
  // Only show regular pages in this directory
  (dirInfo.pageIds || []).forEach((id) => {
    const filePage = state.site.pages[id];
    entries.push({
      id,
      label: filePage?.title || filePage?.relPath || id,
    });
  });

  if (!entries.length) {
    const empty = document.createElement("li");
    empty.className = "is-empty";
    empty.textContent = "No pages in this folder";
    list.appendChild(empty);
    return;
  }

  entries
    .sort((a, b) => a.label.localeCompare(b.label))
    .forEach(({ id, label }) => {
      const li = document.createElement("li");
      if (id === page.id) {
        li.classList.add("is-active");
      }
      const button = document.createElement("button");
      button.textContent = label;
      button.addEventListener("click", () => navigateTo(id));
      li.appendChild(button);
      list.appendChild(li);
    });
}

function renderFooter() {
  if (!state.site) {
    return;
  }
  const generated = state.site.generatedAt ? new Date(state.site.generatedAt) : null;
  const timestamp = generated && !Number.isNaN(generated.valueOf()) ? generated.toLocaleString() : "unknown date";
  const source = state.site.sourcePath || "unspecified";
  dom.footerMeta.textContent = `Generated ${timestamp} • Source vault: ${source}`;
}

function renderDownloadButton(page) {
  const container = dom.pageContent;
  if (!container || !page) {
    return;
  }

  // Remove any existing download section before adding a new one
  const existing = container.querySelector(".page-download");
  if (existing) {
    existing.remove();
  }

  if (typeof page.markdown !== "string" || !page.markdown.length) {
    return;
  }

  const section = document.createElement("div");
  section.className = "page-download";

  const caption = document.createElement("p");
  caption.className = "page-download__caption";
  caption.textContent = "Need the original Markdown?";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "page-download__button";
  button.textContent = "Download Markdown";

  button.addEventListener("click", () => {
    const filename = (page.relPath ? page.relPath.split("/").pop() : null) || `${page.title || "page"}.md`;
    const blob = new Blob([page.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  section.appendChild(caption);
  section.appendChild(button);
  container.appendChild(section);
}

function queueMathTypeset() {
  if (typeof window === "undefined") {
    return;
  }
  const mathJax = window.MathJax;
  if (!mathJax || !dom.pageContent) {
    return;
  }

  if (typeof mathJax.typesetPromise === "function") {
    const target = [dom.pageContent];
    if (typeof mathJax.typesetClear === "function") {
      mathJax.typesetClear(target);
    }
    mathJax.typesetPromise(target).catch((error) => {
      console.warn("MathJax typeset failed", error);
    });
  } else if (mathJax.Hub && mathJax.Hub.Queue) {
    mathJax.Hub.Queue(["Typeset", mathJax.Hub, dom.pageContent]);
  }
}

function rewriteLinks(page) {
  const container = dom.pageContent;
  if (!container) {
    return;
  }

  const anchors = container.querySelectorAll("a");
  anchors.forEach((anchor) => {
    const wikiTarget = anchor.dataset.wikilinkTarget;
    if (wikiTarget) {
      const resolvedId = resolveAlias(wikiTarget);
      if (resolvedId) {
        anchor.href = composeHash(resolvedId);
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          navigateTo(resolvedId);
        });
      } else {
        anchor.classList.add("is-broken-link");
        anchor.title = `Missing page: ${wikiTarget}`;
      }
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
      if (href && href.startsWith("http")) {
        anchor.setAttribute("rel", "noreferrer noopener");
        anchor.setAttribute("target", "_blank");
      }
      return;
    }
    if (href.startsWith("#")) {
      return;
    }

    const joined = joinPaths(page.dirPath, href);
    const normalized = normalizePath(joined);
    const resolvedId = state.pathIndex[normalized] || resolveAlias(normalized);
    if (resolvedId && state.site.pages?.[resolvedId]) {
      anchor.href = composeHash(resolvedId);
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        navigateTo(resolvedId);
      });
    } else {
      anchor.classList.add("is-broken-link");
      anchor.title = `Unresolved link: ${href}`;
    }
  });

  // Rewrite image src paths
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("http") || src.startsWith("data:")) {
      return;
    }

    // For wiki-style images, resolve the path relative to the page
    if (img.classList.contains("wiki-image")) {
      const resolvedPath = resolveImagePath(page.dirPath, src);
      if (resolvedPath) {
        img.src = resolvedPath;
      } else {
        img.classList.add("is-broken-image");
        img.alt = `Missing image: ${src}`;
        img.title = `Image not found: ${src}`;
      }
    } else {
      // Standard markdown images with relative paths
      const joined = joinPaths(page.dirPath, src);
      const normalized = normalizePath(joined);
      img.src = normalized;
    }
  });
}

function resolveImagePath(dirPath, imageName) {
  // First try in the same directory as the page
  let candidate = joinPaths(dirPath, imageName);
  if (checkAssetExists(candidate)) {
    return candidate;
  }

  // Try in a graphics subdirectory
  candidate = joinPaths(dirPath, "graphics", imageName);
  if (checkAssetExists(candidate)) {
    return candidate;
  }

  // Try in root graphics directory
  candidate = joinPaths("graphics", imageName);
  if (checkAssetExists(candidate)) {
    return candidate;
  }

  // Search all directories for this asset
  for (const dir of Object.values(state.site.directories || {})) {
    if (dir.assetPaths && dir.assetPaths.length > 0) {
      for (const assetPath of dir.assetPaths) {
        const assetName = assetPath.split("/").pop();
        if (assetName === imageName || assetPath.endsWith("/" + imageName)) {
          return assetPath;
        }
      }
    }
  }

  return null;
}

function checkAssetExists(path) {
  // Check if this asset exists in any directory's assetPaths
  for (const dir of Object.values(state.site.directories || {})) {
    if (dir.assetPaths && dir.assetPaths.includes(path)) {
      return true;
    }
  }
  return false;
}

function navigateTo(pageId) {
  if (!pageId || !state.site?.pages?.[pageId]) {
    console.warn("Attempted to navigate to missing page", pageId);
    return;
  }
  const hash = composeHash(pageId);
  if (window.location.hash === hash) {
    state.currentPageId = pageId;
    renderCurrentPage();
  } else {
    window.location.hash = hash;
  }
}

function parseHash() {
  const hash = window.location.hash || "";
  if (!hash.startsWith(ROUTE_PREFIX)) {
    return null;
  }
  const encoded = hash.slice(ROUTE_PREFIX.length);
  try {
    return decodeURIComponent(encoded);
  } catch (error) {
    console.warn("Failed to decode hash", error);
    return encoded;
  }
}

function composeHash(pageId) {
  return `${ROUTE_PREFIX}${encodeURIComponent(pageId)}`;
}

function resolveAlias(alias) {
  if (!alias) {
    return null;
  }
  const key = alias.trim().toLowerCase();
  if (!key) {
    return null;
  }
  return state.aliasIndex[key] || null;
}

function getDirectoryChain(dirPath) {
  if (!dirPath || dirPath === ".") {
    return ["."];
  }
  const parts = dirPath.split("/");
  const chain = ["."];
  let cursor = "";
  parts.forEach((part) => {
    if (!part) {
      return;
    }
    cursor = cursor ? `${cursor}/${part}` : part;
    chain.push(cursor);
  });
  return chain;
}

function joinPaths(base, relative) {
  const cleanedBase = !base || base === "." ? "" : base;
  if (!cleanedBase) {
    return relative;
  }
  if (!relative) {
    return cleanedBase;
  }
  const normalizedBase = cleanedBase.replace(/\\/g, "/");
  const normalizedRelative = relative.replace(/\\/g, "/");
  return `${normalizedBase}/${normalizedRelative}`;
}

function normalizePath(path) {
  const segments = [];
  path
    .replace(/\\/g, "/")
    .split("/")
    .forEach((segment) => {
      if (!segment || segment === ".") {
        return;
      }
      if (segment === "..") {
        segments.pop();
      } else {
        segments.push(segment);
      }
    });
  return segments.join("/");
}

function displayFatalError(message) {
  if (dom.appShell) {
    dom.appShell.classList.add("is-hidden");
  }
  if (dom.errorRegion) {
    dom.errorRegion.classList.remove("is-hidden");
  }
  if (dom.errorMessage) {
    dom.errorMessage.textContent = message;
  }
}

function addCopyButtonsToCodeBlocks() {
  const codeBlocks = dom.pageContent.querySelectorAll("pre > code");
  
  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    
    // Skip if button already exists
    if (pre.querySelector(".copy-code-button")) {
      return;
    }
    
    // Create copy button
    const button = document.createElement("button");
    button.className = "copy-code-button";
    button.type = "button";
    button.setAttribute("aria-label", "Copy code to clipboard");
    button.innerHTML = `
      <svg class="copy-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 10.5V3.5C3 2.67157 3.67157 2 4.5 2H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="copy-label">Copy</span>
    `;
    
    // Add click handler
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const code = codeBlock.textContent || "";
      
      try {
        // Use Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code);
        } else {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = code;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        
        // Show success feedback
        button.classList.add("copied");
        const label = button.querySelector(".copy-label");
        if (label) {
          label.textContent = "Copied!";
        }
        
        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove("copied");
          if (label) {
            label.textContent = "Copy";
          }
        }, 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
        const label = button.querySelector(".copy-label");
        if (label) {
          label.textContent = "Failed";
          setTimeout(() => {
            label.textContent = "Copy";
          }, 2000);
        }
      }
    });
    
    // Wrap pre in a container for positioning
    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    wrapper.appendChild(button);
  });
}
