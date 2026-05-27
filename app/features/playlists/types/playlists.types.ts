export interface PlaylistSummary {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationMs: number;
  addedAt: string;
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: PlaylistTrack[];
}

export interface CreatePlaylistPayload {
  name: string;
  description: string;
  imageUrl: string;
}
