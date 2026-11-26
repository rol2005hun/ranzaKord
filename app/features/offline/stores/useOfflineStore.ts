import {
  saveTrack,
  getTrackBlob,
  getAllMetas,
  deleteTrack,
  clearAllTracks
} from '../composables/useOfflineDb';
import type { OfflineTrack, DownloadStatus } from '../types/offline.types';
import type { Track } from '@/features/player/types/player.types';

const DOWNLOAD_CHUNK_SIZE = 2 * 1024 * 1024;

function parseContentRangeTotal(header: string | null): number {
  if (!header) return 0;
  const match = /\/(\d+)$/.exec(header.trim());
  if (!match?.[1]) return 0;
  const total = Number.parseInt(match[1], 10);
  return Number.isNaN(total) ? 0 : total;
}

export const useOfflineStore = defineStore('offline', () => {
  const downloadedTracks = ref<OfflineTrack[]>([]);
  const downloadedIds = ref<Set<string>>(new Set());
  const downloadStatuses = ref<Record<string, DownloadStatus>>({});
  const downloadProgress = ref<Record<string, number>>({});
  const objectUrlCache = new Map<string, string>();
  const storageQuotaBytes = ref(0);

  const totalSizeBytes = computed(() =>
    downloadedTracks.value.reduce((acc, t) => acc + t.sizeBytes, 0)
  );

  async function init(): Promise<void> {
    if (!import.meta.client) return;
    try {
      const metas = await getAllMetas();
      downloadedTracks.value = metas;
      downloadedIds.value = new Set(metas.map((m) => m.videoId));

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) {
          storageQuotaBytes.value = estimate.quota;
        }
      }
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
      const streamUrl = useApiUrl(`/api/stream?v=${track.videoId}`);
      const chunks: Uint8Array[] = [];
      let received = 0;
      let offset = 0;
      let totalBytes = 0;
      let mimeType = 'audio/webm';
      const estimatedTotal =
        track.durationSeconds > 0 ? Math.round(track.durationSeconds * 16_000) : 0;

      while (true) {
        const rangeEnd = offset + DOWNLOAD_CHUNK_SIZE - 1;
        const response = await fetch(streamUrl, {
          headers: {
            Range: `bytes=${offset}-${rangeEnd}`
          }
        });

        if (response.status === 416 && offset > 0) {
          break;
        }
        if (!response.ok) throw new Error('Stream fetch failed');

        if (offset === 0) {
          const responseType = response.headers.get('content-type');
          if (responseType) {
            mimeType = responseType.split(';')[0]?.trim() || 'audio/webm';
          }
        }

        const contentRange = response.headers.get('content-range');
        const parsedTotal = parseContentRangeTotal(contentRange);
        if (parsedTotal > 0) {
          totalBytes = parsedTotal;
        } else if (totalBytes <= 0 && response.status !== 206) {
          const contentLength = response.headers.get('content-length');
          const parsedLength = contentLength ? Number.parseInt(contentLength, 10) : 0;
          if (!Number.isNaN(parsedLength) && parsedLength > 0) {
            totalBytes = parsedLength;
          }
        }

        const progressTotal = totalBytes > 0 ? totalBytes : estimatedTotal;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream');

        let chunkReceived = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            chunkReceived += value.length;
            if (progressTotal > 0) {
              downloadProgress.value[track.videoId] = Math.min(
                95,
                Math.round((received / progressTotal) * 100)
              );
            }
          }
        }

        if (chunkReceived === 0) {
          break;
        }

        offset += chunkReceived;

        if (response.status !== 206 && !contentRange) {
          break;
        }

        if (totalBytes > 0 && offset >= totalBytes) {
          break;
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: mimeType });

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
    try {
      await clearAllTracks();
    } catch (e) {
      console.warn('Failed to clear all tracks from DB:', e);
    }
    for (const url of objectUrlCache.values()) {
      URL.revokeObjectURL(url);
    }
    objectUrlCache.clear();
    downloadedTracks.value = [];
    downloadedIds.value.clear();
    downloadStatuses.value = {};
    downloadProgress.value = {};
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
    removeAll,
    storageQuotaBytes
  };
});
