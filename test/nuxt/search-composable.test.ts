import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSearch } from '../../app/features/search/composables/useSearch';
import { useSearchStore } from '../../app/features/search/stores/useSearchStore';

describe('useSearch', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockFetch = vi.fn();
    globalThis.$fetch = mockFetch as unknown as typeof $fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('exposes state correctly', () => {
    const { query, searchType, isLoading } = useSearch();
    expect(query.value).toBe('');
    expect(searchType.value).toBe('all');
    expect(isLoading.value).toBe(false);
  });

  it('clear() clears search state', () => {
    const { search, clear, query } = useSearch();
    search('test', 'all', true);
    expect(query.value).toBe('test');
    clear();
    expect(query.value).toBe('');
  });

  it('search() sets query and loading state immediately', () => {
    const { search, query, isLoading } = useSearch();
    search('test query');
    expect(query.value).toBe('test query');
    expect(isLoading.value).toBe(true);
  });

  it('search() with empty query clears results and sets loading false', () => {
    const { search, isLoading } = useSearch();
    const store = useSearchStore();
    store.setLoading(true);
    search('');
    expect(isLoading.value).toBe(false);
  });

  it('search() with immediate=true fetches data immediately', async () => {
    const mockData = { songs: [], artists: [], albums: [] };
    mockFetch.mockResolvedValueOnce(mockData);

    const { search, categorizedResults, isLoading } = useSearch();
    await search('immediate query', 'all', true);

    expect(mockFetch).toHaveBeenCalledWith('/api/search?q=immediate%20query&_v=2');
    expect(categorizedResults.value).toEqual(mockData);
    expect(isLoading.value).toBe(false);
  });

  it('search() sets specific type results', async () => {
    const mockData = [{ id: '1', title: 'test', type: 'song', artist: 'Artist', thumbnailUrl: '' }];
    mockFetch.mockResolvedValueOnce(mockData);

    const { search, results } = useSearch();
    await search('test track', 'song', true);

    expect(mockFetch).toHaveBeenCalledWith('/api/search?q=test%20track&type=song&_v=2');
    expect(results.value).toEqual(mockData);
  });

  it('search() handles errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { search, error, isLoading } = useSearch();
    await search('fail', 'all', true);

    expect(error.value).toBe('Search failed. Please try again.');
    expect(isLoading.value).toBe(false);
  });

  it('search() uses debounce timer if immediate=false', async () => {
    const mockData = { songs: [], artists: [], albums: [] };
    mockFetch.mockResolvedValueOnce(mockData);

    const { search } = useSearch();
    search('debounce test', 'all', false);

    expect(mockFetch).not.toHaveBeenCalled();
    vi.runAllTimers();

    // Wait for promise tick
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledWith('/api/search?q=debounce%20test&_v=2');
  });
});
