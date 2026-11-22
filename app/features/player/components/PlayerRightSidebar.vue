<script setup lang="ts">
import { useMusicVideo } from '@/features/player/composables/useMusicVideo';

import type { LyricLine } from '@/features/player/types/sidebar.types';

const player = usePlayer();
const layoutStore = useLayoutStore();
const {
  lyricsData,
  isLoading: lyricsLoading,
  isTranslating,
  translatedLanguage,
  fetchLyrics,
  translateLyrics,
  resetTranslation,
  getActiveLine
} = useLyrics();
const { connect: connectVisualizer } = useAudioVisualizer();
const { drawVisualizer } = useCanvasVisualizer();
const {
  musicVideoUrl,
  isLoading: isMusicVideoLoading,
  fetchMusicVideo,
  resetMusicVideo
} = useMusicVideo();

function onVideoError() {
  resetMusicVideo();
}

const isMusicVideoMode = computed(() => layoutStore.sidebarBackgroundMode === 'musicvideo');
const musicVideoRef = ref<HTMLVideoElement | null>(null);

const lyricsListRef = ref<HTMLElement | null>(null);
const isResizing = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const vizWrapRef = ref<HTMLElement | null>(null);

const isHydrated = ref(false);

let animId: number | null = null;
let dataArray = new Uint8Array(128);

function resizeCanvas() {
  const canvas = canvasRef.value;
  const wrap = vizWrapRef.value;
  if (!canvas || !wrap) return;
  const { width, height } = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

const themeStore = useThemeStore();

function drawFrame() {
  animId = requestAnimationFrame(drawFrame);
  if (
    layoutStore.rightSidebarMode !== 'info' ||
    !layoutStore.isRightSidebarOpen ||
    isMusicVideoMode.value
  )
    return;

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

  const primaryH = themeStore.currentCustomPalette?.primary.h.toString() || '250';
  const primaryS = (themeStore.currentCustomPalette?.primary.s.toString() || '80') + '%';

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

  if (vizWrapRef.value) {
    vizWrapRef.value.style.setProperty('--bass-scale', bassScale.toString());
  }
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  isHydrated.value = true;

  ro = new ResizeObserver(resizeCanvas);
  if (vizWrapRef.value) ro.observe(vizWrapRef.value);
  nextTick(() => {
    resizeCanvas();
    drawFrame();
  });

  onUnmounted(() => {
    if (animId) cancelAnimationFrame(animId);
    if (ro) ro.disconnect();
  });
});

watch(vizWrapRef, (el) => {
  if (ro) {
    if (el) {
      ro.observe(el);
      nextTick(() => resizeCanvas());
    } else {
      ro.disconnect();
    }
  }
});

const currentTrack = computed(() => (isHydrated.value ? player.currentTrack.value : null));
const currentTime = computed(() => (isHydrated.value ? player.currentTimeSeconds.value : 0));
const isPlaying = computed(() => (isHydrated.value ? player.isPlaying.value : false));

watch(
  currentTrack,
  (track) => {
    if (track) {
      fetchLyrics(track);
      if (layoutStore.sidebarBackgroundMode === 'musicvideo') {
        fetchMusicVideo(track);
      }
    }
  },
  { immediate: true }
);

watch(
  () => layoutStore.sidebarBackgroundMode,
  (mode) => {
    if (
      mode === 'musicvideo' &&
      currentTrack.value &&
      !musicVideoUrl.value &&
      !isMusicVideoLoading.value
    ) {
      fetchMusicVideo(currentTrack.value);
    }
  }
);

function syncVideoWithAudio(force = false) {
  const video = musicVideoRef.value;
  if (!video) return;

  const audioTime = currentTime.value;
  const targetTime =
    video.duration > 0 && audioTime >= video.duration ? audioTime % video.duration : audioTime;

  const diff = Math.abs(video.currentTime - targetTime);
  const threshold = force || !isPlaying.value ? 0.05 : 0.3;

  if (diff > threshold) {
    video.currentTime = targetTime;
  }

  const rate = player.audioElement.value?.playbackRate || 1;
  if (video.playbackRate !== rate) {
    video.playbackRate = rate;
  }
}

