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
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandalone || isIosStandalone;
  }

  function init(): void {
    if (!import.meta.client || isListenerAttached.value) return;
    isListenerAttached.value = true;
    isInstalled.value = checkInstalled();

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
    });

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true;
      deferredPrompt.value = null;
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
