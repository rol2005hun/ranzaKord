<script setup lang="ts">
import type { PlaylistDetail } from '@/features/playlists/types/playlists.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = computed(() => route.params.id as string);

const store = usePlaylistsStore();
const player = usePlayer();

const playlist = ref<PlaylistDetail | null>(null);
const isLoading = ref(true);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);

const { status } = await useAsyncData(`playlist-${id.value}`, async () => {
  if (!id.value) return null;
  const result = await store.fetchDetail(id.value);
  if (result) {
    playlist.value = result;
  }
  return result;
});

watchEffect(() => {
  isLoading.value = status.value === 'pending';
});

useHead({
  title: computed(() => playlist.value?.name || 'Playlist')
});

function playAll(): void {
  if (!playlist.value || playlist.value.tracks.length === 0) return;

  const tracksToPlay = playlist.value.tracks.map((t) => ({
    videoId: t.videoId,
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: Math.round(t.durationMs / 1000)
  }));

  player.playQueue(tracksToPlay, 0);
}

async function removeTrack(videoId: string): Promise<void> {
  await store.removeTrack(id.value, videoId);
  if (playlist.value) {
    playlist.value.tracks = playlist.value.tracks.filter((t) => t.videoId !== videoId);
  }
}

async function onDelete(): Promise<void> {
  await store.remove(id.value);
  navigateTo('/');
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
</script>

<template>
  <div class="playlist-page">
    <div v-if="isLoading" class="playlist-page__skeleton">
      <div class="playlist-page__header">
        <div class="playlist-page__cover skeleton-box"></div>
        <div class="playlist-page__meta">
          <div class="skeleton-line skeleton-line--type"></div>
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--desc"></div>
        </div>
      </div>
      <div class="playlist-page__actions">
        <div class="skeleton-btn skeleton-btn--play"></div>
        <div class="skeleton-btn"></div>
        <div class="skeleton-btn"></div>
      </div>
      <div class="playlist-page__tracks">
        <div class="playlist-page__track-header">
          <div class="skeleton-line" style="width: 100%; margin: 0"></div>
        </div>
        <div
          v-for="i in 5"
          :key="`track-skel-${i}`"
          class="playlist-page__track"
          style="cursor: default">
          <div class="skeleton-line" style="width: 1rem; margin: 0 auto"></div>
          <div class="playlist-page__track-info">
            <div class="playlist-page__track-thumb skeleton-box"></div>
            <div class="playlist-page__track-text">
              <div class="skeleton-line skeleton-line--track-title"></div>
              <div class="skeleton-line skeleton-line--artist"></div>
            </div>
          </div>
          <div class="skeleton-line" style="width: 2rem; margin-left: auto"></div>
          <div></div>
        </div>
      </div>
    </div>

    <div v-else-if="!playlist" class="playlist-page__error">
      <AppIcon name="ph:warning-circle" class="playlist-page__error-icon" />
      <p>Playlist not found.</p>
    </div>

    <template v-else>
      <div class="playlist-page__header">
        <div class="playlist-page__cover">
          <NuxtImg
            v-if="playlist.imageUrl"
            :src="playlist.imageUrl"
            :alt="playlist.name"
            width="200"
            height="200"
            format="webp"
            fetchpriority="high"
            preload />
          <div v-else class="playlist-page__cover-placeholder">
            <AppIcon name="ph:music-notes-fill" />
          </div>
        </div>

        <div class="playlist-page__meta">
          <span class="playlist-page__type">{{ $t('playlists.title').slice(0, -1) }}</span>
          <h1 class="playlist-page__title">{{ playlist.name }}</h1>
          <p v-if="playlist.description" class="playlist-page__description">
            {{ playlist.description }}
          </p>
          <p class="playlist-page__count">
            {{ $t('playlists.trackCount', { count: playlist.tracks.length }) }}
          </p>
        </div>
      </div>

      <div class="playlist-page__actions">
        <button
          class="playlist-page__play-btn"
          :disabled="playlist.tracks.length === 0"
          :aria-label="$t('player.play')"
          @click="playAll">
          <AppIcon name="ph:play-fill" />
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
          @click="showDeleteConfirm = true">
          <AppIcon name="ph:trash" />
        </button>
      </div>

      <div v-if="playlist.tracks.length === 0" class="playlist-page__empty">
        <AppIcon name="ph:music-notes-plus" class="playlist-page__empty-icon" />
        <p>{{ $t('playlists.emptyPlaylist') }}</p>
      </div>

      <div v-else class="playlist-page__tracks">
        <div class="playlist-page__track-header">
          <span class="playlist-page__track-num">#</span>
          <span>Title</span>
          <span class="playlist-page__track-duration">
            <AppIcon name="ph:clock" />
          </span>
        </div>

        <div
          v-for="(track, index) in playlist.tracks"
          :key="track.videoId"
          class="playlist-page__track"
          @click="
            player.playQueue(
              playlist.tracks.map((t) => ({
                videoId: t.videoId,
                title: t.title,
                artist: t.artist,
                thumbnailUrl: t.thumbnailUrl,
                durationSeconds: Math.round(t.durationMs / 1000)
              })),
              index
            )
          ">
          <div class="playlist-page__track-num-wrapper">
            <ClientOnly>
              <div style="display: contents">
                <span
                  class="playlist-page__track-num"
                  :class="{
                    'playlist-page__track-num--playing':
                      player.currentTrack.value?.videoId === track.videoId
                  }">
                  <AppIcon
                    v-if="
                      player.currentTrack.value?.videoId === track.videoId && player.isPlaying.value
                    "
                    name="ph:speaker-high-fill"
                    class="text-primary" />
                  <template v-else>{{ index + 1 }}</template>
                </span>
                <div class="playlist-page__track-play">
                  <AppIcon
                    :name="
                      player.currentTrack.value?.videoId === track.videoId && player.isPlaying.value
                        ? 'ph:pause-fill'
                        : 'ph:play-fill'
                    " />
                </div>
              </div>
              <template #fallback>
                <span class="playlist-page__track-num">{{ index + 1 }}</span>
              </template>
            </ClientOnly>
          </div>
          <div class="playlist-page__track-info">
            <div class="playlist-page__track-thumb">
              <img
                v-if="track.thumbnailUrl"
                :src="`/api/image?url=${encodeURIComponent(track.thumbnailUrl)}`"
                :alt="track.title" />
              <AppIcon v-else name="ph:music-note" />
            </div>
            <div class="playlist-page__track-text">
              <span class="playlist-page__track-title">{{ track.title }}</span>
              <span class="playlist-page__track-artist">{{ track.artist }}</span>
            </div>
          </div>
          <span class="playlist-page__track-duration">{{ formatDuration(track.durationMs) }}</span>
          <button
            class="playlist-page__track-remove"
            :title="$t('playlists.removeFromPlaylist')"
            :aria-label="$t('playlists.removeFromPlaylist')"
            @click.stop="removeTrack(track.videoId)">
            <AppIcon name="ph:x-bold" />
          </button>
        </div>
      </div>
    </template>

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
            @click.self="showDeleteConfirm = false">
            <div class="playlist-page__confirm-dialog">
              <h3>{{ $t('playlists.deletePlaylist') }}</h3>
              <p>{{ $t('playlists.confirmDelete') }}</p>
              <div class="playlist-page__confirm-actions">
                <button
                  class="playlist-page__confirm-btn playlist-page__confirm-btn--ghost"
                  @click="showDeleteConfirm = false">
                  Cancel
                </button>
                <button
                  class="playlist-page__confirm-btn playlist-page__confirm-btn--danger"
                  @click="onDelete">
                  Delete
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
  max-width: 1200px;
  margin: 0 auto;

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--space-4);
    color: var(--color-text-secondary);
  }

  &__error-icon {
    font-size: 3rem;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-8) var(--space-8) var(--space-6);
    background: linear-gradient(to bottom, var(--color-surface), transparent);

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
      padding: var(--space-4);
    }
  }

  .skeleton-box {
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
    border-radius: var(--radius-lg);
  }

  .skeleton-line {
    background: var(--color-surface-raised);
    height: 12px;
    border-radius: var(--radius-sm);
    animation: pulse 1.5s infinite ease-in-out;
    margin-bottom: var(--space-2);

    &--type {
      width: 60px;
      height: 10px;
      margin-bottom: var(--space-3);
    }
    &--title {
      width: 200px;
      height: 32px;
      margin-bottom: var(--space-4);
    }
    &--desc {
      width: 300px;
    }
    &--track-title {
      width: 140px;
      margin-bottom: 4px;
    }
    &--artist {
      width: 90px;
      height: 10px;
    }
  }

  .skeleton-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;

    &--play {
      width: 56px;
      height: 56px;
    }
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

  &__cover {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-hover);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: 600px) {
      width: 140px;
      height: 140px;
    }
  }

  &__cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: var(--color-text-secondary);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  &__type {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-secondary);
  }

  &__title {
    font-size: clamp(var(--text-3xl), 5vw, 4rem);
    font-weight: var(--font-weight-black);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  &__description {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    max-width: 500px;
  }

  &__count {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-8);
  }

  &__play-btn {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: #000;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-2xl);
    transition:
      transform var(--transition-fast),
      opacity var(--transition-fast);

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__action-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--color-text-secondary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xl);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
    }

    &--danger:hover {
      color: hsl(0, 65%, 55%);
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-12) 0;
    gap: var(--space-3);
    color: var(--color-text-secondary);
  }

  &__empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  &__tracks {
    padding: 0 var(--space-8) var(--space-8);

    @media (max-width: 600px) {
      padding: 0 var(--space-3) var(--space-6);
    }
  }

  &__track-header {
    display: grid;
    grid-template-columns: 2rem 1fr 4rem 2rem;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__track {
    display: grid;
    grid-template-columns: 2rem 1fr 4rem 2rem;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);

    &:hover {
      background: var(--color-surface-hover);

      .playlist-page__track-remove {
        opacity: 1;
      }

      .playlist-page__track-num {
        opacity: 0;
      }

      .playlist-page__track-play {
        opacity: 1;
      }
    }
  }

  &__track-num-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__track-num {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);

    &--playing {
      color: var(--color-primary);
    }
  }

  &__track-play {
    position: absolute;
    opacity: 0;
    color: var(--color-text-primary);
    font-size: var(--text-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);
  }

  &__track-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__track-thumb {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__track-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__track-title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track-artist {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track-duration {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-align: right;
    font-variant-numeric: tabular-nums;
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