function onVideoLoadedMetadata() {
  syncVideoWithAudio(true);
  if (isPlaying.value) {
    musicVideoRef.value?.play().catch(() => {});
  } else {
    musicVideoRef.value?.pause();
  }
}

function onVideoCanPlay() {
  syncVideoWithAudio(true);
  if (isPlaying.value && musicVideoRef.value?.paused) {
    musicVideoRef.value?.play().catch(() => {});
  }
}

function onVideoPlaying() {
  syncVideoWithAudio(false);
}

watch(isPlaying, (playing) => {
  const video = musicVideoRef.value;
  if (!video) return;
  if (playing) {
    syncVideoWithAudio(true);
    video.play().catch(() => {});
  } else {
    video.pause();
    syncVideoWithAudio(true);
  }
});

watch(currentTime, () => {
  syncVideoWithAudio();
});

watch(
  () => player.audioElement.value?.playbackRate,
  (rate) => {
    if (musicVideoRef.value && rate) {
      musicVideoRef.value.playbackRate = rate;
    }
  }
);

const activeLineIndex = computed(() => getActiveLine(currentTime.value));

const syncedLines = computed<LyricLine[]>(() => lyricsData.value?.synced ?? []);
const plainLyrics = computed<string | null>(() => lyricsData.value?.plain ?? null);
const hasSyncedLyrics = computed(() => syncedLines.value.length > 0);
const hasAnyLyrics = computed(() => hasSyncedLyrics.value || !!plainLyrics.value);

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
  () => layoutStore.rightSidebarMode,
  (newMode) => {
    if (newMode === 'lyrics') {
      initialScrollDone = false;
      autoScrollEnabled = true;
      if (scrollResumeTimer) clearTimeout(scrollResumeTimer);
      nextTick(() => scrollToActiveLine(true));
    }
  }
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

function onResizeStart(event: MouseEvent | TouchEvent) {
  if ('button' in event && event.button !== 0) return;
  if (event.cancelable) {
    event.preventDefault();
  }
  isResizing.value = true;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ew-resize';
  document.body.classList.add('is-resizing-sidebar');

  const startX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
  const startWidth = layoutStore.rightSidebarWidth;

  function onMove(e: MouseEvent | TouchEvent) {
    const currentX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const delta = startX - currentX;
    layoutStore.setRightSidebarWidth(startWidth + delta);
  }

  function onEnd() {
    isResizing.value = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.classList.remove('is-resizing-sidebar');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onMove);
  document.addEventListener('touchend', onEnd);
}

const sidebarStyle = computed(() => ({
  width: `${layoutStore.rightSidebarWidth}px`
}));
</script>

