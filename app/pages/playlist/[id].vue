<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type { PlaylistDetail, PlaylistTrack } from '@/features/playlists/types/playlists.types';
import type { TrackListItem } from '@/components/shared/AppTrackList.vue';

definePageMeta({
  layout: 'music'
});

const CHUNK_SIZE = 50;
const ITEM_HEIGHT = 57;

const route = useRoute();
const id = computed(() => route.params.id as string);

const store = usePlaylistsStore();
const player = usePlayer();

const playlist = ref<PlaylistDetail | null>(null);
const isLoading = ref(true);
const isDeleting = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);

const { data, status, refresh } = await useAsyncData<PlaylistDetail | null>(
  () => `playlist-${id.value}`,
  async () => {
    if (!id.value) return null;
    return await store.fetchDetail(id.value, { limit: CHUNK_SIZE, offset: 0 });
  },
  {
    lazy: true,
    watch: [id]
  }
);

watchEffect(() => {
  if (data.value) {
    playlist.value = data.value;
  }
  isLoading.value = status.value === 'pending';
});

const trackCount = computed(() => playlist.value?.trackCount ?? 0);

async function fetchChunk(offset: number, limit: number): Promise<PlaylistTrack[]> {
  if (!id.value) return [];
  const result = await store.fetchDetail(id.value, { limit, offset });
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

useHead({
  title: computed(() => playlist.value?.name || 'Playlist')
});

const isCurrentPlaylistPlaying = computed(() => {
  if (!playlist.value || virtualTracks.value.length === 0) return false;
  if (!player.isPlaying.value) return false;
  return virtualTracks.value.some(
    (t) => t !== null && t.videoId === player.currentTrack.value?.videoId
  );
});

function playAll(): void {
  const loadedTracks = virtualTracks.value.filter((t): t is PlaylistTrack => t !== null);
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
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

  player.playQueue(tracksToPlay, 0);
}

function onPlaySong(track: TrackListItem, index: number): void {
  const loadedTracks = virtualTracks.value.filter((t): t is PlaylistTrack => t !== null);
  const tracksToPlay = loadedTracks.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    artists: [],
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

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
      :disable-play-button="trackCount === 0"
      @play-all="playAll"
      @scroll="onScroll">
      <template #meta>
        <span
          v-if="playlist?.description && typeof playlist.description === 'string'"
          class="playlist-page__description">
          {{ playlist.description }}
        </span>
        <span v-if="playlist?.description && typeof playlist.description === 'string'">•</span>
        <span class="playlist-page__count">
          {{ $t('playlists.trackCount', { count: playlist?.trackCount ?? 0 }) }}
        </span>
      </template>

      <template #sticky-subtitle>
        {{ $t('playlists.trackCount', { count: playlist?.trackCount ?? 0 }) }}
      </template>

      <template #sticky-actions>
        <button
          class="playlist-page__action-btn"
          :title="$t('playlists.editPlaylist')"
          @click="showEditModal = true">
          <AppIcon name="ph:pencil-simple" />
        </button>
        <button
          class="playlist-page__action-btn playlist-page__action-btn--danger"
          :title="$t('playlists.deletePlaylist')"
          :disabled="isDeleting"
          @click="showDeleteConfirm = true">
          <AppIcon name="ph:trash" />
        </button>
      </template>

      <template #actions>
        <button
          class="playlist-page__action-btn"
          :title="$t('playlists.editPlaylist')"
          @click="showEditModal = true">
          <AppIcon name="ph:pencil-simple" />
        </button>
        <button
          class="playlist-page__action-btn playlist-page__action-btn--danger"
          :title="$t('playlists.deletePlaylist')"
          :disabled="isDeleting"
          @click="showDeleteConfirm = true">
          <AppIcon name="ph:trash" />
        </button>
      </template>

      <template #tracks>
        <template v-if="trackCount === 0 && !isLoading">
          <div class="music-page__empty">
            <AppIcon name="ph:music-notes-simple-duotone" class="music-page__empty-icon" />
            <p>{{ $t('playlists.emptyPlaylist') }}</p>
            <NuxtLink to="/" class="music-page__empty-btn">
              {{ $t('playlists.discover') }}
            </NuxtLink>
          </div>
        </template>
        <template v-else>
          <div :ref="setContainerRef">
            <AppTrackList
              :virtual="true"
              :visible-items="mappedVisibleItems"
              :offset-y="offsetY"
              :total-height="totalHeight"
              :columns="['index', 'title', 'date', 'time', 'action']"
              :show-thumbnails="true"
              @play="onPlaySong"
              @remove="removeTrackWrapper" />
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
      --spinner-color: inherit;

      &:hover {
        background: hsl(0, 65%, 60%);
      }
    }
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
</style>
