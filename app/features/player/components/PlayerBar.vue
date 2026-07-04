<script setup lang="ts">
const player = usePlayer();
const audioEl1 = ref<HTMLAudioElement | null>(null);
const audioEl2 = ref<HTMLAudioElement | null>(null);
const layoutStore = useLayoutStore();
const { lyricsData, isLoading: lyricsLoading, fetchLyrics, getActiveLine } = useLyrics();

const isHydrated = ref(false);

const isTauri = computed(
  () => isHydrated.value && typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
);

const isDesktopTauri = computed(
  () =>
    isTauri.value &&
    typeof navigator !== 'undefined' &&
    !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
);

const displayTrack = computed(() => (isHydrated.value ? player.currentTrack.value : null));
const displayVolume = computed(() => (isHydrated.value ? player.volume.value : 1));
const isDraggingSeek = ref(false);
const localSeekTime = ref(0);

const displayTime = computed(() => {
  if (isDraggingSeek.value) return localSeekTime.value;
  return isHydrated.value ? player.currentTimeSeconds.value : 0;
});
const displayDuration = computed(() => (isHydrated.value ? player.durationSeconds.value : 0));

onMounted(() => {
  isHydrated.value = true;
  onNuxtReady(() => {
    if (audioEl1.value && audioEl2.value) {
      player.bindAudio(audioEl1.value, audioEl2.value);
    }
  });
});

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

const isLyricsActive = computed(
  () =>
    isHydrated.value && layoutStore.isRightSidebarOpen && layoutStore.rightSidebarMode === 'lyrics'
);

watch(
  displayTrack,
  (track) => {
    if (track) fetchLyrics(track);
  },
  { immediate: true }
);

const mobileLyricsListRef = ref<HTMLElement | null>(null);
const mobileActiveLine = computed(() => getActiveLine(displayTime.value));
const syncedLines = computed(() => lyricsData.value?.synced ?? []);
const plainLyrics = computed(() => lyricsData.value?.plain ?? null);
const hasSyncedLyrics = computed(() => syncedLines.value.length > 0);
const hasAnyLyrics = computed(() => hasSyncedLyrics.value || !!plainLyrics.value);

let mobileAutoScroll = true;
const { start: startMobileScrollTimer, stop: stopMobileScrollTimer } = useTimeoutFn(
  () => {
    mobileAutoScroll = true;
    scrollMobileToActiveLine();
  },
  3000,
  { immediate: false }
);

let isMobileProgrammaticScroll = false;
const { start: startProgrammaticScrollTimer, stop: stopProgrammaticScrollTimer } = useTimeoutFn(
  () => {
    isMobileProgrammaticScroll = false;
  },
  800,
  { immediate: false }
);

function scrollMobileToActiveLine() {
  const idx = mobileActiveLine.value;
  if (!layoutStore.isMobileLyricsOpen || idx < 0) return;
  nextTick(() => {
    const container = mobileLyricsListRef.value;
    const el = container?.querySelector(`[data-line="${idx}"]`) as HTMLElement | null;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top;
      const scrollPosition =
        container.scrollTop + relativeTop - containerRect.height / 2 + elRect.height / 2;

      isMobileProgrammaticScroll = true;
      stopProgrammaticScrollTimer();
      startProgrammaticScrollTimer();

      container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  });
}

watch(mobileActiveLine, () => {
  if (!mobileAutoScroll) return;
  scrollMobileToActiveLine();
});

function onMobileLyricsScroll() {
  if (isMobileProgrammaticScroll) return;

  mobileAutoScroll = false;
  stopMobileScrollTimer();
  startMobileScrollTimer();
}

function toggleLyrics() {
  if (window.innerWidth <= 768) {
    layoutStore.toggleMobileLyrics();
    return;
  }
  if (isLyricsActive.value) {
    layoutStore.closeRightSidebar();
  } else {
    layoutStore.openRightSidebar('lyrics');
  }
}

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
  isDraggingSeek.value = true;
  const input = event.target as HTMLInputElement;
  localSeekTime.value = parseFloat(input.value);
}

function onSeekChange(event: Event) {
  isDraggingSeek.value = false;
  const input = event.target as HTMLInputElement;
  player.seek(parseFloat(input.value));
}

function onVolumeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  player.setVolume(parseFloat(input.value));
}

const isMoreMenuOpen = ref(false);
const moreMenuBtnRef = ref<HTMLElement | null>(null);
const extraControlsRef = ref<HTMLElement | null>(null);

onClickOutside(moreMenuBtnRef, (e) => {
  if (extraControlsRef.value?.contains(e.target as Node)) return;
  isMoreMenuOpen.value = false;
});
</script>

<template>
  <div>
    <audio ref="audioEl1" preload="metadata" playsinline crossorigin="anonymous" />
    <audio ref="audioEl2" preload="metadata" playsinline crossorigin="anonymous" />
    <aside class="player-bar" :aria-label="$t('player.playerBar')">
      <div class="player-bar__left">
        <div class="player-bar__track-trigger" @click="toggleLyrics">
          <ClientOnly>
            <div class="player-bar__artwork">
              <img
                v-if="displayTrack?.thumbnailUrl"
                :src="displayTrack.thumbnailUrl"
                :alt="displayTrack?.title"
                class="player-bar__img" />
              <AppIcon v-else name="ph:music-notes-simple" class="player-bar__img-placeholder" />
            </div>
            <template #fallback>
              <div class="player-bar__artwork">
                <AppSkeleton width="100%" height="100%" />
              </div>
            </template>
          </ClientOnly>

          <ClientOnly>
            <div v-if="displayTrack" class="player-bar__info">
              <span class="player-bar__title">{{ displayTrack.title }}</span>
              <AppTrackArtists :track="displayTrack" class="player-bar__artist" />
            </div>
            <div v-else class="player-bar__info player-bar__info--empty">
              <span class="player-bar__title">{{ $t('player.noTrack') }}</span>
              <span class="player-bar__artist">{{ $t('player.startSomething') }}</span>
            </div>
            <template #fallback>
              <div class="player-bar__info player-bar__info--skeleton">
                <AppSkeleton height="12px" width="120px" border-radius="var(--radius-sm)" />
                <AppSkeleton height="10px" width="80px" border-radius="var(--radius-sm)" />
              </div>
            </template>
          </ClientOnly>
        </div>

        <ClientOnly>
          <button
            ref="playlistBtnRef"
            class="player-bar__add-btn"
            :disabled="!displayTrack"
            :aria-label="$t('playlists.addToPlaylist')"
            @click="layoutStore.toggleAddToPlaylist()">
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
            :class="{
              'player-bar__btn--active': isHydrated
                ? player.playbackOrder.value === 'random'
                : false
            }"
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
            <AppIcon
              data-allow-mismatch
              :name="
                isHydrated && player.repeatMode.value === 'one' ? 'ph:repeat-once' : 'ph:repeat'
              " />
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
            @input="onSeekInput"
            @change="onSeekChange" />
          <AppSkeleton v-else height="4px" class="player-bar__slider--seek" />
          <span class="player-bar__time" data-allow-mismatch>
            {{ formatTime(displayDuration) }}
          </span>
        </div>
      </div>

      <div class="player-bar__right">
        <button
          ref="moreMenuBtnRef"
          class="player-bar__btn player-bar__more-btn"
          :class="{ 'player-bar__btn--active': isMoreMenuOpen }"
          :aria-label="$t('core.actions.more')"
          @click="isMoreMenuOpen = !isMoreMenuOpen">
          <AppIcon name="ph:dots-three-vertical-bold" />
        </button>

        <div
          ref="extraControlsRef"
          class="player-bar__extra-controls"
          :class="{ 'is-open': isMoreMenuOpen }">
          <button
            v-if="isDesktopTauri"
            class="player-bar__btn"
            :aria-label="$t('core.miniPlayer')"
            @click="layoutStore.toggleMiniPlayer()">
            <AppIcon name="ph:picture-in-picture-fill" />
          </button>
          <SleepTimerButton />
          <button
            class="player-bar__btn"
            :class="{ 'player-bar__btn--active': layoutStore.isFullscreenVisualizer }"
            :aria-label="$t('player.fullscreenVisualizer')"
            @click="layoutStore.toggleFullscreenVisualizer()">
            <AppIcon name="ph:monitor-play-bold" />
          </button>
          <button
            class="player-bar__btn"
            :class="{ 'player-bar__btn--active': player.isKaraoke.value }"
            :aria-label="$t('player.karaokeMode')"
            @click="player.toggleKaraoke()">
            <AppIcon name="ph:magic-wand" />
          </button>
          <button
            id="player-lyrics-btn"
            class="player-bar__btn player-bar__btn--lyrics"
            :class="{ 'player-bar__btn--active': isLyricsActive || layoutStore.isMobileLyricsOpen }"
            :aria-label="$t('player.lyrics')"
            @click="toggleLyrics">
            <AppIcon name="ph:microphone-stage" />
          </button>
          <button
            class="player-bar__btn player-bar__volume-btn"
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
      </div>
    </aside>

    <Teleport to="body">
      <Transition name="mobile-lyrics">
        <div
          v-if="layoutStore.isMobileLyricsOpen"
          class="mobile-lyrics-overlay"
          role="dialog"
          aria-modal="true">
          <div class="mobile-lyrics-overlay__header">
            <div class="mobile-lyrics-overlay__track">
              <div class="mobile-lyrics-overlay__artwork">
                <img
                  v-if="displayTrack?.thumbnailUrl"
                  :src="displayTrack.thumbnailUrl"
                  :alt="displayTrack?.title" />
                <AppIcon v-else name="ph:music-notes-simple" />
              </div>
              <div class="mobile-lyrics-overlay__meta">
                <span class="mobile-lyrics-overlay__title">
                  {{ displayTrack?.title ?? $t('player.noTrack') }}
                </span>
                <span class="mobile-lyrics-overlay__artist">{{ displayTrack?.artist }}</span>
              </div>
            </div>
            <button
              id="mobile-lyrics-close"
              class="mobile-lyrics-overlay__close"
              :aria-label="$t('player.closeInfoPanel')"
              @click="layoutStore.closeMobileLyrics()">
              <AppIcon name="ph:x-bold" />
            </button>
          </div>

          <div class="mobile-lyrics-overlay__body">
            <div v-if="lyricsLoading" class="mobile-lyrics-overlay__loading">
              <AppSpinner size="sm" />
              <span>{{ $t('player.lyricsLoading') }}</span>
            </div>
            <div v-else-if="!hasAnyLyrics" class="mobile-lyrics-overlay__empty">
              <AppIcon name="ph:file-x-duotone" />
              <p>{{ $t('player.lyricsNotFound') }}</p>
            </div>
            <div
              v-else-if="hasSyncedLyrics"
              ref="mobileLyricsListRef"
              class="mobile-lyrics-overlay__list"
              @scroll.passive="onMobileLyricsScroll">
              <p
                v-for="(line, idx) in syncedLines"
                :key="idx"
                :data-line="idx"
                class="mobile-lyrics-overlay__line"
                :class="{ 'mobile-lyrics-overlay__line--active': idx === mobileActiveLine }"
                @click="player.seek(line.time)">
                {{ line.text }}
              </p>
            </div>
            <div v-else class="mobile-lyrics-overlay__plain">
              <p class="mobile-lyrics-overlay__unsync">
                <AppIcon name="ph:warning" />
                {{ $t('player.lyricsNotSynced') }}
              </p>
              <p>{{ plainLyrics }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <AddToPlaylistPopup
      v-if="!layoutStore.isFullscreenVisualizer && layoutStore.isAddToPlaylistOpen && displayTrack"
      :track="{
        videoId: displayTrack?.videoId || '',
        title: displayTrack?.title || '',
        artist: displayTrack?.artist || '',
        thumbnailUrl: displayTrack?.thumbnailUrl || '',
        durationMs: displayDuration * 1000
      }"
      :anchor="playlistBtnRef"
      @close="layoutStore.closeAddToPlaylist()" />
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

  &__track-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    cursor: pointer;
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
    min-width: 0;
  }

  &__extra-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
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

  .artist-link {
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
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
    transition: all var(--transition-base);

    &:hover:not(:disabled) {
      color: var(--color-text-primary);
      transform: scale(1.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

  &__mobile-actions {
    display: none;
  }

  @media (max-width: 800px) {
    grid-template-areas:
      'left controls right'
      'progress progress progress';
    grid-template-columns: 1fr auto 1fr;
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
      width: 80px;
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

  @media (max-width: 600px) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    align-content: space-evenly;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3);
    padding-bottom: env(safe-area-inset-bottom, 12px);
    height: 140px !important;
    min-height: 140px !important;

    &__left {
      width: auto;
      flex: 1;
      position: relative;
      order: 1;
      min-width: 0; /* Important for flex child truncation */
    }

    &__info {
      flex: 0 1 auto;
      min-width: 0;
    }

    &__center {
      display: flex;
      flex-direction: column;
      width: 100%;
      order: 3;
      margin-top: var(--space-1);
    }

    &__controls {
      width: 100%;
      justify-content: center;
      gap: var(--space-4);
    }

    &__right {
      width: auto;
      gap: var(--space-1);
      order: 2;
    }

    &__progress {
      position: absolute;
      top: -1px; /* Align to absolute top edge */
      left: 0;
      width: 100%;
      margin: 0;
      grid-area: auto;

      .player-bar__time {
        display: none;
      }

      input[type='range'] {
        height: 3px;
        background: transparent;

        &::-webkit-slider-thumb {
          width: 12px;
          height: 12px;
        }

        &::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 0;
        }
      }
    }

    .player-bar__btn {
      width: 32px;
      height: 32px;
      font-size: var(--text-xl);
    }
    .player-bar__btn--play {
      width: 44px;
      height: 44px;
      font-size: var(--text-2xl);
    }
    &__slider--volume {
      width: 50px;
    }
  }

  &__more-btn {
    display: none !important;
  }

  @media (max-width: 1000px) {
    &__volume-btn,
    &__slider--volume {
      display: none !important;
    }

    &__extra-controls {
      display: none;

      &.is-open {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        place-items: center;
        position: absolute;
        bottom: calc(100% + var(--space-2));
        right: var(--space-3);
        background: var(--color-surface-raised);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        gap: var(--space-4);
      }
    }

    &__more-btn {
      display: flex !important;
    }
  }
}

