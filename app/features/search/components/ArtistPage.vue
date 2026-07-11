<script setup lang="ts">
import type { SearchResult } from '../types/search.types';

interface Props {
  artistId: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const router = useRouter();

const {
  artist,
  status,
  error,
  allSongs,
  isLoadingSongs,
  isArtistPlaying,
  isArtistLoading,
  mappedTopSongs,
  mappedAllSongs,
  onPlayArtist,
  onPlayTopSong,
  onPlaySong,
  onPlayAlbumSong,
  onScroll
} = useArtist(props.artistId);

const { playTrack } = usePlayer();
const playerStore = usePlayerStore();

useHead({
  title: computed(() => artist.value?.name || t('search.artist.titleFallback'))
});

function onShuffleArtist() {
  if (!artist.value) return;
  const sourceSongs =
    artist.value.topSongs?.length > 0 ? artist.value.topSongs.slice(0, 10) : allSongs.value;
  if (sourceSongs.length === 0) return;

  const shuffled = [...sourceSongs].sort(() => Math.random() - 0.5);
  const queue = shuffled.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    artists: t.artists,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0
  }));

  playerStore.setQueue(queue);
  if (queue[0]) playTrack(queue[0]);
}

function onNavigateAlbum(album: SearchResult) {
  router.push(`/album/${album.id}`);
}

const isEmpty = computed(
  () =>
    allSongs.value.length === 0 &&
    !isLoadingSongs.value &&
    (!artist.value?.topSongs || artist.value.topSongs.length === 0) &&
    (!artist.value?.albums || artist.value.albums.length === 0)
);

const searchQuery = ref('');
const debouncedSearch = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
  }, 300);
});

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});

const filteredMappedTopSongs = computed(() => {
  if (!debouncedSearch.value) return mappedTopSongs.value;
  const q = debouncedSearch.value.toLowerCase();
  return mappedTopSongs.value.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );
});

const filteredMappedAllSongs = computed(() => {
  if (!debouncedSearch.value) return mappedAllSongs.value;
  const q = debouncedSearch.value.toLowerCase();
  return mappedAllSongs.value.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );
});

function focusSearch() {
  setTimeout(() => {
    const searchInput = document.querySelector(
      '.artist-page__search-input'
    ) as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
    }
  }, 100);
}
</script>

