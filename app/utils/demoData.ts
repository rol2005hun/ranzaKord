import type { SearchResult } from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';

export const DEMO_TRACKS: SearchResult[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Demo Track 1 (NCS)',
    artist: 'NCS Release',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    durationSeconds: 212,
    type: 'song'
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Demo Track 2 (Ed Sheeran Perfect Cover)',
    artist: 'Cover',
    thumbnailUrl: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    durationSeconds: 260,
    type: 'song'
  },
  {
    id: 'PT2_F-1esPk',
    title: 'Alan Walker - Faded (NCS Release)',
    artist: 'Alan Walker',
    thumbnailUrl: 'https://i.ytimg.com/vi/PT2_F-1esPk/hqdefault.jpg',
    durationSeconds: 212,
    type: 'song'
  },
  {
    id: 'K4DyBUG242c',
    title: 'Cartoon - On & On (feat. Daniel Levi) [NCS Release]',
    artist: 'Cartoon',
    thumbnailUrl: 'https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg',
    durationSeconds: 207,
    type: 'song'
  },
  {
    id: 'bM7SZ5SBzyY',
    title: 'Alan Walker - Spectre [NCS Release]',
    artist: 'Alan Walker',
    thumbnailUrl: 'https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg',
    durationSeconds: 226,
    type: 'song'
  }
];

export function getDemoTrackDetail(videoId: string): Track | null {
  const result = DEMO_TRACKS.find((t) => t.id === videoId);
  if (!result) return null;
  return {
    videoId: result.id,
    title: result.title,
    artist: result.artist,
    artists: [{ name: result.artist }],
    thumbnailUrl: result.thumbnailUrl,
    durationSeconds: result.durationSeconds || 0
  };
}
