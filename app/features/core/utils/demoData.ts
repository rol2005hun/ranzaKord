import type { Track } from '@/features/player/types/player.types';
import type { PlaylistDetail } from '@/features/playlists/types/playlists.types';

// Legal, royalty-free NoCopyrightSounds (NCS) tracks that are safe to stream
export const DEMO_TRACKS: Track[] = [
  {
    videoId: 'bM7SZ5SBzyY',
    title: 'Alan Walker - Fade [NCS Release]',
    artist: 'NoCopyrightSounds',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg',
    durationSeconds: 260
  },
  {
    videoId: 'K4DyBUG242c',
    title: 'Cartoon - On & On (feat. Daniel Levi) [NCS Release]',
    artist: 'NoCopyrightSounds',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg',
    durationSeconds: 208
  },
  {
    videoId: 'q1ULJ92aldE',
    title: 'Syn Cole - Feel Good [NCS Release]',
    artist: 'NoCopyrightSounds',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/q1ULJ92aldE/hqdefault.jpg',
    durationSeconds: 182
  },
  {
    videoId: '3nQNiWdeH2Q',
    title: 'Janji - Heroes Tonight (feat. Johnning) [NCS Release]',
    artist: 'NoCopyrightSounds',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/3nQNiWdeH2Q/hqdefault.jpg',
    durationSeconds: 208
  },
  {
    videoId: 'TW9d8vYrVFQ',
    title: 'Elektronomia - Sky High [NCS Release]',
    artist: 'NoCopyrightSounds',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/TW9d8vYrVFQ/hqdefault.jpg',
    durationSeconds: 238
  }
];

export const DEMO_PLAYLIST: PlaylistDetail = {
  id: 'demo-playlist-1',
  name: 'NCS Favorites (Demo)',
  description: 'A collection of royalty-free NoCopyrightSounds tracks for demonstration purposes.',
  imageUrl: 'https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg',
  trackCount: DEMO_TRACKS.length,
  trackIds: DEMO_TRACKS.map((track) => track.videoId),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tracks: DEMO_TRACKS.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl,
    durationMs: t.durationSeconds * 1000,
    addedAt: new Date().toISOString()
  }))
};

export const DEMO_ALLOWED_VIDEO_IDS = DEMO_TRACKS.map((t) => t.videoId);
