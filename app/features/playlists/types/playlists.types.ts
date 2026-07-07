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
  addedBy?: string;
}

export interface PlaylistDetail extends PlaylistSummary {
  description: string;
  tracks: PlaylistTrack[];
  isPublic?: boolean;
  ownerId?: string;
  collaborators?: string[];
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

export interface FailedTrack {
  title: string;
  artist: string;
}

export interface SkippedTrackEntry {
  incoming: { title: string; artist: string; thumbnailUrl?: string; videoId?: string };
  existing: { title: string; artist: string; thumbnailUrl?: string; videoId?: string };
}

export interface SuccessTrack {
  title: string;
  artist: string;
  thumbnailUrl?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  alreadyExists: number;
  successTracks: SuccessTrack[];
  failedTracks: FailedTrack[];
  skippedTracks: SkippedTrackEntry[];
  alreadyExistsTracks: SkippedTrackEntry[];
}
