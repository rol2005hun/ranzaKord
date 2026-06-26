<script setup lang="ts">
import type { LyricLine } from '../types/sidebar.types';
const player = usePlayer();
const layoutStore = useLayoutStore();
const playlistsStore = usePlaylistsStore();
const { connect: connectVisualizer } = useAudioVisualizer();
const { drawVisualizer } = useCanvasVisualizer();

const isInAnyPlaylist = computed(() => {
  return player.currentTrack.value
    ? playlistsStore.isTrackInAnyPlaylist(player.currentTrack.value.videoId)
    : false;
});

const isLyricsActive = computed(
  () => layoutStore.isRightSidebarOpen && layoutStore.rightSidebarMode === 'lyrics'
);

const isMobileLyricsActive = computed(() => layoutStore.isMobileLyricsOpen);

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

const { lyricsData, isLoading: lyricsLoading, fetchLyrics, getActiveLine } = useLyrics();

watch(
  () => player.currentTrack.value,
  (track) => {
    if (track) fetchLyrics(track);
  },
  { immediate: true }
);

const currentTime = computed(() => player.currentTimeSeconds.value);
const activeLineIndex = computed(() => getActiveLine(currentTime.value));
const syncedLines = computed<LyricLine[]>(() => lyricsData.value?.synced ?? []);
const plainLyrics = computed<string | null>(() => lyricsData.value?.plain ?? null);
const hasSyncedLyrics = computed(() => syncedLines.value.length > 0);

const lyricsListRef = ref<HTMLElement | null>(null);
let autoScrollEnabled = true;
let scrollResumeTimer: ReturnType<typeof setTimeout> | null = null;
let isProgrammaticScroll = false;
let programmaticScrollTimer: ReturnType<typeof setTimeout> | null = null;

function scrollToActiveLine(instant = false) {
  const idx = activeLineIndex.value;
  if (idx < 0) return;
  nextTick(() => {
    const container = lyricsListRef.value;
    const el = container?.querySelector(`[data-line="${idx}"]`) as HTMLElement | null;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top;
      const scrollPosition =
        container.scrollTop + relativeTop - containerRect.height / 2 + elRect.height / 2;

      isProgrammaticScroll = true;
      if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
      programmaticScrollTimer = setTimeout(() => {
        isProgrammaticScroll = false;
      }, 800);

      container.scrollTo({ top: scrollPosition, behavior: instant ? 'auto' : 'smooth' });
    }
  });
}

let initialScrollDone = false;

watch(activeLineIndex, () => {
  if (!autoScrollEnabled) return;
  scrollToActiveLine(!initialScrollDone);
  initialScrollDone = true;
});

watch(
  () => player.currentTrack.value?.videoId,
  () => {
    initialScrollDone = false;
  }
);

watch(
  isLyricsActive,
  (isActive) => {
    if (isActive) {
      initialScrollDone = false;
      autoScrollEnabled = true;
      if (scrollResumeTimer) clearTimeout(scrollResumeTimer);
      nextTick(() => scrollToActiveLine(true));
    }
  },
  { immediate: true }
);

watch(
  isMobileLyricsActive,
  (isActive) => {
    if (isActive) {
      initialScrollDone = false;
      autoScrollEnabled = true;
      if (scrollResumeTimer) clearTimeout(scrollResumeTimer);
      nextTick(() => scrollToActiveLine(true));
    }
  },
  { immediate: true }
);

function onLyricsScroll() {
  if (isProgrammaticScroll) return;
  autoScrollEnabled = false;
  if (scrollResumeTimer) clearTimeout(scrollResumeTimer);
  scrollResumeTimer = setTimeout(() => {
    autoScrollEnabled = true;
    scrollToActiveLine();
  }, 3000);
}

const previousVolume = ref(1);

const volumeIcon = computed(() => {
  if (player.volume.value === 0) return 'ph:speaker-slash-fill';
  if (player.volume.value < 0.3) return 'ph:speaker-low-fill';
  if (player.volume.value < 0.7) return 'ph:speaker-high-fill';
  return 'ph:speaker-high-fill';
});

function toggleMute() {
  if (player.volume.value > 0) {
    previousVolume.value = player.volume.value;
    player.setVolume(0);
  } else {
    player.setVolume(previousVolume.value);
  }
}

function onVolumeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  player.setVolume(parseFloat(input.value));
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const playlistBtnRef = ref<HTMLElement | null>(null);
const mobilePlaylistBtnRef = ref<HTMLElement | null>(null);

