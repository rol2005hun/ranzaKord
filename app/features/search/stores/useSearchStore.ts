import type {
  SearchResult,
  CategorizedSearchResults,
  SearchResultType
} from '../types/search.types';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const searchType = ref<'all' | SearchResultType>('all');
  const results = ref<SearchResult[]>([]);
  const categorizedResults = ref<CategorizedSearchResults | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function setQuery(q: string) {
    query.value = q;
  }

  function setSearchType(type: 'all' | SearchResultType) {
    searchType.value = type;
  }

  function setResults(data: SearchResult[]) {
    results.value = data;
    categorizedResults.value = null;
  }

  function setCategorizedResults(data: CategorizedSearchResults) {
    categorizedResults.value = data;
    results.value = [];
  }

  function setLoading(value: boolean) {
    isLoading.value = value;
  }

  function setError(message: string | null) {
    error.value = message;
  }

  function clearResults() {
    results.value = [];
    categorizedResults.value = null;
    error.value = null;
  }

  return {
    query,
    searchType,
    results,
    categorizedResults,
    isLoading,
    error,
    setQuery,
    setSearchType,
    setResults,
    setCategorizedResults,
    setLoading,
    setError,
    clearResults
  };
});