<template>
  <div class="artist-page">
    <div v-if="status === 'error' || (error && status !== 'pending')" class="artist-page__error">
      <AppIcon name="ph:warning-circle" />
      <p>{{ t('search.artist.loadError') }}</p>
    </div>

    <template v-else>
      <AppMusicPage
        :is-loading="status === 'pending'"
        :title="artist?.name || ''"
        :badge="t('search.artist.badge')"
        :image-url="artist?.thumbnailUrl || ''"
        :rounded-image="true"
        :is-list-playing="isArtistPlaying"
        :is-list-loading="isArtistLoading"
        :disable-play-button="
          !artist || (allSongs.length === 0 && (!artist.topSongs || artist.topSongs.length === 0))
        "
        @play-all="onPlayArtist"
        @scroll="onScroll">
        <template v-if="artist?.description && artist.description !== 'N/A'" #description>
          <p class="artist-page__bio">{{ artist.description }}</p>
        </template>

        <template #center-header>
          <div v-if="artist && !isEmpty" class="artist-page__search-bar">
            <AppIcon name="ph:magnifying-glass" class="artist-page__search-icon" />
            <input
              id="artist-search-input"
              v-model="searchQuery"
              type="text"
              :placeholder="t('search.localPlaceholder')"
              :aria-label="t('search.localPlaceholder')"
              class="artist-page__search-input" />
            <div class="artist-page__search-actions">
              <button
                v-if="searchQuery"
                class="artist-page__search-clear"
                :aria-label="t('search.clear')"
                @click="searchQuery = ''">
                <AppIcon name="ph:x" />
              </button>
            </div>
          </div>
        </template>

        <template #actions>
          <button
            class="artist-page__action-btn artist-page__action-btn--mobile-search"
            :title="t('search.localPlaceholder')"
            @click="focusSearch">
            <AppIcon name="ph:magnifying-glass" />
          </button>
          <button
            class="artist-page__action-btn"
            :title="t('player.shuffle')"
            @click="onShuffleArtist">
            <AppIcon name="ph:shuffle" />
          </button>
          <button
            class="artist-page__action-btn"
            :title="t('player.offlineDownload')"
            @click="() => {}">
            <AppIcon name="ph:download-simple" />
          </button>
        </template>

        <template #skeleton-tracks>
          <div class="artist-page__skeleton">
            <div class="artist-page__skeleton-title" />
            <AppTrackList
              :is-loading="true"
              :columns="['index', 'title', 'time']"
              :show-thumbnails="true" />
          </div>
        </template>

        <template #tracks>
          <div v-if="isEmpty" class="artist-page__empty">
            <AppIcon name="ph:music-notes-plus" class="artist-page__empty-icon" />
            <p>{{ t('core.musicDetail.empty') }}</p>
            <NuxtLink to="/" class="artist-page__empty-btn">
              {{ t('playlists.discover') }}
            </NuxtLink>
          </div>

          <template v-else-if="artist">
            <div
              v-if="
                debouncedSearch &&
                filteredMappedTopSongs.length === 0 &&
                filteredMappedAllSongs.length === 0
              "
              class="artist-page__empty">
              <AppIcon name="ph:magnifying-glass" class="artist-page__empty-icon" size="4rem" />
              <p>{{ t('search.page.noResultsQuery', { query: debouncedSearch }) }}</p>
            </div>

            <template v-else>
              <section v-if="filteredMappedTopSongs.length > 0" class="artist-page__section">
                <h2 class="artist-page__section-title">{{ t('search.artist.topSongs') }}</h2>
                <AppTrackList
                  :tracks="filteredMappedTopSongs"
                  :columns="['index', 'title', 'plays', 'time']"
                  :show-thumbnails="true"
                  @play="(track, index) => onPlayTopSong(track, index)" />
              </section>

              <ArtistDiscography
                v-if="!debouncedSearch && artist.albums.length > 0"
                :albums="artist.albums"
                :title="t('search.artist.discography')"
                class="artist-page__section"
                @play="onPlayAlbumSong"
                @navigate="onNavigateAlbum" />

              <section
                v-if="filteredMappedAllSongs.length > 0 || isLoadingSongs"
                class="artist-page__section">
                <h2 class="artist-page__section-title">{{ t('search.artist.allSongs') }}</h2>
                <AppTrackList
                  :tracks="filteredMappedAllSongs"
                  :is-loading="isLoadingSongs"
                  :columns="['index', 'title', 'plays', 'time']"
                  :show-thumbnails="true"
                  @play="onPlaySong" />
              </section>
            </template>
          </template>
        </template>
      </AppMusicPage>
    </template>
  </div>
</template>

<style scoped lang="scss">
.artist-page {
  height: 100%;

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
    gap: 1rem;
    color: var(--color-text-secondary);
    font-size: 1rem;
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0 var(--space-6);
  }

  &__skeleton-title {
    height: 1.5rem;
    width: 180px;
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    animation: shimmer 1.5s infinite;
  }

  &__section {
    margin-bottom: 2.5rem;
    padding: 0 var(--space-6);
  }

  &__section-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 1rem;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  &__empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  &__empty-btn {
    color: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }

  &__bio {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 500px;
  }

  &__action-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-secondary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
    }

    &--mobile-search {
      display: none;
      @media (max-width: 768px) {
        display: flex;
      }
    }
  }

  &__search-bar {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 400px;
    z-index: 10;
  }

  &__search-icon {
    position: absolute;
    left: var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    pointer-events: none;
    z-index: 2;
  }

  &__search-input {
    width: 100%;
    padding: var(--space-3) 2.5rem var(--space-3) calc(var(--space-4) + 1.5rem + var(--space-2));
    background: color-mix(in srgb, var(--color-surface-raised) 80%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    outline: none;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast),
      background-color var(--transition-fast);

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &:focus {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px var(--color-ring);
      background: var(--color-surface);
    }

    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__search-actions {
    position: absolute;
    right: var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    z-index: 2;
  }

  &__search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: var(--color-surface-hover);
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    transition:
      color var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-raised);
    }
  }

  &__action-btn {
    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