function getPlaylistBtnAnchor() {
  if (window.innerWidth <= 768 && mobilePlaylistBtnRef.value) {
    return mobilePlaylistBtnRef.value;
  }
  return playlistBtnRef.value;
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

let animId: number | null = null;
let dataArray = new Uint8Array(128);
let primaryH = '250';
let primaryS = '80%';
let ro: ResizeObserver | null = null;

function syncThemeColors() {
  const s = getComputedStyle(document.documentElement);
  primaryH = s.getPropertyValue('--color-primary-h').trim() || '250';
  primaryS = s.getPropertyValue('--color-primary-s').trim() || '80%';
}

function handleResize() {
  const canvas = canvasRef.value;
  const wrap = containerRef.value;
  if (!canvas || !wrap) return;
  const { width, height } = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function drawFrame() {
  animId = requestAnimationFrame(drawFrame);
  if (!layoutStore.isFullscreenVisualizer) return;

  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const audio1 = player.audioElement1.value;
  const audio2 = player.audioElement2.value;
  if (audio1 && audio2) {
    const analyser = connectVisualizer(audio1, audio2, player.volume.value);
    if (analyser) {
      if (dataArray.length !== analyser.frequencyBinCount) {
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArray);
    }
  }

  const W = canvas.width;
  const H = canvas.height;
  const time = performance.now();

  const bassScale = drawVisualizer({
    ctx,
    width: W,
    height: H,
    dataArray,
    style: layoutStore.visualizerStyle,
    primaryH,
    primaryS,
    time
  });

  if (containerRef.value) {
    containerRef.value.style.setProperty('--bass-scale', bassScale.toString());
  }
}

onMounted(() => {
  syncThemeColors();
  handleResize();
  ro = new ResizeObserver(() => {
    handleResize();
  });
  if (containerRef.value) {
    ro.observe(containerRef.value);
  }
  animId = requestAnimationFrame(drawFrame);
});

onUnmounted(() => {
  if (animId !== null) {
    cancelAnimationFrame(animId);
  }
  if (ro) {
    ro.disconnect();
  }
});

function closeFullscreen() {
  layoutStore.toggleFullscreenVisualizer();
}

function getStyleIcon(style: string) {
  switch (style) {
    case 'circle':
      return 'ph:circle';
    case 'bars':
      return 'ph:chart-bar';
    case 'wave':
      return 'ph:wave-sine';
    case 'particles':
      return 'ph:sparkle';
    default:
      return 'ph:paint-brush';
  }
}
</script>

<template>
  <Transition name="fade">
    <div v-if="layoutStore.isFullscreenVisualizer" ref="containerRef" class="fullscreen-visualizer">
      <img
        v-if="player.currentTrack.value?.thumbnailUrl"
        :src="player.currentTrack.value.thumbnailUrl"
        class="fullscreen-visualizer__bg"
        alt=""
        width="1920"
        height="1080"
        fetchpriority="high" />
      <canvas ref="canvasRef" class="fullscreen-visualizer__canvas"></canvas>

      <div class="fullscreen-visualizer__overlay">
        <!-- Controls (Top Right) -->
        <div class="fullscreen-visualizer__controls">
          <div class="fullscreen-visualizer__style-selector">
            <button
              v-for="style in ['circle', 'bars', 'wave', 'particles'] as const"
              :key="style"
              class="fullscreen-visualizer__style-btn"
              :class="{
                'fullscreen-visualizer__style-btn--active': layoutStore.visualizerStyle === style
              }"
              :title="$t(`player.visualizerStyles.${style}`)"
              @click="layoutStore.setVisualizerStyle(style)">
              <AppIcon :name="getStyleIcon(style)" />
            </button>
          </div>

          <!-- Close button -->
          <button
            class="fullscreen-visualizer__close"
            :aria-label="$t('player.closeVisualizer')"
            @click="closeFullscreen">
            <AppIcon name="ph:x-bold" />
          </button>
        </div>

        <!-- Fullscreen Lyrics -->
        <div
          v-if="isLyricsActive || isMobileLyricsActive"
          class="fullscreen-visualizer__lyrics-container">
          <div
            v-if="
              lyricsLoading ||
              (player.currentTrack.value &&
                lyricsData?.trackId !== player.currentTrack.value.videoId)
            "
            class="fullscreen-visualizer__lyrics-loading">
            <AppSpinner size="lg" />
          </div>
          <div
            v-else-if="hasSyncedLyrics"
            ref="lyricsListRef"
            class="fullscreen-visualizer__lyrics-list"
            @scroll.passive="onLyricsScroll">
            <p
              v-for="(line, idx) in syncedLines"
              :key="idx"
              :data-line="idx"
              class="fullscreen-visualizer__lyric-line"
              :class="{ 'fullscreen-visualizer__lyric-line--active': idx === activeLineIndex }"
              @click.stop="player.seek(line.time)">
              {{ line.text }}
            </p>
          </div>
          <div v-else-if="plainLyrics" class="fullscreen-visualizer__lyrics-plain">
            <p class="fullscreen-visualizer__unsync-badge">
              <AppIcon name="ph:warning" />
              {{ $t('player.lyricsNotSynced') }}
            </p>
            <p>{{ plainLyrics }}</p>
          </div>
          <div v-else class="fullscreen-visualizer__lyrics-empty">
            <AppIcon name="ph:music-notes-duotone" />
            <p>{{ $t('player.noTrack') }}</p>
          </div>
        </div>

        <!-- Mobile Track Info (Centered on screen) -->
        <div
          v-if="player.currentTrack.value && !(isLyricsActive || isMobileLyricsActive)"
          class="fullscreen-visualizer__mobile-info">
          <img
            v-if="player.currentTrack.value.thumbnailUrl"
            :src="player.currentTrack.value.thumbnailUrl"
            class="fullscreen-visualizer__thumbnail"
            alt="Thumbnail"
            width="180"
            height="180"
            fetchpriority="high" />
          <div class="fullscreen-visualizer__text">
            <div class="fullscreen-visualizer__title" :title="player.currentTrack.value.title">
              {{ player.currentTrack.value.title }}
            </div>
            <div class="fullscreen-visualizer__artist-row">
              <AppTrackArtists
                :track="player.currentTrack.value"
                class="fullscreen-visualizer__artist"
                @click.capture="closeFullscreen" />
              <button
                ref="mobilePlaylistBtnRef"
                class="fullscreen-visualizer__action-btn"
                :aria-label="$t('playlists.addToPlaylist')"
                @click.stop="layoutStore.toggleAddToPlaylist()">
                <AppIcon v-if="isInAnyPlaylist" name="ph:check-circle-fill" class="text-success" />
                <AppIcon v-else name="ph:plus-circle" />
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="fullscreen-visualizer__bottom-bar">
          <!-- Track Info -->
          <div v-if="player.currentTrack.value" class="fullscreen-visualizer__info">
            <img
              v-if="player.currentTrack.value.thumbnailUrl"
              :src="player.currentTrack.value.thumbnailUrl"
              class="fullscreen-visualizer__thumbnail"
              alt="Thumbnail"
              width="180"
              height="180"
              fetchpriority="high" />
            <div class="fullscreen-visualizer__text">
              <div class="fullscreen-visualizer__title" :title="player.currentTrack.value.title">
                {{ player.currentTrack.value.title }}
              </div>
              <div class="fullscreen-visualizer__artist-row">
                <AppTrackArtists
                  :track="player.currentTrack.value"
                  class="fullscreen-visualizer__artist"
                  @click.capture="closeFullscreen" />
                <button
                  ref="playlistBtnRef"
                  class="fullscreen-visualizer__action-btn"
                  :aria-label="$t('playlists.addToPlaylist')"
                  @click.stop="layoutStore.toggleAddToPlaylist()">
                  <AppIcon
                    v-if="isInAnyPlaylist"
                    name="ph:check-circle-fill"
                    class="text-success" />
                  <AppIcon v-else name="ph:plus-circle" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="fullscreen-visualizer__info"></div>

          <!-- Playback Controls -->
          <div class="fullscreen-visualizer__playback">
            <div class="fullscreen-visualizer__playback-buttons">
              <button
                class="fullscreen-visualizer__action-btn"
                :class="{
                  'fullscreen-visualizer__action-btn--active':
                    player.playbackOrder.value === 'random'
                }"
                :aria-label="$t('player.shuffle')"
                @click.stop="player.toggleShuffle()">
                <AppIcon name="ph:shuffle" />
              </button>
              <button
                class="fullscreen-visualizer__playback-btn"
                :disabled="!player.currentTrack.value"
                :aria-label="$t('player.prev')"
                @click.stop="player.playPrev()">
                <AppIcon name="ph:skip-back-fill" />
              </button>
              <button
                class="fullscreen-visualizer__playback-btn fullscreen-visualizer__playback-btn--play"
                :disabled="!player.currentTrack.value"
                :aria-label="player.isPlaying.value ? $t('player.pause') : $t('player.play')"
                @click.stop="player.togglePlay()">
                <AppSpinner v-if="player.isLoading.value" size="md" />
                <AppIcon v-else :name="player.isPlaying.value ? 'ph:pause-fill' : 'ph:play-fill'" />
              </button>
              <button
                class="fullscreen-visualizer__playback-btn"
                :disabled="!player.currentTrack.value"
                :aria-label="$t('player.next')"
                @click.stop="player.playNext()">
                <AppIcon name="ph:skip-forward-fill" />
              </button>
              <button
                class="fullscreen-visualizer__action-btn"
                :class="{
                  'fullscreen-visualizer__action-btn--active': player.repeatMode.value !== 'off'
                }"
                :aria-label="$t('player.repeat')"
                @click.stop="player.toggleRepeat()">
                <AppIcon
                  :name="player.repeatMode.value === 'one' ? 'ph:repeat-once' : 'ph:repeat'" />
              </button>
            </div>

            <div class="fullscreen-visualizer__progress">
              <span class="fullscreen-visualizer__time">
                {{ formatTime(player.currentTimeSeconds.value) }}
              </span>
              <input
                v-if="player.currentTrack.value"
                class="fullscreen-visualizer__slider fullscreen-visualizer__slider--seek"
                type="range"
                min="0"
                :max="player.durationSeconds.value || 1"
                :value="player.currentTimeSeconds.value"
                step="1"
                :aria-label="$t('player.seek')"
                :style="{
                  '--progress':
                    (player.currentTimeSeconds.value / (player.durationSeconds.value || 1)) * 100 +
                    '%'
                }"
                @input="onSeekInput" />
              <AppSkeleton v-else height="4px" class="fullscreen-visualizer__slider--seek" />
              <span class="fullscreen-visualizer__time">
                {{ formatTime(player.durationSeconds.value) }}
              </span>
            </div>
          </div>

          <!-- Right Controls -->
          <div class="fullscreen-visualizer__right-controls">
            <button
              class="fullscreen-visualizer__action-btn"
              :class="{ 'fullscreen-visualizer__action-btn--active': player.isKaraoke.value }"
              :aria-label="$t('player.karaokeMode')"
              @click.stop="player.toggleKaraoke()">
              <AppIcon name="ph:magic-wand" />
            </button>
            <button
              class="fullscreen-visualizer__action-btn"
              :class="{
                'fullscreen-visualizer__action-btn--active':
                  isLyricsActive || layoutStore.isMobileLyricsOpen
              }"
              :aria-label="$t('player.lyrics')"
              @click.stop="toggleLyrics()">
              <AppIcon name="ph:microphone-stage" />
            </button>
            <button
              class="fullscreen-visualizer__action-btn"
              :aria-label="$t('player.mute')"
              @click.stop="toggleMute()">
              <AppIcon :name="volumeIcon" />
            </button>
            <input
              v-if="player.currentTrack.value"
              class="fullscreen-visualizer__slider"
              type="range"
              min="0"
              max="1"
              :value="player.volume.value"
              step="0.01"
              :aria-label="$t('player.volume')"
              :style="{ '--progress': player.volume.value * 100 + '%' }"
              @input.stop="onVolumeInput" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <AddToPlaylistPopup
    v-if="
      layoutStore.isFullscreenVisualizer &&
      layoutStore.isAddToPlaylistOpen &&
      player.currentTrack.value
    "
    :track="{
      videoId: player.currentTrack.value?.videoId || '',
      title: player.currentTrack.value?.title || '',
      artist: player.currentTrack.value?.artist || '',
      thumbnailUrl: player.currentTrack.value?.thumbnailUrl || '',
      durationMs: (player.currentTrack.value?.durationSeconds || 0) * 1000
    }"
    :anchor="getPlaylistBtnAnchor()"
    @close="layoutStore.closeAddToPlaylist()" />
