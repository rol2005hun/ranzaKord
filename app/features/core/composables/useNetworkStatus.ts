const isOnline = ref(true);
const isServerReachable = ref(true);
const isChecking = ref(false);
let initialized = false;
let checkInterval: ReturnType<typeof setInterval> | null = null;

async function pingServer(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  if (!navigator.onLine) {
    isServerReachable.value = false;
    return false;
  }
  isChecking.value = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(useApiUrl('/api/up'), {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    const reachable = res.ok;
    isServerReachable.value = reachable;
    return reachable;
  } catch {
    isServerReachable.value = false;
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

    isOnline.value = navigator.onLine;

    window.addEventListener('online', () => {
      isOnline.value = true;
      pingServer();
    });

    window.addEventListener('offline', () => {
      isOnline.value = false;
      isServerReachable.value = false;
    });

    pingServer();

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
