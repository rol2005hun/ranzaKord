import type { SearchResult } from '../types/search.types';

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const results = ref<SearchResult[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function setQuery(q: string) {
    query.value = q;
  }

  function setResults(data: SearchResult[]) {
    results.value = data;
  }

  function setLoading(value: boolean) {
    isLoading.value = value;
  }

  function setError(message: string | null) {
    error.value = message;
  }

  function clearResults() {
    results.value = [];
    error.value = null;
  }

  return { query, results, isLoading, error, setQuery, setResults, setLoading, setError, clearResults };
});
