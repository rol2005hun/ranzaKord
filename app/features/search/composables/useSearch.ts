import type { SearchResult } from '../types/search.types';
import type { Track } from '@/features/player/types/player.types';

export function useSearch() {
  const store = useSearchStore();
  const playerStore = usePlayerStore();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function search(q: string) {
    store.setQuery(q);
    store.clearResults();

    if (!q.trim()) return;

    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      store.setLoading(true);
      store.setError(null);

      try {
        const data = await $fetch<SearchResult[]>('/api/search', {
          query: { q: q.trim() }
        });

        store.setResults(data);

        const tracks: Track[] = data.map((r) => ({
          videoId: r.videoId,
          title: r.title,
          artist: r.artist,
          thumbnailUrl: r.thumbnailUrl,
          durationSeconds: r.durationSeconds
        }));

        playerStore.setQueue(tracks);
      } catch {
        store.setError('Search failed. Please try again.');
      } finally {
        store.setLoading(false);
      }
    }, 350);
  }

  function clear() {
    if (debounceTimer) clearTimeout(debounceTimer);
    store.clearResults();
    store.setQuery('');
  }

  return {
    query: computed(() => store.query),
    results: computed(() => store.results),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    search,
    clear
  };
}
