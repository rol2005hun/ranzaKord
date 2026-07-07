import type { Track } from '@/features/player/types/player.types';
import type { Playlist } from '@/features/playlists/types/playlists.types';

// Legal, royalty-free NoCopyrightSounds (NCS) tracks that are safe to stream
export const DEMO_TRACKS: Track[] = [
  {
    videoId: 'bM7SZ5SBzyY',
    title: 'Alan Walker - Fade [NCS Release]',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg',
    durationSeconds: 260
  },
  {
    videoId: 'K4DyBUG242c',
    title: 'Cartoon - On & On (feat. Daniel Levi) [NCS Release]',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg',
    durationSeconds: 208
  },
  {
    videoId: 'q1ULJ92aldE',
    title: 'Syn Cole - Feel Good [NCS Release]',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/q1ULJ92aldE/hqdefault.jpg',
    durationSeconds: 182
  },
  {
    videoId: '3nQNiWdeH2Q',
    title: 'Janji - Heroes Tonight (feat. Johnning) [NCS Release]',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/3nQNiWdeH2Q/hqdefault.jpg',
    durationSeconds: 208
  },
  {
    videoId: 'TW9d8vYrVFQ',
    title: 'Elektronomia - Sky High [NCS Release]',
    artists: [{ id: 'UC_aEa8K-EOJ3D6gOs7HcyNg', name: 'NoCopyrightSounds' }],
    thumbnailUrl: 'https://i.ytimg.com/vi/TW9d8vYrVFQ/hqdefault.jpg',
    durationSeconds: 238
  }
];

export const DEMO_PLAYLIST: Playlist = {
  id: 'demo-playlist-1',
  userId: 'demo-user-id',
  title: 'NCS Favorites (Demo)',
  description: 'A collection of royalty-free NoCopyrightSounds tracks for demonstration purposes.',
  visibility: 'private',
  color: '#00e5ff',
  tracks: DEMO_TRACKS.map((track) => track.videoId),
  trackDetails: DEMO_TRACKS,
  totalDuration: DEMO_TRACKS.reduce((acc, curr) => acc + curr.durationSeconds, 0),
  isPinned: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEMO_ALLOWED_VIDEO_IDS = DEMO_TRACKS.map((t) => t.videoId);
