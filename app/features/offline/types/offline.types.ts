export interface OfflineTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
  downloadedAt: string;
  sizeBytes: number;
}

export type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error';
