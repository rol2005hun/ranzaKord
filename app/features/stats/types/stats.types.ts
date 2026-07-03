export interface TopTrackAggregated {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  playCount: number;
  totalDurationSeconds: number;
}

export interface TopArtistAggregated {
  name: string;
  playCount: number;
  totalDurationSeconds: number;
}
