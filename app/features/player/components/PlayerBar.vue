<script setup lang="ts">
const player = usePlayer();
const audioEl = ref<HTMLAudioElement | null>(null);

const isHydrated = ref(false);

const displayTrack = computed(() => (isHydrated.value ? player.currentTrack.value : null));
const displayVolume = computed(() => (isHydrated.value ? player.volume.value : 1));
const displayTime = computed(() => (isHydrated.value ? player.currentTimeSeconds.value : 0));
const displayDuration = computed(() => (isHydrated.value ? player.durationSeconds.value : 0));

onMounted(() => {
  isHydrated.value = true;
  onNuxtReady(() => {
    if (audioEl.value) {
      player.bindAudio(audioEl.value);
    }
  });
});

const showAddToPlaylist = ref(false);
const playlistBtnRef = ref<HTMLElement | null>(null);
const playlistsStore = usePlaylistsStore();

const isInAnyPlaylist = computed(() => {
  return player.currentTrack.value
    ? playlistsStore.isTrackInAnyPlaylist(player.currentTrack.value.videoId)
    : false;
});

const previousVolume = ref(1);

const volumeIcon = computed(() => {
  if (displayVolume.value === 0) return 'ph:speaker-slash-fill';
  if (displayVolume.value < 0.3) return 'ph:speaker-low-fill';
  if (displayVolume.value < 0.7) return 'ph:speaker-high-fill';
  return 'ph:speaker-high-fill';
});

function toggleMute() {
  if (displayVolume.value > 0) {
    previousVolume.value = displayVolume.value;
    player.setVolume(0);
  } else {
    player.setVolume(previousVolume.value);
  }
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function onSeekInput(event: Event) {
  const input = event.target as HTMLInputElement;
  player.seek(parseFloat(input.value));
}

function onVolumeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  player.setVolume(parseFloat(input.value));
}
</script>

