let pendingRequestCount = 0;
const listeners = new Set();

const notifyListeners = () => {
  const state = {
    isLoading: pendingRequestCount > 0,
    pendingRequestCount
  };

  listeners.forEach((listener) => listener(state));
};

export const startGlobalLoading = (enabled = true) => {
  if (!enabled) {
    return false;
  }

  pendingRequestCount += 1;
  notifyListeners();
  return true;
};

export const stopGlobalLoading = (tracked) => {
  if (!tracked) {
    return;
  }

  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  notifyListeners();
};

export const subscribeToGlobalLoading = (listener) => {
  listeners.add(listener);
  listener({
    isLoading: pendingRequestCount > 0,
    pendingRequestCount
  });

  return () => {
    listeners.delete(listener);
  };
};

export const trackedFetch = (input, init, options = {}) => {
  const tracked = startGlobalLoading(options.enabled !== false);

  return fetch(input, init).finally(() => {
    stopGlobalLoading(tracked);
  });
};