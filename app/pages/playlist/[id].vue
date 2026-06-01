<script setup lang="ts">
import type { PlaylistDetail, MusicTrack } from '@/features/playlists/types/playlists.types';

definePageMeta({
  layout: 'music'
});

const PAGE_SIZE = 50;

const route = useRoute();
const id = computed(() => route.params.id as string);

const store = usePlaylistsStore();
const player = usePlayer();

const playlist = ref<PlaylistDetail | null>(null);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const isDeleting = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);

const { data, status } = await useAsyncData<PlaylistDetail | null>(
  () => `playlist-${id.value}`,
  async () => {
    if (!id.value) return null;
    return await store.fetchDetail(id.value, { limit: PAGE_SIZE, offset: 0 });
  },
  {
    lazy: true,
    watch: [id]
  }
);

watchEffect(() => {
  playlist.value = data.value ?? null;
  isLoading.value = status.value === 'pending';
});

const hasMoreTracks = computed(() => {
  if (!playlist.value) return false;
  return playlist.value.tracks.length < playlist.value.trackCount;
});

const mappedTracks = computed<MusicTrack[]>(() => {
  if (!playlist.value) return [];
  return playlist.value.tracks.map((t) => ({
    id: t.videoId,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000),
    isPlaying: player.currentTrack.value?.videoId === t.videoId
  }));
});

async function loadMoreTracks(): Promise<void> {
  if (!playlist.value || isLoadingMore.value || !hasMoreTracks.value) return;

  isLoadingMore.value = true;
  try {
    const nextPage = await store.fetchDetail(id.value, {
      limit: PAGE_SIZE,
      offset: playlist.value.tracks.length
    });

    if (!nextPage || nextPage.tracks.length === 0) return;

    playlist.value = {
      ...nextPage,
      tracks: [...playlist.value.tracks, ...nextPage.tracks]
    };
  } finally {
    isLoadingMore.value = false;
  }
}

useHead({
  title: computed(() => playlist.value?.name || 'Playlist')
});

const isCurrentPlaylistPlaying = computed(() => {
  if (!playlist.value || playlist.value.tracks.length === 0) return false;
  if (!player.isPlaying.value) return false;
  return playlist.value.tracks.some((t) => t.videoId === player.currentTrack.value?.videoId);
});

function playAll(): void {
  if (!playlist.value || playlist.value.tracks.length === 0) return;

  if (
    isCurrentPlaylistPlaying.value ||
    (player.currentTrack.value &&
      playlist.value.tracks.some((t) => t.videoId === player.currentTrack.value?.videoId))
  ) {
    player.togglePlay();
    return;
  }

  const tracksToPlay = playlist.value.tracks.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

  player.playQueue(tracksToPlay, 0);
}

function onPlaySong(track: MusicTrack, index: number): void {
  if (!playlist.value) return;

  const tracksToPlay = playlist.value.tracks.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

  const resolvedIndex = playlist.value.tracks.findIndex((item) => item.videoId === track.id);
  player.playQueue(tracksToPlay, resolvedIndex >= 0 ? resolvedIndex : index);
}

async function removeTrack(videoId: string): Promise<void> {
  await store.removeTrack(id.value, videoId);
  if (playlist.value) {
    playlist.value.tracks = playlist.value.tracks.filter((t) => t.videoId !== videoId);
  }
}

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
    <AppMusicDetailView
      :is-loading="isLoading"
      :is-error="!playlist && !isLoading"
      :title="playlist?.name"
      :badge="$t('playlists.myPlaylist')"
      :image-url="playlist?.imageUrl"
      :tracks="mappedTracks"
      :has-more-tracks="hasMoreTracks"
      :is-loading-more="isLoadingMore"
      :empty-text="$t('playlists.emptyPlaylist')"
      @play="onPlaySong"
      @load-more="loadMoreTracks">
      <template #meta>
        <span v-if="playlist?.description" class="playlist-page__description">
          {{ playlist.description }}
        </span>
        <span v-if="playlist?.description">•</span>
        <span class="playlist-page__count">
          {{
            $t('playlists.trackCount', {
              count: playlist?.trackCount || playlist?.tracks.length || 0
            })
          }}
        </span>
      </template>

      <template #skeleton-actions>
        <div class="skeleton-btn"></div>
        <div class="skeleton-btn"></div>
      </template>

      <template #actions>
        <button
          class="playlist-page__play-btn"
          :disabled="!playlist || playlist.tracks.length === 0"
          :aria-label="$t('player.play')"
          @click="playAll">
          <AppIcon v-if="isCurrentPlaylistPlaying" name="ph:pause-fill" />
          <AppIcon v-else name="ph:play-fill" />
        </button>

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

      <template #track-actions="{ track }">
        <button
          class="playlist-page__track-remove"
          :title="$t('playlists.removeFromPlaylist')"
          @click.stop="removeTrack(track.id)">
          <AppIcon name="ph:x-bold" />
        </button>
      </template>
    </AppMusicDetailView>

    <PlaylistModal
      v-if="playlist"
      :open="showEditModal"
      :edit-id="id"
      :initial-name="playlist.name"
      :initial-description="playlist.description"
      :initial-image-url="playlist.imageUrl"
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
  &__description {
    max-width: 500px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: #000;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    transition: all var(--transition-fast);

    &:hover:not(:disabled) {
      transform: scale(1.05);
      background-color: var(--color-primary-hover);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
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

  &__track-remove {
    opacity: 0;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--text-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      opacity var(--transition-fast),
      color var(--transition-fast);
    padding: 0;

    &:hover {
      color: hsl(0, 65%, 55%);
    }
  }

  :deep(.music-detail__track:hover) .playlist-page__track-remove {
    opacity: 1;
  }

  .skeleton-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.5;
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

      &:hover {
        background: hsl(0, 65%, 60%);
      }
    }
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
