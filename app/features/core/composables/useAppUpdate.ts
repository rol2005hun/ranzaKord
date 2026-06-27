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

  if (l.pre && !c.pre) return false;
  if (!l.pre && c.pre) return true;
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
      const isAndroid = import.meta.client && /android/i.test(navigator.userAgent);
      let downloadUrl: string | null = null;

      if (isAndroid) {
        const apkAsset = release.assets.find((a) => a.name.endsWith(APK_ASSET_SUFFIX));
        downloadUrl = apkAsset?.browser_download_url ?? null;
      } else {
        downloadUrl = release.html_url;
      }

      const IGNORED_SUFFIXES = ['.json', '.sig'];
      const relevantAssets = release.assets.filter(
        (a) => !IGNORED_SUFFIXES.some((s) => a.name.endsWith(s))
      );
      const totalSize = relevantAssets.reduce((sum, a) => sum + a.size, 0);

      store.patch({
        available: true,
        version: latestVersion,
        name: release.name ?? release.tag_name,
        body: release.body?.replace('[MANDATORY]', '').trim() ?? '',
        date: release.published_at,
        isMandatory,
        externalDownloadUrl: downloadUrl,
        downloadSize: totalSize > 0 ? totalSize : null,
        assetCount: relevantAssets.length > 0 ? relevantAssets.length : null
      });
      showModal.value = true;
    } catch {
      // silently ignore — no network or no releases yet
    }
  }

  async function downloadInBackground(update: Awaited<ReturnType<typeof check>>) {
    if (!update) return;
    try {
      store.patch({ downloading: true, error: null, readyToInstall: false });
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
            store.patch({ downloading: false, readyToInstall: true });
            break;
        }
      });
    } catch (e) {
      store.patch({ error: String(e), downloading: false, readyToInstall: false });
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
          name: update.version,
          body: update.body?.replace('[MANDATORY]', '').trim() ?? '',
          date: update.date,
          isMandatory,
          externalDownloadUrl: null
        });
        showModal.value = true;
      }
    } catch {
      await checkViaGithub();
    }
  }

  async function applyUpdate() {
    if (!isTauri || !store.info.readyToInstall) return;
    try {
      await relaunch();
    } catch (e) {
      store.patch({ error: String(e) });
    }
  }

  async function installUpdate() {
    if (!isTauri || !store.info.available || store.info.externalDownloadUrl) return;
    if (store.info.readyToInstall) {
      await applyUpdate();
      return;
    }
    if (!store.info.downloading) {
      try {
        const update = await check();
        downloadInBackground(update);
      } catch (e) {
        store.patch({ error: String(e) });
      }
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
    applyUpdate,
    dismissUpdate: store.dismiss
  };
}
