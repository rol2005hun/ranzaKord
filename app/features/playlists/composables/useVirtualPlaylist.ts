import type { PlaylistTrack } from '../types/playlists.types';

interface UseVirtualPlaylistOptions {
  trackCount: Ref<number>;
  fetchChunk: (offset: number, limit: number) => Promise<PlaylistTrack[]>;
  chunkSize?: number;
  itemHeight?: number;
  debounceMs?: number;
}

interface UseVirtualPlaylistReturn {
  virtualTracks: Ref<(PlaylistTrack | null)[]>;
  containerRef: Ref<HTMLElement | null>;
  visibleItems: ComputedRef<{ index: number; track: PlaylistTrack | null }[]>;
  totalHeight: ComputedRef<number>;
  offsetY: ComputedRef<number>;
  onScroll: (event: Event) => void;
  isLoadingChunk: Ref<boolean>;
  scrollTop: Ref<number>;
  visibleCount: Ref<number>;
  overscan: number;
}

export function useVirtualPlaylist({
  trackCount,
  fetchChunk,
  chunkSize = 50,
  itemHeight = 57,
  debounceMs = 200
}: UseVirtualPlaylistOptions): UseVirtualPlaylistReturn {
  const virtualTracks = ref<(PlaylistTrack | null)[]>([]);
  const containerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);
  const visibleCount = ref(10);
  const isLoadingChunk = ref(false);
  const loadingChunks = new Set<number>();
  const overscan = 3;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    trackCount,
    (count) => {
      const current = virtualTracks.value.length;
      if (count > current) {
        virtualTracks.value = [...virtualTracks.value, ...Array(count - current).fill(null)];
      } else if (count < current) {
        virtualTracks.value = virtualTracks.value.slice(0, count);
      }
    },
    { immediate: true }
  );

  const totalHeight = computed(() => trackCount.value * itemHeight);

  const startIndex = computed(() =>
    Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
  );

  const endIndex = computed(() =>
    Math.min(
      trackCount.value - 1,
      Math.floor(scrollTop.value / itemHeight) + visibleCount.value + overscan
    )
  );

  const offsetY = computed(() => startIndex.value * itemHeight);

  const visibleItems = computed(() => {
    const items: { index: number; track: PlaylistTrack | null }[] = [];
    for (let i = startIndex.value; i <= endIndex.value; i++) {
      items.push({ index: i, track: virtualTracks.value[i] ?? null });
    }
    return items;
  });

  function getChunkStart(index: number): number {
    return Math.floor(index / chunkSize) * chunkSize;
  }

  function getMissingChunks(start: number, end: number): number[] {
    const chunks = new Set<number>();
    for (let i = start; i <= end; i++) {
      if (virtualTracks.value[i] === null) {
        chunks.add(getChunkStart(i));
      }
    }
    return [...chunks].filter((c) => !loadingChunks.has(c));
  }

  async function loadMissingChunks(start: number, end: number): Promise<void> {
    const missing = getMissingChunks(start, end);
    if (missing.length === 0) return;

    isLoadingChunk.value = true;

    await Promise.all(
      missing.map(async (chunkStart) => {
        loadingChunks.add(chunkStart);
        try {
          const tracks = await fetchChunk(chunkStart, chunkSize);
          tracks.forEach((track, i) => {
            const idx = chunkStart + i;
            if (idx < virtualTracks.value.length) {
              virtualTracks.value[idx] = track;
            }
          });
        } finally {
          loadingChunks.delete(chunkStart);
        }
      })
    );

    isLoadingChunk.value = false;
  }

  function triggerLoad(): void {
    loadMissingChunks(startIndex.value, endIndex.value);
  }

  function onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const offset = containerRef.value?.offsetTop || 0;
    scrollTop.value = Math.max(0, el.scrollTop - offset);

    const containerHeight = el.clientHeight || window.innerHeight;
    visibleCount.value = Math.max(10, Math.ceil(containerHeight / itemHeight));

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      triggerLoad();
    }, debounceMs);
  }

  watch(containerRef, (el) => {
    if (el) {
      // Poll for silent scroll restorations from the browser history for 1 second
      let attempts = 0;
      const interval = setInterval(() => {
        const scrollArea =
          el.closest('.music-page__scroll-area') || el.closest('.music-layout__main');
        if (scrollArea) {
          const offset = el.offsetTop || 0;
          const actualScroll = Math.max(0, scrollArea.scrollTop - offset);

          // If browser restored scroll silently without firing event, sync it
          if (Math.abs(actualScroll - scrollTop.value) > 2) {
            scrollTop.value = actualScroll;
            const containerHeight = scrollArea.clientHeight || window.innerHeight;
            visibleCount.value = Math.max(10, Math.ceil(containerHeight / itemHeight));
            triggerLoad();
          }
        }

        attempts++;
        if (attempts > 10) clearInterval(interval);
      }, 100);
    }
  });

  onMounted(() => {
    visibleCount.value = Math.max(10, Math.ceil(window.innerHeight / itemHeight));
    triggerLoad();
  });

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return {
    virtualTracks,
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
    isLoadingChunk,
    scrollTop,
    visibleCount,
    overscan
  };
}