<template>
  <aside
    class="right-sidebar"
    :class="{
      'right-sidebar--open': layoutStore.isRightSidebarOpen,
      'right-sidebar--resizing': isResizing
    }"
    :style="sidebarStyle"
    :aria-label="$t('player.openInfoPanel')">
    <div
      class="right-sidebar__resize-handle"
      :class="{ 'right-sidebar__resize-handle--active': isResizing }"
      role="separator"
      :aria-label="'Resize sidebar'"
      @mousedown="onResizeStart"
      @touchstart.passive="onResizeStart" />

    <div class="right-sidebar__header">
      <div class="right-sidebar__tabs">
        <AppTooltip :text="$t('player.nowPlaying')" position="bottom">
          <button
            id="sidebar-tab-info"
            class="right-sidebar__tab"
            :class="{
              'right-sidebar__tab--active': layoutStore.rightSidebarMode === 'info'
            }"
            :aria-label="$t('player.nowPlaying')"
            @click="layoutStore.setRightSidebarMode('info')">
            <AppIcon name="ph:music-note" />
          </button>
        </AppTooltip>
        <AppTooltip :text="$t('player.lyrics')" position="bottom">
          <button
            id="sidebar-tab-lyrics"
            class="right-sidebar__tab"
            :class="{
              'right-sidebar__tab--active': layoutStore.rightSidebarMode === 'lyrics'
            }"
            :aria-label="$t('player.lyrics')"
            @click="layoutStore.setRightSidebarMode('lyrics')">
            <AppIcon name="ph:microphone-stage" />
          </button>
        </AppTooltip>
        <AppTooltip :text="$t('player.queue')" position="bottom">
          <button
            id="sidebar-tab-queue"
            class="right-sidebar__tab"
            :class="{
              'right-sidebar__tab--active': layoutStore.rightSidebarMode === 'queue'
            }"
            :aria-label="$t('player.queue')"
            @click="layoutStore.setRightSidebarMode('queue')">
            <AppIcon name="ph:list-dashes" />
          </button>
        </AppTooltip>
      </div>
      <AppTooltip :text="$t('player.closeInfoPanel')" position="bottom">
        <button
          id="sidebar-close-btn"
          class="right-sidebar__close"
          :aria-label="$t('player.closeInfoPanel')"
          @click="layoutStore.closeRightSidebar()">
          <AppIcon name="ph:x-bold" />
        </button>
      </AppTooltip>
    </div>

    <div class="right-sidebar__body">
      <div v-if="layoutStore.rightSidebarMode === 'info'" class="right-sidebar__info">
        <template v-if="!isHydrated">
          <div class="right-sidebar__artwork-wrap">
            <AppSkeleton width="100%" height="100%" border-radius="var(--radius-lg)" />
          </div>
          <div class="right-sidebar__track-meta" style="gap: 12px; margin-top: 24px">
            <AppSkeleton width="80%" height="24px" border-radius="var(--radius-sm)" />
            <AppSkeleton width="50%" height="18px" border-radius="var(--radius-sm)" />
          </div>
        </template>

        <template v-else-if="currentTrack">
          <div ref="vizWrapRef" class="right-sidebar__artwork-wrap">
            <video
              v-if="isMusicVideoMode && musicVideoUrl"
              ref="musicVideoRef"
              :src="musicVideoUrl"
              class="right-sidebar__music-video"
              loop
              muted
              playsinline
              preload="auto"
              @loadedmetadata="onVideoLoadedMetadata"
              @canplay="onVideoCanPlay"
              @playing="onVideoPlaying"
              @error="onVideoError" />
            <img
              v-else-if="currentTrack.thumbnailUrl"
              :src="currentTrack.thumbnailUrl"
              :alt="currentTrack.title"
              class="right-sidebar__artwork-bg" />
            <div v-else class="right-sidebar__artwork-placeholder">
              <AppIcon name="ph:music-notes-simple" />
            </div>

            <div
              v-if="isMusicVideoMode && isMusicVideoLoading"
              class="right-sidebar__music-video-loading">
              <AppSpinner size="md" />
            </div>

            <canvas v-show="!isMusicVideoMode" ref="canvasRef" class="right-sidebar__canvas" />

            <div class="right-sidebar__visualizer-selector">
              <AppTooltip :text="$t('player.backgroundModeVisualizer')" position="bottom">
                <button
                  class="right-sidebar__style-btn"
                  :class="{
                    'right-sidebar__style-btn--active': !isMusicVideoMode
                  }"
                  :aria-label="$t('player.backgroundModeVisualizer')"
                  @click="layoutStore.setSidebarBackgroundMode('visualizer')">
                  <AppIcon name="ph:waveform-bold" />
                </button>
              </AppTooltip>
              <AppTooltip :text="$t('player.backgroundModeMusicVideo')" position="bottom">
                <button
                  class="right-sidebar__style-btn"
                  :class="{
                    'right-sidebar__style-btn--active': isMusicVideoMode
                  }"
                  :aria-label="$t('player.backgroundModeMusicVideo')"
                  @click="layoutStore.setSidebarBackgroundMode('musicvideo')">
                  <AppIcon name="ph:film-slate-bold" />
                </button>
              </AppTooltip>
              <template v-if="!isMusicVideoMode">
                <AppTooltip
                  v-for="style in ['circle', 'bars', 'wave', 'particles'] as const"
                  :key="style"
                  :text="$t(`player.visualizerStyles.${style}`)"
                  position="bottom">
                  <button
                    class="right-sidebar__style-btn"
                    :class="{
                      'right-sidebar__style-btn--active': layoutStore.visualizerStyle === style
                    }"
                    :aria-label="$t(`player.visualizerStyles.${style}`)"
                    @click="layoutStore.setVisualizerStyle(style)">
                    <AppIcon
                      :name="
                        style === 'circle'
                          ? 'ph:circle-bold'
                          : style === 'bars'
                            ? 'ph:chart-bar-bold'
                            : style === 'wave'
                              ? 'ph:wave-sine-bold'
                              : 'ph:sparkle-bold'
                      " />
                  </button>
                </AppTooltip>
              </template>
            </div>

            <div
              v-if="!isMusicVideoMode || !musicVideoUrl"
              class="right-sidebar__artwork-center"
              :class="{ 'right-sidebar__artwork-center--spinning': isPlaying }">
              <img
                v-if="currentTrack.thumbnailUrl"
                :src="currentTrack.thumbnailUrl"
                :alt="currentTrack.title"
                class="right-sidebar__artwork-thumb" />
              <div v-else class="right-sidebar__artwork-placeholder-sm">
                <AppIcon name="ph:music-notes-simple" />
              </div>
            </div>

            <div class="right-sidebar__artwork-overlay" />
            <div class="right-sidebar__track-meta">
              <p class="right-sidebar__track-title">{{ currentTrack.title }}</p>
              <AppTrackArtists :track="currentTrack" class="right-sidebar__track-artist" />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="right-sidebar__empty-state">
            <AppIcon name="ph:music-notes-duotone" class="right-sidebar__empty-icon" />
            <p class="right-sidebar__empty-text">{{ $t('player.noTrack') }}</p>
            <p class="right-sidebar__empty-hint">{{ $t('player.startSomething') }}</p>
          </div>
        </template>
      </div>

      <div v-else-if="layoutStore.rightSidebarMode === 'lyrics'" class="right-sidebar__lyrics">
        <div
          v-if="hasAnyLyrics && !lyricsLoading && currentTrack?.videoId === lyricsData?.trackId"
          class="right-sidebar__lyrics-header">
          <button
            class="right-sidebar__translate-btn"
            :disabled="isTranslating"
            @click="translatedLanguage ? resetTranslation() : translateLyrics('hu')">
            <AppIcon :name="translatedLanguage ? 'ph:arrow-u-up-left' : 'ph:translate'" />
            <span v-if="isTranslating">{{ $t('player.translating') }}</span>
            <span v-else-if="translatedLanguage">
              {{ $t('player.showOriginal') }}
            </span>
            <span v-else>{{ $t('player.translateToHu') }}</span>
          </button>
        </div>

        <div
          v-if="
            !isHydrated ||
            lyricsLoading ||
            (currentTrack && lyricsData?.trackId !== currentTrack.videoId)
          "
          class="right-sidebar__lyrics-loading-skeleton">
          <AppSkeleton
            v-for="(width, index) in [
              '60%',
              '85%',
              '45%',
              '70%',
              '90%',
              '55%',
              '75%',
              '40%',
              '80%',
              '65%',
              '50%',
              '85%',
              '70%',
              '45%',
              '60%',
              '75%',
              '55%',
              '80%',
              '40%',
              '90%',
              '65%',
              '75%',
              '45%',
              '85%',
              '50%',
              '70%',
              '80%',
              '60%',
              '90%',
              '55%'
            ]"
            :key="index"
            :width="width"
            height="24px"
            border-radius="var(--radius-sm)"
            :style="{ opacity: Math.max(0.05, 1 - index * 0.035) }" />
        </div>

        <div v-else-if="!currentTrack" class="right-sidebar__empty-state">
          <AppIcon name="ph:music-notes-duotone" class="right-sidebar__empty-icon" />
          <p class="right-sidebar__empty-text">{{ $t('player.noTrack') }}</p>
          <p class="right-sidebar__empty-hint">{{ $t('player.startSomething') }}</p>
        </div>

        <div v-else-if="!hasAnyLyrics" class="right-sidebar__empty-state">
          <AppIcon name="ph:file-x-duotone" class="right-sidebar__empty-icon" />
          <p class="right-sidebar__empty-text">{{ $t('player.lyricsNotFound') }}</p>
        </div>

        <template v-else-if="hasSyncedLyrics">
          <div
            ref="lyricsListRef"
            class="right-sidebar__lyrics-list"
            tabindex="0"
            role="region"
            :aria-label="$t('player.lyrics')"
            @scroll.passive="onLyricsScroll">
            <div
              v-for="(line, idx) in syncedLines"
              :key="idx"
              :data-line="idx"
              class="right-sidebar__lyric-line"
              :class="{ 'right-sidebar__lyric-line--active': idx === activeLineIndex }"
              @click="player.seek(line.time)">
              <span class="right-sidebar__lyric-text">{{ line.text }}</span>
              <span v-if="line.translatedText" class="right-sidebar__lyric-translated">
                {{ line.translatedText }}
              </span>
            </div>
          </div>
        </template>

        <template v-else>
          <div
            class="right-sidebar__plain-lyrics-wrap"
            tabindex="0"
            role="region"
            :aria-label="$t('player.lyrics')">
            <p class="right-sidebar__unsync-badge">
              <AppIcon name="ph:warning" />
              {{ $t('player.lyricsNotSynced') }}
            </p>
            <p class="right-sidebar__plain-lyrics">
              {{ plainLyrics }}
            </p>
            <p v-if="lyricsData?.translatedPlain" class="right-sidebar__plain-translated">
              {{ lyricsData.translatedPlain }}
            </p>
          </div>
        </template>
      </div>

      <div v-else-if="layoutStore.rightSidebarMode === 'queue'" class="right-sidebar__queue">
        <PlayerQueue />
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.right-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
  min-width: 220px;
  max-width: 30vw;
  transition: width var(--transition-slow);

  &--resizing {
    transition: none;
    user-select: none;

    iframe,
    video,
    canvas {
      pointer-events: none !important;
    }
  }

  &__resize-handle {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    z-index: 50;
    touch-action: none;
    transition: background var(--transition-fast);

    &:hover,
    &--active {
      background: color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    gap: var(--space-2);
  }

  &__tabs {
    display: flex;
    gap: var(--space-1);
    flex: 1;
    min-width: 0;
  }

  &__tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 1.25rem;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    white-space: nowrap;
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }

    &--active {
      color: var(--color-text-primary);
      background: color-mix(in srgb, var(--color-primary) 20%, transparent);
    }
  }

  &__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    transition: all var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    overflow-y: auto;
    flex: 1;
  }

  &__artwork-wrap {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;
    background: var(--color-surface-hover);
    box-shadow: var(--shadow-xl);
    flex-shrink: 0;
  }

  &__music-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    pointer-events: none;
  }

  &__music-video-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    z-index: 2;
    backdrop-filter: blur(4px);
    pointer-events: none;
  }

  &__artwork-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(18px) brightness(0.35) saturate(1.6);
    transform: scale(1.1);
    display: block;
  }

  &__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__visualizer-selector {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    display: flex;
    gap: var(--space-2);
    z-index: 10;
    background: rgba(0, 0, 0, 0.4);
    padding: var(--space-1);
    border-radius: var(--radius-full);
    backdrop-filter: blur(8px);
  }

  &__style-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 1.1rem;

    &:hover {
      color: var(--color-text-primary);
      background: rgba(255, 255, 255, 0.1);
    }

    &--active {
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    }
  }

  &__artwork-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(var(--bass-scale, 1));
    width: 60%;
    aspect-ratio: 1 / 1;
    height: auto;
    border-radius: 50%;
    overflow: hidden;
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--color-primary) 40%, transparent),
      0 0 24px 6px color-mix(in srgb, var(--color-primary) 20%, transparent),
      var(--shadow-xl);
  }

  &__artwork-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    animation: artwork-spin 24s linear infinite;
    animation-play-state: paused;

    .right-sidebar__artwork-center--spinning & {
      animation-play-state: running;
    }
  }

  &__artwork-placeholder-sm {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: var(--color-text-secondary);
    background: var(--color-surface-hover);
    opacity: 0.5;
  }

  &__artwork-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: var(--color-text-secondary);
    opacity: 0.4;
  }

  &__artwork-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgb(0 0 0 / 0.85) 0%,
      rgb(0 0 0 / 0.4) 40%,
      transparent 80%
    );
    pointer-events: none;
  }

  &__track-meta {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-6) var(--space-4) var(--space-4);
    z-index: 10;
  }

  &__track-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: #ffffff;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
  }

  &__track-artist {
    font-size: var(--text-sm);
    color: rgb(255 255 255 / 0.7);
    margin: 0;
    text-decoration: none;
    text-shadow: 0 1px 3px rgb(0 0 0 / 0.5);

    &--link {
      &:hover {
        color: #ffffff;
        text-decoration: underline;
      }
    }
  }

  &__empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8) var(--space-4);
    text-align: center;
    width: 100%;
  }

  &__empty-icon {
    font-size: 3rem;
    color: var(--color-text-secondary);
    opacity: 0.4;
  }

  &__empty-text {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__empty-hint {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    opacity: 0.7;
    margin: 0;
  }

  &__lyrics {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__queue {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__lyrics-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--space-2) var(--space-4);
    background: color-mix(in srgb, var(--color-surface) 95%, transparent);
    backdrop-filter: blur(8px);
    z-index: 10;
    border-bottom: 1px solid var(--color-border);
  }

  &__translate-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    svg {
      font-size: 1.1rem;
    }
  }

  &__lyrics-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--space-8) var(--space-4) 50vh;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-full);
    }

    &::-webkit-scrollbar-button {
      display: none;
      width: 0;
      height: 0;
    }
  }

  &__lyric-line {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-secondary);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: left center;
    cursor: pointer;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &:hover {
      color: var(--color-text-primary);
    }

    &--active {
      color: var(--color-text-primary);
      transform: scale(1.05);
      text-shadow: 0 0 20px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    body.audio-reactive-lyrics &--active {
      transform: scale(calc(1 + var(--audio-bass, 0) * 0.15));
      text-shadow: 0 0 calc(10px + var(--audio-bass, 0) * 30px)
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

  &__lyric-text {
    display: block;
  }

  &__lyric-translated {
    display: block;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-primary);
  }

  &__plain-lyrics-wrap {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-full);
    }

    &::-webkit-scrollbar-button {
      display: none;
      width: 0;
      height: 0;
    }
  }

  &__unsync-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    padding: var(--space-1) var(--space-3);
    margin: 0;
    align-self: flex-start;
  }

  &__plain-lyrics {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--color-text-primary);
    white-space: pre-wrap;
  }

  &__plain-translated {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--color-primary);
    white-space: pre-wrap;
    margin-top: var(--space-6);
    padding-top: var(--space-6);
    border-top: 1px dashed var(--color-border);
  }

  &__lyrics-loading-skeleton {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--space-6) var(--space-4);
    gap: var(--space-4);
  }

  @media (max-width: 768px) {
    display: none;
  }
}

@keyframes artwork-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:global(body.is-resizing-sidebar) {
  user-select: none !important;
  cursor: ew-resize !important;

  iframe,
  video,
  canvas {
    pointer-events: none !important;
  }
}
</style>
