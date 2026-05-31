import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface AppUpdateInfo {
  available: boolean;
  version: string;
  body: string;
  date?: string;
  isMandatory: boolean;
  downloading: boolean;
  progress: number;
  total: number;
  error: string | null;
}

export function useAppUpdate() {
  const isTauri = import.meta.client && '__TAURI_INTERNALS__' in window;

  const updateInfo = ref<AppUpdateInfo>({
    available: false,
    version: '',
    body: '',
    date: '',
    isMandatory: false,
    downloading: false,
    progress: 0,
    total: 0,
    error: null
  });

  const showUpdateModal = ref(false);

  async function checkForUpdates(manual = false) {
    if (!isTauri) return;

    try {
      updateInfo.value.error = null;
      const update = await check();

      if (update) {
        const isMandatory = update.body?.includes('[MANDATORY]') || false;

        updateInfo.value = {
          available: true,
          version: update.version,
          body: update.body?.replace('[MANDATORY]', '').trim() || '',
          date: update.date,
          isMandatory,
          downloading: false,
          progress: 0,
          total: 0,
          error: null
        };
      } else if (manual) {
        // You could hook up a toast here to say "You're up to date!"
      }
    } catch (e) {
      console.error('Failed to check for updates', e);
      updateInfo.value.error = String(e);
    }
  }

  async function installUpdate() {
    if (!isTauri || !updateInfo.value.available) return;

    try {
      updateInfo.value.downloading = true;
      updateInfo.value.error = null;

      const update = await check();
      if (!update) return;

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            updateInfo.value.total = contentLength;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            updateInfo.value.progress = downloaded;
            break;
          case 'Finished':
            updateInfo.value.downloading = false;
            break;
        }
      });

      await relaunch();
    } catch (e) {
      console.error('Failed to install update', e);
      updateInfo.value.error = String(e);
      updateInfo.value.downloading = false;
    }
  }

  function dismissUpdate() {
    if (!updateInfo.value.isMandatory) {
      updateInfo.value.available = false;
    }
  }

  // Automatically check on mount
  onMounted(() => {
    checkForUpdates();
  });

  return {
    updateInfo,
    showUpdateModal,
    checkForUpdates,
    installUpdate,
    dismissUpdate
  };
}
