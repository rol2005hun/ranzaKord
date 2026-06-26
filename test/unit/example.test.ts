import { describe, it, expect } from 'vitest';
import { getTrackArtists } from '../../app/utils/artist';

describe('getTrackArtists', () => {
  it('returns empty array when track is undefined', () => {
    expect(getTrackArtists(undefined)).toEqual([]);
  });

  it('returns empty array when track has no artist info', () => {
    expect(getTrackArtists({})).toEqual([]);
  });

  it('prefers artists array over artist string', () => {
    const result = getTrackArtists({
      artist: 'Fallback',
      artists: [
        { name: 'Primary', id: '1' },
        { name: 'Featured', id: '2' }
      ]
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Primary', id: '1' });
  });

  it('falls back to artist string when artists array is empty', () => {
    const result = getTrackArtists({ artist: 'Solo Artist', artists: [], artistId: 'a1' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Solo Artist', id: 'a1' });
  });

  it('returns artist string without id when artistId is not set', () => {
    const result = getTrackArtists({ artist: 'No ID Artist' });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('No ID Artist');
    expect(result[0]?.id).toBeUndefined();
  });

  it('returns empty array when artists is empty and artist string is missing', () => {
    expect(getTrackArtists({ artists: [] })).toEqual([]);
  });
});
