import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSearchStore } from '../../app/features/search/stores/useSearchStore';

describe('useSearchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with empty query from route', () => {
    const store = useSearchStore();
    expect(store.query).toBe('');
    expect(store.isLoading).toBe(false);
    expect(store.searchType).toBe('all');
  });

  it('setQuery updates query', () => {
    const store = useSearchStore();
    store.setQuery('new query');
    expect(store.query).toBe('new query');
  });

  it('setSearchType updates type', () => {
    const store = useSearchStore();
    store.setSearchType('song');
    expect(store.searchType).toBe('song');
  });

  it('setResults updates results and clears categorized', () => {
    const store = useSearchStore();
    store.setCategorizedResults({ songs: [], artists: [], albums: [], profiles: [] });
    store.setResults([
      { id: '1', title: 'Test', artist: 'Artist', type: 'song', thumbnailUrl: '' }
    ]);
    expect(store.results.length).toBe(1);
    expect(store.categorizedResults).toBeNull();
  });

  it('setCategorizedResults updates categorized and clears results', () => {
    const store = useSearchStore();
    store.setResults([
      { id: '1', title: 'Test', artist: 'Artist', type: 'song', thumbnailUrl: '' }
    ]);
    store.setCategorizedResults({ songs: [], artists: [], albums: [], profiles: [] });
    expect(store.categorizedResults).not.toBeNull();
    expect(store.results.length).toBe(0);
  });

  it('setLoading updates loading state', () => {
    const store = useSearchStore();
    store.setLoading(false);
    expect(store.isLoading).toBe(false);
  });

  it('setError updates error message', () => {
    const store = useSearchStore();
    store.setError('Error occurred');
    expect(store.error).toBe('Error occurred');
  });

  it('clearResults resets state', () => {
    const store = useSearchStore();
    store.setResults([
      { id: '1', title: 'Test', artist: 'Artist', type: 'song', thumbnailUrl: '' }
    ]);
    store.setCategorizedResults({ songs: [], artists: [], albums: [], profiles: [] });
    store.setError('Error');
    store.clearResults();
    expect(store.results.length).toBe(0);
    expect(store.categorizedResults).toBeNull();
    expect(store.error).toBeNull();
  });
});