<template>
  <div>
    <audio ref="audioEl" preload="metadata" playsinline />
    <aside class="player-bar" :aria-label="$t('player.playerBar')">
      <div class="player-bar__left">
        <div class="player-bar__artwork">
          <img
            v-if="displayTrack?.thumbnailUrl"
            :src="`/api/image?url=${encodeURIComponent(displayTrack.thumbnailUrl)}`"
            :alt="displayTrack?.title"
            class="player-bar__img" />
          <AppSkeleton v-else-if="!isHydrated" width="100%" height="100%" />
          <AppIcon v-else name="ph:music-notes-simple" class="player-bar__img-placeholder" />
        </div>
        <div v-if="displayTrack" class="player-bar__info">
          <span class="player-bar__title">{{ displayTrack.title }}</span>
          <span class="player-bar__artist">{{ displayTrack.artist }}</span>
        </div>
        <div v-else-if="!isHydrated" class="player-bar__info player-bar__info--skeleton">
          <AppSkeleton height="12px" width="120px" border-radius="var(--radius-sm)" />
          <AppSkeleton height="10px" width="80px" border-radius="var(--radius-sm)" />
        </div>
        <div v-else class="player-bar__info player-bar__info--empty">
          <span class="player-bar__title">{{ $t('player.noTrack') }}</span>
          <span class="player-bar__artist">{{ $t('player.startSomething') }}</span>
        </div>
        <ClientOnly>
          <button
            ref="playlistBtnRef"
            class="player-bar__add-btn"
            :disabled="!displayTrack"
            :aria-label="$t('playlists.addToPlaylist')"
            @click="showAddToPlaylist = !showAddToPlaylist">
            <AppIcon v-if="isInAnyPlaylist" name="ph:check-circle-fill" class="text-success" />
            <AppIcon v-else name="ph:plus-circle" />
          </button>
          <template #fallback>
            <AppSkeleton width="20px" height="20px" border-radius="var(--radius-full)" />
          </template>
        </ClientOnly>
      </div>

      <div class="player-bar__center">
        <div class="player-bar__controls">
          <button
            class="player-bar__btn player-bar__btn--secondary"
            :class="{ 'player-bar__btn--active': isHydrated ? player.isShuffle.value : false }"
            :disabled="!displayTrack"
            :aria-label="$t('player.shuffle') || 'Shuffle'"
            @click="player.toggleShuffle()">
            <AppIcon name="ph:shuffle" />
          </button>

          <button
            class="player-bar__btn player-bar__btn--secondary"
            :disabled="!displayTrack"
            :aria-label="$t('player.prev')"
            @click="player.playPrev()">
            <AppIcon name="ph:skip-back-fill" />
          </button>

          <ClientOnly>
            <button
              class="player-bar__btn player-bar__btn--play"
              :disabled="!displayTrack"
              :aria-label="player.isPlaying.value ? $t('player.pause') : $t('player.play')"
              @click="player.togglePlay()">
              <AppSpinner v-if="player.isLoading.value" size="sm" />
              <AppIcon v-else-if="player.isPlaying.value" name="ph:pause-fill" />
              <AppIcon v-else name="ph:play-fill" />
            </button>
            <template #fallback>
              <AppSkeleton
                width="40px"
                height="40px"
                border-radius="var(--radius-full)"
                style="flex-shrink: 0" />
            </template>
          </ClientOnly>

          <button
            class="player-bar__btn player-bar__btn--secondary"
            :disabled="isHydrated ? !player.hasNext.value || !player.currentTrack.value : true"
            :aria-label="$t('player.next')"
            @click="player.playNext()">
            <AppIcon name="ph:skip-forward-fill" />
          </button>

          <button
            class="player-bar__btn player-bar__btn--secondary"
            :class="{
              'player-bar__btn--active': isHydrated ? player.repeatMode.value !== 'off' : false
            }"
            :disabled="!displayTrack"
            :aria-label="$t('player.repeat') || 'Repeat'"
            @click="player.toggleRepeat()">
            <AppIcon :name="player.repeatMode.value === 'one' ? 'ph:repeat-once' : 'ph:repeat'" />
          </button>
        </div>

        <div class="player-bar__progress">
          <span class="player-bar__time" data-allow-mismatch>
            {{ formatTime(displayTime) }}
          </span>
          <input
            v-if="displayTrack"
            id="player-seek"
            class="player-bar__slider player-bar__slider--seek"
            type="range"
            min="0"
            :max="displayDuration || 1"
            :value="displayTime"
            :disabled="!displayTrack"
            step="1"
            :aria-label="$t('player.seek')"
            :style="{
              '--progress': (displayTime / (displayDuration || 1)) * 100 + '%'
            }"
            data-allow-mismatch
            @input="onSeekInput" />
          <AppSkeleton v-else height="4px" class="player-bar__slider--seek" />
          <span class="player-bar__time" data-allow-mismatch>
            {{ formatTime(displayDuration) }}
          </span>
        </div>
      </div>

      <div class="player-bar__right">
        <button
          class="player-bar__btn"
          style="width: auto; height: auto"
          :aria-label="$t('player.mute')"
          @click="toggleMute">
          <ClientOnly>
            <AppIcon :name="volumeIcon" class="player-bar__volume-icon" />
            <template #fallback>
              <AppIcon name="ph:speaker-high-fill" class="player-bar__volume-icon" />
            </template>
          </ClientOnly>
        </button>
        <input
          v-if="displayTrack"
          id="player-volume"
          class="player-bar__slider player-bar__slider--volume"
          type="range"
          min="0"
          max="1"
          :value="displayVolume"
          step="0.01"
          :aria-label="$t('player.volume')"
          :style="{ '--progress': displayVolume * 100 + '%' }"
          data-allow-mismatch
          @input="onVolumeInput" />
        <AppSkeleton v-else height="4px" width="100px" class="player-bar__slider--volume" />
      </div>
    </aside>

    <AddToPlaylistPopup
      v-if="showAddToPlaylist && displayTrack"
      :track="{
        videoId: displayTrack.videoId,
        title: displayTrack.title,
        artist: displayTrack.artist,
        thumbnailUrl: displayTrack.thumbnailUrl,
        durationMs: displayDuration * 1000
      }"
      :anchor="playlistBtnRef"
      @close="showAddToPlaylist = false" />
  </div>
