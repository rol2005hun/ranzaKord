import type {
  SearchResult,
  CategorizedSearchResults,
  SearchResultType
} from '../types/search.types';

const searchCache = new Map<string, CategorizedSearchResults | SearchResult[]>();
const MAX_CACHE_SIZE = 20;

export function useSearch() {
  const store = useSearchStore();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function search(q: string, type: 'all' | SearchResultType = 'all', immediate = false) {
    store.setQuery(q);
    store.setSearchType(type);
    store.clearResults();

    if (!q.trim()) {
      store.setLoading(false);
      return;
    }

    store.setLoading(true);
    if (debounceTimer) clearTimeout(debounceTimer);

    const performSearch = async () => {
      store.setError(null);

      const authStore = useAuthStore();
      if (authStore.currentUser?.isDemo) {
        const { DEMO_TRACKS } = await import('@/features/core/utils/demoData');
        const lowerQ = q.toLowerCase();
        const filtered = DEMO_TRACKS.filter(
          (t) => t.title.toLowerCase().includes(lowerQ) || t.artist.toLowerCase().includes(lowerQ)
        );

        const searchResults: SearchResult[] = filtered.map((t) => ({
          id: t.videoId,
          type: 'song',
          title: t.title,
          artist: t.artist,
          artists: t.artists,
          thumbnailUrl: t.thumbnailUrl,
          durationSeconds: t.durationSeconds
        }));

        if (type === 'all') {
          store.setCategorizedResults({
            songs: searchResults,
            albums: [],
            artists: [],
            profiles: []
          });
        } else {
          store.setResults(searchResults);
        }
        store.setLoading(false);
        return;
      }

      try {
        const fetchUrl =
          type === 'all'
            ? `/api/search?q=${encodeURIComponent(q.trim())}&_v=2`
            : `/api/search?q=${encodeURIComponent(q.trim())}&type=${type}&_v=2`;

        if (searchCache.has(fetchUrl)) {
          const cachedData = searchCache.get(fetchUrl);
          if (type === 'all') {
            store.setCategorizedResults(cachedData as CategorizedSearchResults);
          } else {
            store.setResults(cachedData as SearchResult[]);
          }
          return;
        }

        const data = await $fetch<CategorizedSearchResults | SearchResult[]>(fetchUrl);

        if (searchCache.size >= MAX_CACHE_SIZE) {
          const firstKey = searchCache.keys().next().value;
          if (firstKey) searchCache.delete(firstKey);
        }
        searchCache.set(fetchUrl, data);

        if (type === 'all') {
          store.setCategorizedResults(data as CategorizedSearchResults);
        } else {
          store.setResults(data as SearchResult[]);
        }
      } catch {
        store.setError('Search failed. Please try again.');
      } finally {
        store.setLoading(false);
      }
    };

    if (immediate) {
      performSearch();
    } else {
      debounceTimer = setTimeout(performSearch, 350);
    }
  }

  function clear() {
    if (debounceTimer) clearTimeout(debounceTimer);
    store.clearResults();
    store.setQuery('');
  }

  return {
    query: computed(() => store.query),
    searchType: computed(() => store.searchType),
    results: computed(() => store.results),
    categorizedResults: computed(() => store.categorizedResults),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    search,
    clear
  };
}
