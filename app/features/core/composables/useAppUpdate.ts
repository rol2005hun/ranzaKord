import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import type { GithubRelease } from '@/features/updater/types/updater.types';

const GITHUB_REPO = 'rol2005hun/ranzaKord';
const APK_ASSET_SUFFIX = '.apk';

function parseVersion(v: string) {
  const [main = '', pre] = v.replace(/^v/, '').split('-');
  const [maj = 0, min = 0, pat = 0] = main.split('.').map(Number);
  return { maj, min, pat, pre };
}

function isNewerVersion(latest: string, current: string): boolean {
  if (latest === current) return false;
  const l = parseVersion(latest);
  const c = parseVersion(current);

  if (l.maj !== c.maj) return l.maj > c.maj;
  if (l.min !== c.min) return l.min > c.min;
  if (l.pat !== c.pat) return l.pat > c.pat;

  // Stable is greater than prerelease
  if (l.pre && !c.pre) return false;
  if (!l.pre && c.pre) return true;

  // Both are prerelease
  if (l.pre && c.pre) return l.pre > c.pre;

  return false;
}

export function useAppUpdate() {
  const store = useUpdaterStore();
  const { info, showModal } = storeToRefs(store);
  const config = useRuntimeConfig();
  const isTauri = import.meta.client && '__TAURI_INTERNALS__' in window;

  async function checkViaGithub() {
    try {
      const currentVersion = config.public.appVersion as string;
      const releases = await $fetch<GithubRelease[]>(
        `https://api.github.com/repos/${GITHUB_REPO}/releases`
      );
      if (!releases || releases.length === 0) return;

      const release = releases[0];
      if (!release) return;
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
