<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type { PlaylistDetail, PlaylistTrack } from '@/features/playlists/types/playlists.types';
import type { TrackListItem } from '@/components/shared/TrackList.vue';
import type { Track } from '@/features/player/types/player.types';

definePageMeta({
  layout: 'music'
});

const CHUNK_SIZE = 50;
const ITEM_HEIGHT = 57;

const route = useRoute();
const id = computed(() => route.params.id as string);

const store = usePlaylistsStore();
const player = usePlayer();
const offlineStore = useOfflineStore();

onMounted(async () => {
  await offlineStore.init();
});

const playlist = ref<PlaylistDetail | null>(null);
const isLoading = ref(true);
const isDeleting = ref(false);
const showEditModal = ref(false);
const showCollaboratorModal = ref(false);
const showDeleteConfirm = ref(false);

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

onUnmounted(() => {
  clearNuxtData(`playlist-${id.value}`);
});

const sortBy = ref<string>('');
const sortOrder = ref<'asc' | 'desc'>('asc');

function onSort(by: string, order: 'asc' | 'desc'): void {
  sortBy.value = by;
  sortOrder.value = order;
}

const { data, status, refresh } = useAsyncData<PlaylistDetail | null>(
  `playlist-${id.value}`,
  async () => {
    if (!id.value) return null;
    return await store.fetchDetail(id.value, {
      limit: CHUNK_SIZE,
      offset: 0,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value,
      search: debouncedSearch.value || undefined
    });
  },
  {
    watch: [id, sortBy, sortOrder, debouncedSearch],
    lazy: true
  }
);

watchEffect(() => {
  if (data.value) {
    playlist.value = data.value;
  }
  isLoading.value = status.value === 'pending' && !playlist.value;
});

const trackCount = computed(() => playlist.value?.trackCount ?? 0);

async function fetchChunk(offset: number, limit: number): Promise<PlaylistTrack[]> {
  if (!id.value) return [];
  const result = await store.fetchDetail(id.value, {
    limit,
    offset,
    sortBy: sortBy.value || undefined,
    sortOrder: sortOrder.value,
    search: debouncedSearch.value || undefined
  });
  return result?.tracks ?? [];
}

const { virtualTracks, visibleItems, totalHeight, offsetY, onScroll, containerRef } =
  useVirtualPlaylist({
    trackCount,
    fetchChunk,
    chunkSize: CHUNK_SIZE,
    itemHeight: ITEM_HEIGHT,
    debounceMs: 200
  });

watch(
  () => data.value,
  (newData) => {
    if (!newData) return;
    const count = newData.trackCount;
    const firstChunk = newData.tracks;
    playlist.value = newData;

    virtualTracks.value = new Array(count).fill(null);
    for (let i = 0; i < firstChunk.length; i++) {
      virtualTracks.value[i] = firstChunk[i] ?? null;
    }
  },
  { immediate: true }
);

function setContainerRef(el: Element | ComponentPublicInstance | null) {
  containerRef.value = el as HTMLElement | null;
}

