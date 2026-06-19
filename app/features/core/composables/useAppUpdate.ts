import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import type { GithubRelease } from '@/features/updater/types/updater.types';

const GITHUB_REPO = 'rrol2/ranzaKord';
const APK_ASSET_SUFFIX = '.apk';

function parseVersion(v: string): [number, number, number] {
  const [maj = 0, min = 0, pat = 0] = v.replace(/^v/, '').split('.').map(Number);
  return [maj, min, pat];
}

function isNewerVersion(latest: string, current: string): boolean {
  const [lMaj, lMin, lPat] = parseVersion(latest);
  const [cMaj, cMin, cPat] = parseVersion(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

export function useAppUpdate() {
  const store = useUpdaterStore();
  const { info, showModal } = storeToRefs(store);
  const config = useRuntimeConfig();
  const isTauri = import.meta.client && '__TAURI_INTERNALS__' in window;

  async function checkViaGithub() {
    try {
      const currentVersion = config.public.appVersion as string;
      const release = await $fetch<GithubRelease>(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
      );

      const latestVersion = release.tag_name.replace(/^v/, '');
      if (!isNewerVersion(latestVersion, currentVersion)) return;

      const isMandatory = release.body?.includes('[MANDATORY]') ?? false;
      const apkAsset = release.assets.find((a) => a.name.endsWith(APK_ASSET_SUFFIX));

      store.patch({
        available: true,
        version: latestVersion,
        body: release.body?.replace('[MANDATORY]', '').trim() ?? '',
        date: release.published_at,
        isMandatory,
        apkDownloadUrl: apkAsset?.browser_download_url ?? null
      });
      showModal.value = true;
    } catch {
      // silently ignore — no network or no releases yet
    }
  }

  async function checkForUpdates() {
    if (!isTauri || store.hasChecked) return;
    store.hasChecked = true;
    store.patch({ error: null });

    try {
      const update = await check();
      if (update) {
        const isMandatory = update.body?.includes('[MANDATORY]') ?? false;
        store.patch({
          available: true,
          version: update.version,
          body: update.body?.replace('[MANDATORY]', '').trim() ?? '',
          date: update.date,
          isMandatory,
          apkDownloadUrl: null
        });
        showModal.value = true;
      }
    } catch {
      await checkViaGithub();
    }
  }

  async function installUpdate() {
    if (!isTauri || !store.info.available || store.info.apkDownloadUrl) return;
    try {
      store.patch({ downloading: true, error: null });
      const update = await check();
      if (!update) return;

      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            store.patch({ total: event.data.contentLength ?? 0 });
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            store.patch({ progress: downloaded });
            break;
          case 'Finished':
            store.patch({ downloading: false });
            break;
        }
      });
      await relaunch();
    } catch (e) {
      store.patch({ error: String(e), downloading: false });
    }
  }

  onMounted(() => {
    checkForUpdates();
  });

  return {
    updateInfo: info,
    showUpdateModal: showModal,
    checkForUpdates,
    installUpdate,
    dismissUpdate: store.dismiss
  };
}
