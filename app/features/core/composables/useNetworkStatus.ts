const isOnline = ref(true);
const isServerReachable = ref(true);
const isChecking = ref(false);
let initialized = false;
let checkInterval: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;

async function pingServer(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  isChecking.value = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(useApiUrl('/api/up'), {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    const reachable = res.ok || (res.status >= 200 && res.status < 500);
    if (reachable) {
      consecutiveFailures = 0;
      isServerReachable.value = true;
      isOnline.value = true;
      return true;
    }
    consecutiveFailures++;
    if (consecutiveFailures >= 2) {
      isServerReachable.value = false;
    }
    return false;
  } catch {
    consecutiveFailures++;
    if (consecutiveFailures >= 2) {
      isServerReachable.value = false;
    }
    return false;
  } finally {
    isChecking.value = false;
  }
}

export function useNetworkStatus() {
  const isOffline = computed(() => !isOnline.value || !isServerReachable.value);

  function initNetworkListener(): void {
    if (typeof window === 'undefined' || initialized) return;
    initialized = true;

    if (!navigator.onLine) {
      pingServer().then((reachable) => {
        if (!reachable) {
          isOnline.value = false;
        }
      });
    } else {
      isOnline.value = true;
      pingServer();
    }

    window.addEventListener('online', () => {
      isOnline.value = true;
      consecutiveFailures = 0;
      pingServer();
    });

    window.addEventListener('offline', () => {
      isOnline.value = false;
      isServerReachable.value = false;
      consecutiveFailures = 2;
    });

    if (checkInterval) {
      clearInterval(checkInterval);
    }
    checkInterval = setInterval(() => {
      pingServer();
    }, 15000);
  }

  function stopNetworkListener(): void {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    initialized = false;
    consecutiveFailures = 0;
  }

  return {
    isOnline,
    isServerReachable,
    isOffline,
    isChecking,
    pingServer,
    initNetworkListener,
    stopNetworkListener
  };
}
