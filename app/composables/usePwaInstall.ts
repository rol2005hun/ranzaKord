interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isInstalled = ref(false);
const isListenerAttached = ref(false);

export function usePwaInstall() {
  function checkInstalled(): boolean {
    if (!import.meta.client) return false;
    const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
    const isStandalone =
      hasMatchMedia &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches);
    const isIosStandalone =
      typeof navigator !== 'undefined' &&
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isAndroidApp =
      typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
    return isStandalone || isIosStandalone || isAndroidApp;
  }

  function init(): void {
    if (!import.meta.client) return;
    isInstalled.value = checkInstalled();

    if ('getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            isInstalled.value = true;
          }
        })
        .catch(() => {});
    }

    if (isListenerAttached.value) return;
    isListenerAttached.value = true;

    const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
    if (hasMatchMedia) {
      const displayModes = [
        '(display-mode: standalone)',
        '(display-mode: window-controls-overlay)',
        '(display-mode: minimal-ui)'
      ];
      displayModes.forEach((query) => {
        try {
          const mql = window.matchMedia(query);
          mql.addEventListener?.('change', (e) => {
            if (e.matches) {
              isInstalled.value = true;
            }
          });
        } catch {
          void 0;
        }
      });
    }

    const globalWindow = window as unknown as { __deferredPrompt?: BeforeInstallPromptEvent };
    if (globalWindow.__deferredPrompt) {
      deferredPrompt.value = globalWindow.__deferredPrompt;
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
      globalWindow.__deferredPrompt = e as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true;
      deferredPrompt.value = null;
      globalWindow.__deferredPrompt = undefined;
    });
  }

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
    if (!deferredPrompt.value) {
      return 'unsupported';
    }
    const promptEvent = deferredPrompt.value;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredPrompt.value = null;
    if (choice.outcome === 'accepted') {
      isInstalled.value = true;
    }
    return choice.outcome;
  }

  if (import.meta.client) {
    init();
  }

  return {
    isInstallable: computed(() => !!deferredPrompt.value),
    isInstalled: computed(() => isInstalled.value),
    promptInstall
  };
}
