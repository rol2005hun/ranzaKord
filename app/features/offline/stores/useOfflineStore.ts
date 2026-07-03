import { saveTrack, getTrackBlob, getAllMetas, deleteTrack } from '../composables/useOfflineDb';
import type { OfflineTrack, DownloadStatus } from '../types/offline.types';
import type { Track } from '@/features/player/types/player.types';

export const useOfflineStore = defineStore('offline', () => {
  const downloadedTracks = ref<OfflineTrack[]>([]);
  const downloadedIds = ref<Set<string>>(new Set());
  const downloadStatuses = ref<Record<string, DownloadStatus>>({});
  const downloadProgress = ref<Record<string, number>>({});
  const objectUrlCache = new Map<string, string>();

  const totalSizeBytes = computed(() =>
    downloadedTracks.value.reduce((acc, t) => acc + t.sizeBytes, 0)
  );

  async function init(): Promise<void> {
    if (!import.meta.client) return;
    try {
      const metas = await getAllMetas();
      downloadedTracks.value = metas;
      downloadedIds.value = new Set(metas.map((m) => m.videoId));
    } catch (e) {
      console.warn('Failed to initialize offline store:', e);
    }
  }

  function isTrackDownloaded(videoId: string): boolean {
    return downloadedIds.value.has(videoId);
  }

  function getStatus(videoId: string): DownloadStatus {
    return downloadStatuses.value[videoId] ?? 'idle';
  }

  function getProgress(videoId: string): number {
    return downloadProgress.value[videoId] ?? 0;
  }

  async function getObjectUrl(videoId: string): Promise<string | undefined> {
    if (objectUrlCache.has(videoId)) return objectUrlCache.get(videoId);
    try {
      const blob = await getTrackBlob(videoId);
      if (!blob) return undefined;
      const url = URL.createObjectURL(blob);
      objectUrlCache.set(videoId, url);
      return url;
    } catch (e) {
      console.warn('Failed to get track blob:', e);
      return undefined;
    }
  }

  async function downloadTrack(track: Track): Promise<void> {
    if (downloadStatuses.value[track.videoId] === 'downloading') return;

    downloadStatuses.value[track.videoId] = 'downloading';
    downloadProgress.value[track.videoId] = 0;

    try {
      const config = useRuntimeConfig();
      const isTauriProd = import.meta.client && '__TAURI_INTERNALS__' in window && !import.meta.dev;
      const baseUrl = isTauriProd ? config.public.baseUrl : '';
      const streamUrl = `${baseUrl}/api/stream?v=${track.videoId}`;

      const response = await fetch(streamUrl);
      if (!response.ok) throw new Error('Stream fetch failed');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            downloadProgress.value[track.videoId] = Math.round((received / total) * 100);
          }
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'audio/webm' });

      const meta: OfflineTrack = {
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        durationSeconds: track.durationSeconds,
        downloadedAt: new Date().toISOString(),
        sizeBytes: blob.size
      };

      try {
        await saveTrack(meta, blob);
        downloadedTracks.value = [
          ...downloadedTracks.value.filter((t) => t.videoId !== track.videoId),
          meta
        ];
        downloadedIds.value.add(track.videoId);
        downloadStatuses.value[track.videoId] = 'done';
      } catch (e) {
        console.warn('Failed to save track:', e);
        downloadStatuses.value[track.videoId] = 'error';
      }

      if (objectUrlCache.has(track.videoId)) {
        URL.revokeObjectURL(objectUrlCache.get(track.videoId) ?? '');
        objectUrlCache.delete(track.videoId);
      }

      downloadProgress.value[track.videoId] = 100;
    } catch {
      downloadStatuses.value[track.videoId] = 'error';
    }
  }

  async function removeTrack(videoId: string): Promise<void> {
    try {
      await deleteTrack(videoId);
    } catch (e) {
      console.warn('Failed to delete track from DB:', e);
    }
    downloadedTracks.value = downloadedTracks.value.filter((t) => t.videoId !== videoId);
    downloadedIds.value.delete(videoId);
    downloadStatuses.value = Object.fromEntries(
      Object.entries(downloadStatuses.value).filter(([k]) => k !== videoId)
    ) as Record<string, DownloadStatus>;
    downloadProgress.value = Object.fromEntries(
      Object.entries(downloadProgress.value).filter(([k]) => k !== videoId)
    ) as Record<string, number>;
    if (objectUrlCache.has(videoId)) {
      URL.revokeObjectURL(objectUrlCache.get(videoId) ?? '');
      objectUrlCache.delete(videoId);
    }
  }

  async function removeAll(): Promise<void> {
    const ids = Array.from(downloadedIds.value);
    for (const id of ids) {
      try {
        await deleteTrack(id);
      } catch (e) {
        console.warn('Failed to delete track during clearAll:', e);
      }
    }
    downloadedTracks.value = [];
    downloadedIds.value.clear();
    downloadStatuses.value = {};
    downloadProgress.value = {};
    objectUrlCache.clear();
  }

  return {
    downloadedTracks,
    downloadedIds,
    downloadStatuses,
    downloadProgress,
    totalSizeBytes,
    init,
    isTrackDownloaded,
    getStatus,
    getProgress,
    getObjectUrl,
    downloadTrack,
    removeTrack,
    removeAll
  };
});