</template>

<style lang="scss" scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-player);
  display: grid;
  grid-template-areas: 'left center right';
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-6);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  height: var(--player-height, 90px);

  &__left {
    grid-area: left;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__center {
    grid-area: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  &__right {
    grid-area: right;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    min-width: 0;
  }

  &__artwork {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__img-placeholder {
    font-size: var(--text-xl);
    color: var(--color-text-secondary);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    &--empty {
      justify-content: center;
      gap: 2px;
    }

    &--skeleton {
      justify-content: center;
      gap: 6px;
    }
  }

  .skeleton-box {
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
    border-radius: inherit;
  }

  .skeleton-line {
    background: var(--color-surface-raised);
    height: 10px;
    border-radius: var(--radius-sm);
    animation: pulse 1.5s infinite ease-in-out;

    &--title {
      width: 120px;
      height: 12px;
    }

    &--artist {
      width: 80px;
      height: 10px;
      opacity: 0.7;
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

  &__title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
  }

  &__add-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--text-2xl);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      color var(--transition-fast),
      transform var(--transition-fast);
    padding: var(--space-1);

    &:hover {
      color: var(--color-primary);
      transform: scale(1.1);
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: var(--text-xl);
    transition:
      color var(--transition-fast),
      transform var(--transition-fast);

    &:hover:not(:disabled) {
      color: var(--color-text-primary);
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--active {
      color: var(--color-primary);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--color-primary);
      }
    }

    &--play {
      width: 40px;
      height: 40px;
      font-size: var(--text-xl);
      background: var(--color-text-primary);
      color: var(--color-bg);
      border-radius: var(--radius-full);
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: var(--color-text-secondary);
        color: var(--color-bg);
        transform: scale(1.05);
      }
    }
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
  }

  &__time {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
    min-width: 36px;
    text-align: center;
  }

  &__volume-icon {
    color: var(--color-text-secondary);
    font-size: var(--text-base);
    flex-shrink: 0;
  }

  &__slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-surface-hover);
    outline: none;
    cursor: pointer;

    &--seek {
      flex: 1;
    }

    &--volume {
      width: 100px;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
      background: var(--color-text-primary);
      cursor: pointer;
      margin-top: -4px;
      transition: transform var(--transition-fast);
    }

    &:hover::-webkit-slider-thumb {
      transform: scale(1.2);
    }

    &::-webkit-slider-runnable-track {
      background: linear-gradient(
        to right,
        var(--color-primary) var(--progress, 0%),
        #535353 var(--progress, 0%)
      );
      border-radius: var(--radius-full);
      height: 4px;
    }

    &:hover {
      &::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--color-primary-hover) var(--progress, 0%),
          #666 var(--progress, 0%)
        );
      }
    }
  }

  @media (max-width: 800px) {
    grid-template-areas:
      'left controls right'
      'progress progress progress';
    grid-template-columns: 1.5fr auto 1fr;
    grid-template-rows: auto auto;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    height: auto;
    min-height: 80px;

    &__center {
      display: contents;
    }

    &__controls {
      grid-area: controls;
      gap: var(--space-2);

      .player-bar__btn {
        width: 24px;
        height: 24px;
        font-size: var(--text-base);
      }
      .player-bar__btn--play {
        width: 32px;
        height: 32px;
        font-size: var(--text-lg);
      }
    }

    &__progress {
      grid-area: progress;
      margin-top: 4px;
    }

    &__right {
      gap: var(--space-1);
    }

    &__slider--volume {
      width: 50px;
    }

    &__artwork {
      width: 40px;
      height: 40px;
    }

    &__title {
      font-size: var(--text-xs);
    }

    &__artist {
      font-size: 10px;
    }

    &__time {
      font-size: 10px;
      min-width: 28px;
    }
  }
}

.text-success {
  color: hsl(140, 60%, 50%) !important;
}
</style>
