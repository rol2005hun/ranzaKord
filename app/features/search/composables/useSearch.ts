import type {
  SearchResult,
  CategorizedSearchResults,
  SearchResultType
} from '../types/search.types';

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

      try {
        const fetchUrl =
          type === 'all'
            ? `/api/search?q=${encodeURIComponent(q.trim())}&_v=2`
            : `/api/search?q=${encodeURIComponent(q.trim())}&type=${type}&_v=2`;

        const data = await $fetch<CategorizedSearchResults | SearchResult[]>(fetchUrl);

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
