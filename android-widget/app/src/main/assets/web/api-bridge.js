// Substitui o preload.js do Electron: liga window.api (usado pelo renderer.js,
// sem alterações) à interface @JavascriptInterface exposta pelo WebView Android.
(function () {
  const pending = {};
  let nextId = 1;

  window.__apiResolve = function (id, resultJson) {
    const entry = pending[id];
    if (!entry) return;
    delete pending[id];
    entry.resolve(resultJson == null ? undefined : JSON.parse(resultJson));
  };

  function call(method, arg) {
    return new Promise((resolve) => {
      const id = nextId++;
      pending[id] = { resolve };
      AndroidBridge.call(method, arg === undefined ? null : JSON.stringify(arg), id);
    });
  }

  window.api = {
    loadTasks: () => call('loadTasks'),
    saveTasks: (tasks) => call('saveTasks', tasks),
    quit: () => call('quit'),
    getPosition: () => call('getPosition'),
    setPosition: (position) => call('setPosition', position),
    getCompact: () => call('getCompact'),
    setCompact: (compact) => call('setCompact', compact),
    getGoogleStatus: () => call('getGoogleStatus'),
    connectGoogle: () => call('connectGoogle'),
    disconnectGoogle: () => call('disconnectGoogle'),
    onTasksExternalChange: (callback) => {
      window.__onTasksExternalChange = callback;
    }
  };
})();
