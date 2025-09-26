# Client-Side Routing Architecture

This document provides a comprehensive overview of the client-side routing mechanism implemented for this single-page application (SPA). The architecture is designed for modern web standards, leveraging the History API to provide clean URLs without hashbangs, while remaining compatible with static hosting environments like GitHub Pages.

## Core Principles

The routing solution is predicated on the following principles:

1.  **Progressive Enhancement**: The application utilizes standard `<a href="...">` anchor tags for navigation. This ensures a baseline of accessibility and search engine crawlability.
2.  **Centralized Navigation Control**: All navigation events, whether initiated by user clicks or browser history actions (back/forward buttons), are funneled through a unified event-driven system.
3.  **Declarative Route Management**: Views are associated with routes declaratively in the HTML markup using a custom element, `<view-route>`.
4.  **Static Hosting Compatibility**: A workaround is implemented to handle deep linking and page reloads, which would otherwise result in 404 errors on a static server.

## Detailed Routing Flow

The routing process can be deconstructed into a sequence of operations, from initial user interaction to the final view rendering.

### 1. Navigation Interception

-   **Event Listener**: A single, delegated `click` event listener is attached to the `document.body`.
-   **Target Identification**: When a click occurs, the listener traverses up the DOM tree from the event target to find the closest `<a>` element.
-   **Action Prevention**: If a valid anchor with an `href` attribute is found, the default browser navigation action is prevented by calling `event.preventDefault()`.
-   **Custom Event Dispatch**: A `CustomEvent` named `navigate` is dispatched on a central `EventTarget`. The event's `detail` payload contains the destination URL, extracted from the anchor's `href`.

### 2. History and State Management

-   **`pushState` Execution**: The `navigate` event is captured by a listener that calls `history.pushState(null, null, url)`. This updates the browser's address bar to the new URL without triggering a full page load.
-   **`popstate` Unification**: To ensure a single code path for handling route changes, the `navigate` event handler programmatically dispatches a `popstate` event immediately after calling `pushState`. This simulates a history navigation event, allowing a single listener to handle both user-initiated navigation and browser back/forward actions.
-   **Browser History Navigation**: When the user clicks the browser's back or forward buttons, a native `popstate` event is fired. This event is captured and re-dispatched through the central router's `EventTarget` to trigger the route update logic.

### 3. The `<view-route>` Custom Element

The `<view-route>` element is the cornerstone of the declarative routing system.

-   **Path-to-View Mapping**: Each `<view-route>` element is associated with a specific URL path via its `path` attribute. This attribute accepts a regular expression, enabling powerful pattern matching for dynamic route segments (e.g., `/details/(?<id>\\w+)`).
-   **Event-Driven Updates**: Each instance of `<view-route>` subscribes to the unified `popstate` event.
-   **Route Matching Logic**: Upon receiving a `popstate` event, the element executes its `update()` method. This method compares the `window.location.pathname` against the regex in its `path` attribute.
-   **Visibility Toggling**:
    -   If the current path matches the element's `path`, the element's `display` style is set to `contents`, making its child content visible without affecting the DOM layout. A `routechange` event is also dispatched to notify child components of the active route and pass along any matched route parameters.
    -   If the path does not match, its `display` is set to `none`, effectively hiding the view.
-   **Fallback Route**: A special `path="*"` attribute designates a `<view-route>` as the fallback (404) view. This route becomes active only if no other sibling `<view-route>` elements match the current path.

### 4. Handling 404 Errors on Deep Links (The GitHub Pages Workaround)

Static servers serve content based on file paths. A request to `/details` will fail because no file named `details` exists in the root directory. The following mechanism circumvents this limitation:

-   **`404.html` Interceptor**: GitHub Pages allows for a custom `404.html` file. When a request results in a 404 error, this file is served.
-   **Path Capture and Redirect**: A script within `404.html` captures the originally requested path from `window.location`. It then performs a client-side redirect to the root `index.html`, passing the captured path as a specially formatted query parameter (e.g., `/?/details`).
-   **Route Restoration**: On load, a script in `index.html` checks for the presence of this special query parameter. If found, it uses `history.replaceState()` to silently update the URL back to the intended deep-linked path (`/details`). This corrects the address bar without creating a new entry in the browser's history.
-   **Standard Routing Resumes**: Once the URL is restored, the standard routing logic proceeds, and the correct `<view-route>` is displayed.
