export interface TrackArtist {
  name: string;
  id?: string;
}

export interface Track {
  videoId: string;
  queueId?: string;
  title: string;
  artist: string;
  artists?: TrackArtist[];
  artistId?: string;
  thumbnailUrl: string;
  durationSeconds: number;
  isRadio?: boolean;
  isSong?: boolean;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTimeSeconds: number;
  durationSeconds: number;
  isLoading: boolean;
  error: string | null;
}

export interface StreamResponse {
  url: string;
  mimeType: string;
  durationMs: number;
}

export interface TrackStatPayload {
  trackId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
  listeningSeconds: number;
  skipped: boolean;
}

export type CrossfadeType = 'linear' | 'dj';

export type SleepTimerMode = 'off' | 'timer' | 'end-of-track';

export interface PlaybackContext {
  type: 'playlist' | 'album' | 'artist' | 'radio' | 'none';
  sourceId?: string;
  currentOffset: number;
  totalItems?: number;
}

export interface MusicVideoQueryResult {
  videoId: string;
}

export interface MusicVideoSearchResponse {
  results: MusicVideoQueryResult[];
}

export interface MusicVideoTrackInput {
  title: string;
  artist?: string;
  artists?: TrackArtist[] | null;
}

export type SkipSegment = [number, number];

export interface SponsorBlockApiResponse {
  segments: SkipSegment[];
}
