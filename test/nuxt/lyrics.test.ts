import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useLyrics } from '../../app/features/player/composables/useLyrics';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import type { Track } from '@/features/player/types/player.types';

const fetchSpy = vi.hoisted(() => vi.fn());
mockNuxtImport('$fetch', () => fetchSpy);

describe('useLyrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    const { clearLyrics } = useLyrics();
    clearLyrics();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTrack: Track = {
    videoId: 'test-track-1',
    title: 'Nagy Bogi - Bulvár',
    artist: 'Nagy Bogi',
    durationSeconds: 128,
    thumbnailUrl: ''
  };

  it('cleans title and fetches lyrics successfully via exact match', async () => {
    fetchSpy.mockResolvedValueOnce({
      syncedLyrics: '[00:01.00] Na, egy zárókérdés\n[00:05.00] Szívemben nincsen már hely',
      plainLyrics: 'Na, egy zárókérdés\nSzívemben nincsen már hely'
    });

    const { lyricsData, fetchLyrics, getActiveLine } = useLyrics();
    await fetchLyrics(mockTrack);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('track_name=Bulv%C3%A1r'),
      expect.any(Object)
    );
    expect(lyricsData.value?.synced?.length).toBe(2);
    expect(getActiveLine(3)).toBe(0);
    expect(getActiveLine(6)).toBe(1);
  });

  it('falls back to search when exact match fails', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('404 Not Found'));
    fetchSpy.mockRejectedValueOnce(new Error('404 Not Found'));
    fetchSpy.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Bulvár',
        trackName: 'Bulvár',
        artistName: 'Nagy Bogi',
        duration: 128,
        syncedLyrics: '[00:01.00] Szia',
        plainLyrics: 'Szia'
      }
    ]);

    const { lyricsData, fetchLyrics } = useLyrics();
    await fetchLyrics(mockTrack);

    expect(lyricsData.value?.synced?.[0]?.text).toBe('Szia');
  });

  it('uses cached lyrics without making another fetch call', async () => {
    fetchSpy.mockResolvedValueOnce({
      syncedLyrics: '[00:01.00] Line 1',
      plainLyrics: 'Line 1'
    });

    const { lyricsData, fetchLyrics } = useLyrics();
    await fetchLyrics(mockTrack);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(lyricsData.value?.synced?.[0]?.text).toBe('Line 1');

    fetchSpy.mockClear();
    await fetchLyrics(mockTrack);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(lyricsData.value?.synced?.[0]?.text).toBe('Line 1');
  });
});