watch(debouncedSearch, () => {
  if (containerRef.value) {
    const scrollArea = containerRef.value.closest('.music-page__scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }
});

function focusSearch() {
  if (containerRef.value) {
    const scrollArea = containerRef.value.closest('.music-page__scroll-area');
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  setTimeout(() => {
    const searchInput = document.querySelector(
      '.playlist-page__search-input'
    ) as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
    }
  }, 100);
}

useHead({
  title: computed(() => playlist.value?.name || 'Playlist')
});

const isReorderable = computed(() => !debouncedSearch.value && !sortBy.value);

const isCurrentPlaylistPlaying = computed(() => {
  if (!playlist.value || virtualTracks.value.length === 0) return false;
  if (!player.isPlaying.value) return false;
  return virtualTracks.value.some(
    (t) => t !== null && t.videoId === player.currentTrack.value?.videoId
  );
});

const auth = useAuthStore();
const isOwner = computed(() => {
  return auth.user?.sub && playlist.value?.ownerId === auth.user.sub;
});

const isCurrentPlaylistLoading = computed(() => {
  if (!playlist.value || virtualTracks.value.length === 0) return false;
  if (!player.isLoading.value) return false;
  return virtualTracks.value.some(
    (t) => t !== null && t.videoId === player.currentTrack.value?.videoId
  );
});

async function playAll(): Promise<void> {
  let loadedTracks = virtualTracks.value.filter((t): t is PlaylistTrack => t !== null);

  if (playlist.value && playlist.value.trackCount > loadedTracks.length) {
    const fullDetail = await store.fetchDetail(id.value, {
      limit: playlist.value.trackCount,
      offset: 0,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value,
      search: debouncedSearch.value || undefined
    });
    if (fullDetail?.tracks) {
      loadedTracks = fullDetail.tracks;
    }
  }

  if (loadedTracks.length === 0) return;

  if (isCurrentPlaylistPlaying.value) {
    player.togglePlay();
    return;
  }

  const tracksToPlay = loadedTracks.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    artists: t.artists?.length
      ? t.artists.map((a) => ({ name: a.name, id: a.channelId }))
      : t.artist
          .split(/,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i)
          .map((s) => ({ name: s.trim() }))
          .filter((a) => a.name),
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

  const pStore = usePlayerStore();
  pStore.playbackContext = {
    type: 'playlist',
    sourceId: id.value,
    currentOffset: loadedTracks.length,
    totalItems: playlist.value?.trackCount || loadedTracks.length
  };
  player.playQueue(tracksToPlay, 0);
}

async function onPlaySong(track: TrackListItem, index: number): Promise<void> {
  let loadedTracks = virtualTracks.value.filter((t): t is PlaylistTrack => t !== null);

  if (playlist.value && playlist.value.trackCount > loadedTracks.length) {
    const fullDetail = await store.fetchDetail(id.value, {
      limit: playlist.value.trackCount,
      offset: 0,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value,
      search: debouncedSearch.value || undefined
    });
    if (fullDetail?.tracks) {
      loadedTracks = fullDetail.tracks;
    }
  }

  const tracksToPlay = loadedTracks.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    artists: t.artists?.length
      ? t.artists.map((a) => ({ name: a.name, id: a.channelId }))
      : t.artist
          .split(/,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i)
          .map((s) => ({ name: s.trim() }))
          .filter((a) => a.name),
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

  const pStore = usePlayerStore();
  pStore.playbackContext = {
    type: 'playlist',
    sourceId: id.value,
    currentOffset: loadedTracks.length,
    totalItems: playlist.value?.trackCount || loadedTracks.length
  };
  const resolvedIndex = loadedTracks.findIndex((t) => t.videoId === track.id);
  player.playQueue(tracksToPlay, resolvedIndex >= 0 ? resolvedIndex : index);
}

async function removeTrack(videoId: string): Promise<void> {
  await store.removeTrack(id.value, videoId);
  const idx = virtualTracks.value.findIndex((t) => t?.videoId === videoId);
  if (idx >= 0) {
    virtualTracks.value.splice(idx, 1);
    if (playlist.value) {
      playlist.value.trackCount = Math.max(0, playlist.value.trackCount - 1);
    }
  }
}

function removeTrackWrapper(track: TrackListItem): void {
  removeTrack(track.id);
}

const mappedVisibleItems = computed(() => {
  return visibleItems.value.map((item) => ({
    index: item.index,
    data: item.track
      ? {
          id: item.track.videoId,
          title: item.track.title,
          artist: item.track.artist,
          artistId: item.track.artistId,
          artists: item.track.artists ?? [],
          thumbnailUrl: item.track.thumbnailUrl,
          durationSeconds: Math.round(item.track.durationMs / 1000),
          addedAt: item.track.addedAt,
          isPlaying:
            player.isPlaying.value && player.currentTrack.value?.videoId === item.track.videoId
        }
      : null
  }));
});

async function onDelete(): Promise<void> {
  if (isDeleting.value) return;
  isDeleting.value = true;
  try {
    const deleted = await store.remove(id.value);
    if (deleted) {
      showDeleteConfirm.value = false;
      await navigateTo('/');
    }
  } finally {
    isDeleting.value = false;
  }
}

async function onImageError(): Promise<void> {
  const firstTrackThumb = virtualTracks.value.find(
    (t) => t !== null && t.thumbnailUrl
  )?.thumbnailUrl;
  if (!firstTrackThumb || !playlist.value) return;
  await store.update(id.value, { imageUrl: firstTrackThumb });
  await refresh();
}

const isDownloadingPlaylist = ref(false);

async function downloadPlaylist(): Promise<void> {
  if (isDownloadingPlaylist.value) return;
  const loaded = virtualTracks.value.filter((t): t is PlaylistTrack => t !== null);
  if (loaded.length === 0) return;
  isDownloadingPlaylist.value = true;
  for (const t of loaded) {
    const track: Track = {
      videoId: t.videoId,
      title: t.title,
      artist: t.artist,
      thumbnailUrl: t.thumbnailUrl,
      durationSeconds: Math.round(t.durationMs / 1000)
    };
    if (!offlineStore.isTrackDownloaded(track.videoId)) {
      await offlineStore.downloadTrack(track);
    }
  }
  isDownloadingPlaylist.value = false;
}

const showMobileMenu = ref(false);
const showStickyMobileMenu = ref(false);
</script>

<template>
  <div class="playlist-page">
    <AppMusicPage
      :is-loading="isLoading"
      :is-error="!playlist && !isLoading"
      :title="playlist?.name"
      :badge="$t('playlists.myPlaylist')"
      :image-url="playlist?.imageUrl"
      :is-list-playing="isCurrentPlaylistPlaying"
      :is-list-loading="isCurrentPlaylistLoading"
      :disable-play-button="trackCount === 0"
      @play-all="playAll"
      @scroll="onScroll"
      @image-error="onImageError">
      <template #meta>
        <span v-if="playlist?.description" class="playlist-page__description">
          {{ playlist.description }}
        </span>
        <span v-if="playlist?.description">•</span>
        <span class="playlist-page__count">
          {{ $t('playlists.trackCount', { count: playlist?.trackCount ?? 0 }) }}
        </span>
      </template>

      <template #center-header>
        <div
          v-if="(playlist?.trackCount ?? 0) > 0 || debouncedSearch"
          class="playlist-page__search-bar">
          <AppIcon
            v-if="status === 'pending' && playlist"
            name="ph:spinner-gap"
            class="playlist-page__search-icon spin" />
          <AppIcon v-else name="ph:magnifying-glass" class="playlist-page__search-icon" />
          <input
            id="playlist-search-input"
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search.placeholder')"
            :aria-label="$t('search.placeholder')"
            class="playlist-page__search-input" />

          <div class="playlist-page__search-actions">
            <button
              v-if="searchQuery"
              class="playlist-page__search-clear"
              :aria-label="$t('search.clear')"
              @click="searchQuery = ''">
              <AppIcon name="ph:x" />
            </button>
          </div>
        </div>
      </template>

      <template #sticky-subtitle>
        {{ $t('playlists.trackCount', { count: playlist?.trackCount ?? 0 }) }}
      </template>

      <template #sticky-actions>
        <div class="playlist-page__actions-desktop">
          <button
            class="playlist-page__action-btn"
            :title="$t('search.placeholder')"
            @click="focusSearch">
            <AppIcon name="ph:magnifying-glass" />
          </button>
          <button
            class="playlist-page__action-btn"
            :title="$t('playlists.editPlaylist')"
            @click="showEditModal = true">
            <AppIcon name="ph:pencil-simple" />
          </button>
          <button
            v-if="isOwner"
            class="playlist-page__action-btn"
            title="Kollaborátorok"
            @click="showCollaboratorModal = true">
            <AppIcon name="ph:users" />
          </button>
          <button
            class="playlist-page__action-btn playlist-page__action-btn--danger"
            :title="$t('playlists.deletePlaylist')"
            :disabled="isDeleting"
            @click="showDeleteConfirm = true">
            <AppIcon name="ph:trash" />
          </button>
        </div>
        <div class="playlist-page__actions-mobile">
          <button
            class="playlist-page__action-btn"
            :title="$t('search.placeholder')"
            @click="focusSearch">
            <AppIcon name="ph:magnifying-glass" />
          </button>
          <div class="playlist-page__more-container">
            <button
              class="playlist-page__action-btn"
              @click="showStickyMobileMenu = !showStickyMobileMenu">
              <AppIcon name="ph:dots-three-vertical-bold" />
            </button>
            <div
              v-if="showStickyMobileMenu"
              class="playlist-page__dropdown-overlay"
              @click="showStickyMobileMenu = false"></div>
            <Transition name="dropdown">
              <div v-if="showStickyMobileMenu" class="playlist-page__dropdown">
                <button
                  class="playlist-page__dropdown-item"
                  @click="
                    showStickyMobileMenu = false;
                    showEditModal = true;
                  ">
                  <AppIcon name="ph:pencil-simple" />
                  {{ $t('playlists.editPlaylist') }}
                </button>
                <button
                  v-if="isOwner"
                  class="playlist-page__dropdown-item"
                  @click="
                    showStickyMobileMenu = false;
                    showCollaboratorModal = true;
                  ">
                  <AppIcon name="ph:users" />
                  Kollaborátorok
                </button>
                <button
                  class="playlist-page__dropdown-item playlist-page__dropdown-item--danger"
                  :disabled="isDeleting"
                  @click="
                    showStickyMobileMenu = false;
                    showDeleteConfirm = true;
                  ">
                  <AppIcon name="ph:trash" />
                  {{ $t('playlists.deletePlaylist') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </template>

      <template #actions>
        <div class="playlist-page__actions-desktop">
          <button
            class="playlist-page__action-btn"
            :title="$t('offline.downloadPlaylist')"
            :disabled="isDownloadingPlaylist"
            @click="downloadPlaylist">
            <AppSpinner v-if="isDownloadingPlaylist" size="sm" />
            <AppIcon v-else name="ph:arrow-circle-down-duotone" />
          </button>
          <button
            class="playlist-page__action-btn"
            :title="$t('playlists.editPlaylist')"
            @click="showEditModal = true">
            <AppIcon name="ph:pencil-simple" />
          </button>
          <button
            v-if="isOwner"
            class="playlist-page__action-btn"
            title="Kollaborátorok"
            @click="showCollaboratorModal = true">
            <AppIcon name="ph:users" />
          </button>
          <button
            class="playlist-page__action-btn playlist-page__action-btn--danger"
            :title="$t('playlists.deletePlaylist')"
            :disabled="isDeleting"
            @click="showDeleteConfirm = true">
            <AppIcon name="ph:trash" />
          </button>
        </div>
        <div class="playlist-page__actions-mobile">
          <div class="playlist-page__more-container">
            <button
              class="playlist-page__action-btn playlist-page__action-btn--more"
              @click="showMobileMenu = !showMobileMenu">
              <AppIcon name="ph:dots-three-vertical-bold" />
            </button>
            <div
              v-if="showMobileMenu"
              class="playlist-page__dropdown-overlay"
              @click="showMobileMenu = false"></div>
            <Transition name="dropdown">
              <div v-if="showMobileMenu" class="playlist-page__dropdown">
                <button
                  class="playlist-page__dropdown-item"
                  :disabled="isDownloadingPlaylist"
                  @click="
                    showMobileMenu = false;
                    downloadPlaylist();
                  ">
                  <AppSpinner v-if="isDownloadingPlaylist" size="sm" />
                  <AppIcon v-else name="ph:arrow-circle-down-duotone" />
                  {{ $t('offline.downloadPlaylist') }}
                </button>
                <button
                  class="playlist-page__dropdown-item"
                  @click="
                    showMobileMenu = false;
                    showEditModal = true;
                  ">
                  <AppIcon name="ph:pencil-simple" />
                  {{ $t('playlists.editPlaylist') }}
                </button>
                <button
                  v-if="isOwner"
                  class="playlist-page__dropdown-item"
                  @click="
                    showMobileMenu = false;
                    showCollaboratorModal = true;
                  ">
                  <AppIcon name="ph:users" />
                  Kollaborátorok
                </button>
                <button
                  class="playlist-page__dropdown-item playlist-page__dropdown-item--danger"
                  :disabled="isDeleting"
                  @click="
                    showMobileMenu = false;
                    showDeleteConfirm = true;
                  ">
                  <AppIcon name="ph:trash" />
                  {{ $t('playlists.deletePlaylist') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </template>

      <template #skeleton-center-header>
        <div style="width: 100%; max-width: 400px; display: flex">
          <AppSkeleton width="100%" height="44px" border-radius="var(--radius-full)" />
        </div>
      </template>

      <template #skeleton-tracks>
        <AppTrackList
          :is-loading="true"
          :columns="['index', 'title', 'date', 'time', 'download', 'action']"
          :show-thumbnails="true" />
      </template>

      <template #tracks>
        <template v-if="trackCount === 0 && !isLoading && !debouncedSearch">
          <div class="music-page__empty">
            <AppIcon
              name="ph:music-notes-simple-duotone"
              class="music-page__empty-icon"
              size="4rem" />
            <p>{{ $t('playlists.emptyPlaylist') }}</p>
            <NuxtLink to="/" class="music-page__empty-btn">
              {{ $t('playlists.discover') }}
            </NuxtLink>
          </div>
        </template>
        <template v-else>
          <div v-if="trackCount === 0 && debouncedSearch" class="music-page__empty">
            <AppIcon name="ph:magnifying-glass" class="music-page__empty-icon" size="4rem" />
            <p>{{ $t('search.page.noResultsQuery', { query: debouncedSearch }) }}</p>
          </div>

          <div v-else :ref="setContainerRef">
            <AppTrackList
              :virtual="true"
              :visible-items="mappedVisibleItems"
              :offset-y="offsetY"
              :total-height="totalHeight"
              :columns="['index', 'title', 'date', 'time', 'download', 'action']"
              :show-thumbnails="true"
              :sort-by="sortBy"
              :sort-order="sortOrder"
              :reorderable="isReorderable"
              @play="onPlaySong"
              @remove="removeTrackWrapper"
              @sort="onSort"
              @reorder="(from, to) => store.reorderTrack(id, from, to)" />
          </div>
        </template>
      </template>
    </AppMusicPage>

    <PlaylistModal
      v-if="playlist"
      :open="showEditModal"
      :edit-id="id"
      :initial-name="playlist.name"
      :initial-description="playlist.description"
      :initial-image-url="playlist.imageUrl"
      @saved="refresh()"
      @close="showEditModal = false"
      @created="showEditModal = false" />

    <CollaboratorModal
      v-if="playlist && isOwner"
      v-model="showCollaboratorModal"
      :playlist-id="id"
      :collaborators="playlist.collaborators || []"
      @saved="refresh()" />

    <ClientOnly>
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showDeleteConfirm"
            class="playlist-page__confirm-overlay"
            @click.self="!isDeleting && (showDeleteConfirm = false)">
            <div class="playlist-page__confirm-dialog">
              <h3>{{ $t('playlists.deletePlaylist') }}</h3>
              <p>{{ $t('playlists.confirmDelete') }}</p>
              <div class="playlist-page__confirm-actions">
                <button
                  class="playlist-page__confirm-btn playlist-page__confirm-btn--ghost"
                  :disabled="isDeleting"
                  @click="showDeleteConfirm = false">
                  {{ $t('core.actions.cancel') }}
                </button>
                <button
                  class="playlist-page__confirm-btn playlist-page__confirm-btn--danger"
                  :disabled="isDeleting"
                  @click="onDelete">
                  <AppSpinner v-if="isDeleting" size="sm" />
                  <span>{{ isDeleting ? $t('playlists.deleting') : $t('playlists.delete') }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<style scoped lang="scss">
.playlist-page {
  height: 100%;

  &__description {
    max-width: 500px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &--danger:hover {
      color: hsl(0, 65%, 55%);
    }
  }

  &__actions-desktop {
    display: flex;
    align-items: center;
    gap: inherit;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__actions-mobile {
    display: none;
    align-items: center;
    gap: inherit;

    @media (max-width: 768px) {
      display: flex;
    }
  }

  &__more-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__dropdown-overlay {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: transparent;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    z-index: 100;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-2);
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  &__dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-surface-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--danger {
      color: hsl(0, 65%, 65%);

      &:hover {
        background: color-mix(in srgb, hsl(0, 65%, 50%) 15%, transparent);
        color: hsl(0, 65%, 65%);
      }
    }

    svg {
      font-size: 1.25rem;
    }
  }

  &__confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 1000);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
  }

  &__confirm-dialog {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    max-width: 400px;
    width: 100%;
    margin: var(--space-4);

    h3 {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-bold);
      margin-bottom: var(--space-3);
    }

    p {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      margin-bottom: var(--space-6);
    }
  }

  &__confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
  }

  &__confirm-btn {
    padding: var(--space-2) var(--space-6);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--ghost {
      background: transparent;
      color: var(--color-text-secondary);

      &:hover {
        color: var(--color-text-primary);
      }
    }

    &--danger {
      background: hsl(0, 65%, 50%);
      color: #fff;
      --spinner-color: currentColor;

      &:hover {
        background: hsl(0, 65%, 60%);
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

  &__inline-loader {
    font-size: 1.5rem;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.artist-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    text-decoration: underline;
    color: var(--color-text-primary);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}
</style>
