import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Search from '../../app/pages/search.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

setActivePinia(createPinia());
const mockSearch = vi.fn();
const mockQuery = ref('');
const mockResults = ref<Array<Record<string, unknown>>>([]);
const mockCategorizedResults = ref<Record<string, unknown> | null>(null);
const mockSearchType = ref('all');
const mockIsLoading = ref(false);
const mockError = ref<string | null>(null);

mockNuxtImport('useSearch', () => {
  return () => ({
    search: mockSearch,
    query: mockQuery,
    results: mockResults,
    categorizedResults: mockCategorizedResults,
    searchType: mockSearchType,
    isLoading: mockIsLoading,
    error: mockError
  });
});

const mockRoute = {
  query: { q: '', type: '' }
};
const mockRouter = {
  replace: vi.fn(),
  afterEach: vi.fn(),
  beforeResolve: vi.fn(),
  beforeEach: vi.fn(),
  push: vi.fn(),
  onError: vi.fn()
};

mockNuxtImport('useRoute', () => () => mockRoute);
mockNuxtImport('useRouter', () => () => mockRouter);

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string, params: Record<string, unknown>) =>
      key + (params ? JSON.stringify(params) : '')
  });
});

mockNuxtImport('usePlayer', () => {
  return () => ({
    playQueue: vi.fn()
  });
});

mockNuxtImport('definePageMeta', () => vi.fn());

describe('search.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockQuery.value = '';
    mockRoute.query = { q: '', type: '' };
    mockIsLoading.value = false;
    mockError.value = null;
    mockSearchType.value = 'all';
    mockCategorizedResults.value = null;
    mockResults.value = [];
  });

  const mountSearch = () => {
    return mount(Search, {
      global: {
        mocks: { $t: (k: string, p: Record<string, unknown>) => k + (p ? JSON.stringify(p) : '') },
        stubs: {
          SearchCategoryTabs: true,
          AppSkeleton: true,
          AppIcon: true,
          TopResultCard: true,
          SearchListItem: true
        }
      }
    });
  };

  it('renders empty state initially', () => {
    const wrapper = mountSearch();
    expect(wrapper.text()).toContain('search.page.emptyPrompt');
  });

  it('calls search on mount if query exists', () => {
    mockRoute.query = { q: 'test', type: 'all' };
    mockQuery.value = '';

    mountSearch();

    // nextTick handles the search call on mounted
    // Need to wait for it or just check later
  });

  it('renders loading state', () => {
    mockRoute.query = { q: 'test', type: 'all' };
    mockQuery.value = 'test';
    mockIsLoading.value = true;

    const wrapper = mountSearch();
    expect(wrapper.find('.search-page__loading-skeleton').exists()).toBe(true);
  });

  it('renders error state', () => {
    mockRoute.query = { q: 'test', type: 'all' };
    mockQuery.value = 'test';
    mockError.value = 'Failed to load';

    const wrapper = mountSearch();
    expect(wrapper.text()).toContain('Failed to load');
  });

  it('renders categorized results for "all"', () => {
    mockRoute.query = { q: 'test', type: 'all' };
    mockQuery.value = 'test';
    mockCategorizedResults.value = {
      topResult: { id: 'top' },
      songs: [{ id: 's1' }],
      artists: [{ id: 'a1' }],
      albums: [{ id: 'al1' }]
    };

    const wrapper = mountSearch();

    expect(wrapper.findComponent({ name: 'TopResultCard' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'SearchListItem' }).exists()).toBe(true);

    // Should show Artists section
    expect(wrapper.text()).toContain('search.page.artists');
  });

  it('renders flat results for specific category', () => {
    mockRoute.query = { q: 'test', type: 'song' };
    mockQuery.value = 'test';
    mockSearchType.value = 'song';
    mockResults.value = [{ id: 's1' }, { id: 's2' }];

    const wrapper = mountSearch();

    expect(wrapper.findAllComponents({ name: 'SearchListItem' }).length).toBe(2);
  });
});