</template>

<style scoped lang="scss">
.fullscreen-visualizer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  --bass-scale: 1;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(48px) brightness(0.25) saturate(1.5);
    transform: scale(1.2);
    z-index: 0;
  }

  &__lyrics-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    padding: 100px 20px;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  &__lyrics-list {
    width: 100%;
    max-width: 1000px;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 30vh 4rem;
    scrollbar-width: none;

    @media (max-width: 768px) {
      padding: 30vh 2rem;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 15%,
      black 85%,
      transparent 100%
    );
  }

  &__lyric-line {
    font-size: 3rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    margin: 0;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    word-break: break-word;
    overflow-wrap: break-word;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    &--active {
      color: white;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }

  body.audio-reactive-lyrics &__lyric-line--active {
    transform: scale(calc(1 + var(--audio-bass, 0) * 0.15));
    text-shadow: 0 0 calc(10px + var(--audio-bass, 0) * 30px)
      hsla(
        var(--color-primary-h),
        var(--color-primary-s),
        50%,
        calc(0.3 + var(--audio-bass, 0) * 0.7)
      );
    transition:
      transform 0.05s ease-out,
      text-shadow 0.05s ease-out;
  }

  &__lyrics-plain {
    pointer-events: auto;
    width: 100%;
    max-width: 800px;
    height: 100%;
    overflow-y: auto;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.5rem;
    line-height: 2;
    padding: 20vh 0;
    mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);

    p {
      margin: 0;
      white-space: pre-line;
    }
  }

  &__unsync-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 100px;
    margin-bottom: 2rem;
  }

  &__lyrics-loading,
  &__lyrics-empty {
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  &__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    // Add a slight pulse effect to the canvas container itself based on bass
    transform: scale(calc(1 + (var(--bass-scale) - 1) * 0.05));
    transition: transform 0.1s ease-out;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.8) 0%,
      transparent 30%,
      transparent 80%,
      rgba(0, 0, 0, 0.4) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2rem;
    pointer-events: none;

    html.is-tauri & {
      padding-top: calc(2rem + var(--titlebar-height, 32px));
    }
  }

  &__controls {
    pointer-events: auto;
    align-self: flex-end;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    z-index: 10;
  }

  &__style-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    padding: 0.5rem;
    border-radius: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__style-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    &--active {
      color: white;
      background: rgba(var(--color-primary-h), var(--color-primary-s), 50%, 0.8);
      box-shadow: 0 0 12px rgba(var(--color-primary-h), var(--color-primary-s), 50%, 0.5);

      &:hover {
        background: rgba(var(--color-primary-h), var(--color-primary-s), 50%, 1);
      }
    }
  }

  &__close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &__bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: auto;
    width: auto;
    margin: 0 4rem;
    position: relative;
    z-index: 10;

    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 100px;
    padding: 0.75rem 3rem;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1.25rem;
      align-items: center;
      text-align: center;
      margin: 0 1rem;
      border-radius: 2rem;
      padding: 1.25rem;
      width: auto;
    }
  }

  &__mobile-info {
    display: none;

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
      text-align: center;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
      width: auto;
      pointer-events: auto;

      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2rem;
      padding: 1.5rem;
    }
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
    min-width: 0; /* Enable truncation for children */

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__spacer {
    flex: 1;
    @media (max-width: 768px) {
      display: none;
    }
  }

  &__playback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex: 1;
    width: 100%;

    @media (max-width: 768px) {
      flex: none;
    }
  }

  &__playback-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;

    @media (max-width: 768px) {
      gap: 1rem;
    }
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0 1rem;
  }

  &__time {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
    min-width: 45px;
    text-align: center;
  }

  &__playback-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      color: white;
      transform: scale(1.1);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--play {
      font-size: 28px;
      width: 48px;
      height: 48px;
      background: white;
      color: black;
      border-radius: 50%;

      &:hover:not(:disabled) {
        transform: scale(1.05);
        background: var(--color-primary);
        color: white;
        box-shadow: 0 4px 15px var(--color-primary-glow);
      }
    }
  }

  &__thumbnail {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-md);
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 180px;
      height: 180px;
      border-radius: var(--radius-lg);
      margin-bottom: 0;
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0; /* Enable text truncation */

    @media (max-width: 768px) {
      align-items: center;
      text-align: center;
      padding: 0 2rem;
    }
  }

  &__artist-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    @media (max-width: 768px) {
      justify-content: center;
    }
  }

  &__action-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;

    &:hover {
      color: white;
      transform: scale(1.1);
    }

    &--active {
      color: var(--color-primary);
      text-shadow: 0 0 10px var(--color-primary-glow);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--color-primary);
        box-shadow: 0 0 8px var(--color-primary-glow);
      }
    }
  }

  &__right-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1.5rem;
    flex: 1;

    @media (max-width: 768px) {
      justify-content: center;
      width: 100%;
      flex: none;
    }
  }

  &__slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100px;
    height: 4px;
    background: transparent;
    border-radius: var(--radius-full);
    outline: none;
    cursor: pointer;

    &--seek {
      width: 100%;
      flex: 1;
    }

    &::-webkit-slider-runnable-track {
      background: linear-gradient(
        to right,
        var(--color-primary) var(--progress, 0%),
        rgba(255, 255, 255, 0.2) var(--progress, 0%)
      );
      border-radius: var(--radius-full);
      height: 4px;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      margin-top: -5px; /* (4 - 14) / 2 */
      border-radius: 50%;
      background: white;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 1.75rem;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  &__artist {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 1.15rem;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