.text-success {
  color: hsl(140, 60%, 50%) !important;
}

.mobile-lyrics-overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-player) + 10);
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(max(var(--safe-area-top, 0px), var(--space-2)) + var(--space-4)) var(--space-4)
      var(--space-3);
    border-bottom: 1px solid var(--color-border);
    gap: var(--space-3);
    flex-shrink: 0;
  }

  &__track {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    flex: 1;
  }

  &__artwork {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: var(--color-surface-hover);
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: var(--text-xl);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
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

  &__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: var(--text-base);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-border);
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__loading,
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    padding: var(--space-8);
    text-align: center;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--space-8) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    -webkit-overflow-scrolling: touch;
    width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
      padding: var(--space-8) var(--space-8);
    }
  }

  &__line {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
    cursor: pointer;
    opacity: 0.4;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    text-align: center;
    transform-origin: center center;
    transition:
      color var(--transition-base),
      opacity var(--transition-base),
      font-size var(--transition-base);

    &--active {
      color: var(--color-text-primary);
      opacity: 1;
      font-size: var(--text-2xl);

      @media (max-width: 768px) {
        font-size: var(--text-xl);
      }
    }

    body.audio-reactive-lyrics &--active {
      transform: scale(calc(1.01 + var(--audio-bass, 0) * 0.08));
      text-shadow: 0 0 calc(5px + var(--audio-bass, 0) * 15px)
        hsla(
          var(--color-primary-h),
          var(--color-primary-s),
          var(--color-primary-l),
          calc(0.3 + var(--audio-bass, 0) * 0.7)
        );
      transition:
        transform 0.05s ease-out,
        text-shadow 0.05s ease-out;
    }
  }

  &__plain {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    p {
      margin: 0;
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      line-height: var(--leading-relaxed);
      white-space: pre-line;
    }
  }

  &__unsync {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    padding: var(--space-1) var(--space-3);
    align-self: flex-start;
    color: var(--color-text-secondary);
  }
}

.mobile-lyrics-enter-active,
.mobile-lyrics-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-lyrics-enter-from,
.mobile-lyrics-leave-to {
  transform: translateY(100%);
}
</style>
