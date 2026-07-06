export interface TopTrackAggregated {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  playCount: number;
  durationSeconds: number;
}

export interface TopArtistAggregated {
  name: string;
  playCount: number;
  totalDurationSeconds: number;
}

export type WrappedSlideId =
  'intro' | 'total-time' | 'top-artist' | 'top-artists' | 'top-track' | 'top-tracks' | 'outro';
