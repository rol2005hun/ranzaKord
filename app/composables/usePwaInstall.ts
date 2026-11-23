import { isPwaApp } from '@/utils/pwa';

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
const isStandalone = ref(false);
const isListenerAttached = ref(false);

export function usePwaInstall() {
  function checkStandalone(): boolean {
    if (!import.meta.client) return false;
    return isPwaApp();
  }

  function init(): void {
    if (!import.meta.client) return;

    const legacyCookie = useCookie('pwa_installed');
    if (legacyCookie.value) {
      legacyCookie.value = null;
    }

    const standalone = checkStandalone();
    isStandalone.value = standalone;
    if (standalone) {
      isInstalled.value = true;
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
              isStandalone.value = true;
              isInstalled.value = true;
              document.documentElement.classList.add('is-pwa');
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
    isInstallable: computed(
      () => !isStandalone.value && !isInstalled.value && Boolean(deferredPrompt.value)
    ),
    isInstalled: computed(() => isInstalled.value),
    isStandalone: computed(() => isStandalone.value),
    promptInstall
  };
}
