import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import type { GithubRelease, GithubReleaseAsset } from '@/features/updater/types/updater.types';

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
  if (l.pre && c.pre) {
    const lParts = l.pre.split('.');
    const cParts = c.pre.split('.');
    for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
      const lp = lParts[i];
      const cp = cParts[i];
      if (lp === cp) continue;
      if (lp === undefined) return false;
      if (cp === undefined) return true;
      const ln = parseInt(lp, 10);
      const cn = parseInt(cp, 10);
      if (!isNaN(ln) && !isNaN(cn)) {
        if (ln !== cn) return ln > cn;
      } else {
        if (lp !== cp) return lp > cp;
      }
    }
    return false;
  }

  return false;
}

function isMajorOrMinorBump(latest: string, current: string): boolean {
  if (latest === current) return false;
  const l = parseVersion(latest);
  const c = parseVersion(current);

  if (l.maj !== c.maj) return l.maj > c.maj;
  if (l.min !== c.min) return l.min > c.min;

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

      const isAndroid = import.meta.client && /android/i.test(navigator.userAgent);
      const IGNORED_SUFFIXES = ['.json', '.sig'];

      const readyRelease = releases.find((release) => {
        const latestVersion = release.tag_name.replace(/^v/, '');
        if (!isNewerVersion(latestVersion, currentVersion)) return false;

        if (isAndroid) {
          return release.assets.some((a) => a.name.endsWith(APK_ASSET_SUFFIX));
        } else {
          return release.assets.some(
            (a) =>
              a.name.endsWith('.exe') ||
              a.name.endsWith('.msi') ||
              a.name.endsWith('.dmg') ||
              a.name.endsWith('app.tar.gz') ||
              a.name.endsWith('.AppImage') ||
              a.name.endsWith('.deb')
          );
        }
      });

      if (!readyRelease) return;

      const latestVersion = readyRelease.tag_name.replace(/^v/, '');
      const isMandatory = isMajorOrMinorBump(latestVersion, currentVersion);
      const relevantAssets = readyRelease.assets.filter(
        (a) => !IGNORED_SUFFIXES.some((s) => a.name.endsWith(s))
      );
      const totalSize = relevantAssets.reduce((sum, a) => sum + a.size, 0);

      let downloadUrl: string;
      let displaySize: number;
      let displayCount: number;

      if (isAndroid) {
        const apkAsset = relevantAssets.find((a) => a.name.endsWith(APK_ASSET_SUFFIX));
        if (!apkAsset) return;
        downloadUrl = apkAsset.browser_download_url;
        displaySize = apkAsset.size;
        displayCount = 1;
      } else {
        const ua = import.meta.client ? navigator.userAgent.toLowerCase() : '';
        const isWin = ua.includes('win');
        const isMac = ua.includes('mac');
        const isLinux = ua.includes('linux');

        let targetAsset: GithubReleaseAsset | undefined;
        if (isWin) {
          targetAsset = relevantAssets.find(
            (a) => a.name.endsWith('.exe') || a.name.endsWith('.msi')
          );
        } else if (isMac) {
          targetAsset = relevantAssets.find(
            (a) => a.name.endsWith('.dmg') || a.name.endsWith('app.tar.gz')
          );
        } else if (isLinux) {
          targetAsset = relevantAssets.find(
            (a) => a.name.endsWith('.AppImage') || a.name.endsWith('.deb')
          );
        }

        if (targetAsset) {
          downloadUrl = targetAsset.browser_download_url;
          displaySize = targetAsset.size;
          displayCount = 1;
        } else {
          downloadUrl = readyRelease.html_url;
          displaySize = totalSize;
          displayCount = relevantAssets.length;
        }
      }

      store.patch({
        available: true,
        version: latestVersion,
        name: readyRelease.name ?? readyRelease.tag_name,
        body: readyRelease.body?.replace('[MANDATORY]', '').trim() ?? '',
        date: readyRelease.published_at,
        isMandatory,
        externalDownloadUrl: downloadUrl,
        downloadSize: displaySize > 0 ? displaySize : null,
        assetCount: displayCount > 0 ? displayCount : null
      });
      showModal.value = true;
    } catch (e) {
      console.error('checkViaGithub error:', e);
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
        const currentVersion = config.public.appVersion as string;
        const isMandatory = isMajorOrMinorBump(update.version, currentVersion);
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
