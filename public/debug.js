const DEBUG_PARAM = 'routing_debug';
let isDebugMode = false;

function initializeDebugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    isDebugMode = urlParams.has(DEBUG_PARAM);
    if (isDebugMode) {
        console.log('%cRouting Debug Mode Enabled', 'color: #007bff; font-weight: bold;');
    }
}

export function log(...args) {
    if (isDebugMode) {
        console.log('%c[Routing]', 'color: #007bff;', ...args);
    }
}

initializeDebugMode();
