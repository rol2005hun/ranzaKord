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
  const pwaCookie = useCookie<boolean>('pwa_installed', {
    default: () => false,
    maxAge: 31536000,
    sameSite: 'lax'
  });

  function checkInstalled(): boolean {
    if (!import.meta.client) {
      return pwaCookie.value === true;
    }
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
    const installed = isStandalone || isIosStandalone || isAndroidApp;
    if (installed) {
      pwaCookie.value = true;
    }
    return installed;
  }

  function init(): void {
    if (!import.meta.client) return;
    const installed = checkInstalled();
    isInstalled.value = installed;
    if (installed) {
      pwaCookie.value = true;
    }

    if ('getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            isInstalled.value = true;
            pwaCookie.value = true;
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
              pwaCookie.value = true;
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
      pwaCookie.value = true;
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
      pwaCookie.value = true;
    }
    return choice.outcome;
  }

  if (import.meta.client) {
    init();
  } else {
    isInstalled.value = pwaCookie.value === true;
  }

  return {
    isInstallable: computed(() => !!deferredPrompt.value),
    isInstalled: computed(() => isInstalled.value),
    promptInstall
  };
}
