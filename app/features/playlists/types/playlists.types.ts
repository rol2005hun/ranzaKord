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

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnailUrl?: string | null;
  durationSeconds: number;
  isPlaying?: boolean;
}

export interface PlaylistTrackArtist {
  name: string;
  channelId?: string;
}

export interface PlaylistTrack {
  videoId: string;
  title: string;
  artist: string;
  artistId?: string;
  artists?: PlaylistTrackArtist[];
  thumbnailUrl: string;
  durationMs: number;
  addedAt: string;
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: PlaylistTrack[];
}

export interface PlaylistDetailQuery {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}

export interface CreatePlaylistPayload {
  name: string;
  description: string;
  imageUrl: string;
}
