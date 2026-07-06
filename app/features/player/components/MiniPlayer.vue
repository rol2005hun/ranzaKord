<script setup lang="ts">
import { nextTick } from 'vue';

const player = usePlayer();
const layoutStore = useLayoutStore();
const themeStore = useThemeStore();
const { t } = useI18n();

const { connect: connectVisualizer } = useAudioVisualizer();
const { drawVisualizer } = useCanvasVisualizer();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

let animId: number;
let ro: ResizeObserver;
let dataArray = new Uint8Array(0);

// Sync theme colors so canvas visualizer knows what to draw
let primaryH = '0';
let primaryS = '0';

function syncThemeColors() {
  if (!import.meta.client) return;
  if (themeStore.currentCustomPalette) {
    primaryH = String(themeStore.currentCustomPalette.primary.h);
    primaryS = String(themeStore.currentCustomPalette.primary.s) + '%';
  } else {
    const raw = themeStore.DEFAULT_THEME_COLORS[themeStore.themeId] || '158 85% 65%';
    const m = raw.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
    if (m) {
      primaryH = m[1] || '0';
      primaryS = (m[2] || '0') + '%';
    }
  }
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
  if (!layoutStore.isMiniPlayer) return;

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

  drawVisualizer({
    ctx,
    width: W,
    height: H,
    dataArray,
    style: layoutStore.visualizerStyle,
    primaryH,
    primaryS,
    time
  });
}

const displayTrack = computed(() => player.currentTrack.value);
const progress = computed(() => {
  if (!player.durationSeconds.value) return 0;
  return (player.currentTimeSeconds.value / player.durationSeconds.value) * 100;
});

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function closeApp() {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch {
    // Ignore error if not in Tauri
  }
}

watch(
  () => layoutStore.isMiniPlayer,
  (isMini) => {
    if (import.meta.client) {
      if (isMini) {
        document.body.style.overflow = 'hidden';
        syncThemeColors();
        nextTick(() => {
          if (containerRef.value && ro) {
            ro.observe(containerRef.value);
          }
          handleResize();
          if (animId) cancelAnimationFrame(animId);
          animId = requestAnimationFrame(drawFrame);
        });
      } else {
        document.body.style.overflow = '';
        if (animId) cancelAnimationFrame(animId);
        if (containerRef.value && ro) {
          ro.unobserve(containerRef.value);
        }
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (import.meta.client) {
    ro = new ResizeObserver(() => {
      handleResize();
    });
    // In case it's already mounted and true
    if (containerRef.value && layoutStore.isMiniPlayer) {
      ro.observe(containerRef.value);
    }
  }
});

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId);
  if (ro) ro.disconnect();
});
</script>

<template>
  <div
    v-if="layoutStore.isMiniPlayer"
    ref="containerRef"
    class="mini-player"
    data-tauri-drag-region>
    <div class="mini-player__bg" data-tauri-drag-region>
      <img
        v-if="displayTrack?.thumbnailUrl"
        :src="displayTrack.thumbnailUrl"
        aria-hidden="true"
        class="mini-player__bg-img"
        data-tauri-drag-region />
      <canvas ref="canvasRef" class="mini-player__bg-canvas" data-tauri-drag-region></canvas>
    </div>

    <div class="mini-player__content-wrap" data-tauri-drag-region>
      <div class="mini-player__top" data-tauri-drag-region>
        <div class="mini-player__artwork" data-tauri-drag-region>
          <img
            v-if="displayTrack?.thumbnailUrl"
            :src="displayTrack.thumbnailUrl"
            :alt="displayTrack?.title"
            data-tauri-drag-region />
          <div v-else class="mini-player__artwork-placeholder" data-tauri-drag-region>
            <AppIcon name="ph:music-notes-simple" />
          </div>
        </div>

        <div class="mini-player__info" data-tauri-drag-region>
          <div class="mini-player__meta" data-tauri-drag-region>
            <p class="mini-player__title" data-tauri-drag-region>
              {{ displayTrack?.title ?? t('player.noTrack') }}
            </p>
            <AppTrackArtists
              v-if="displayTrack"
              :track="displayTrack"
              class="mini-player__artist"
              @click.capture="layoutStore.isMiniPlayer = false" />
            <p v-else class="mini-player__artist" data-tauri-drag-region>—</p>
          </div>

          <div class="mini-player__progress" data-tauri-drag-region>
            <input
              type="range"
              class="mini-player__seek"
              min="0"
              :max="player.durationSeconds.value || 100"
              :value="player.currentTimeSeconds.value"
              :style="{ '--pct': `${progress}%` }"
              step="0.5"
              @input="(e) => player.seek(parseFloat((e.target as HTMLInputElement).value))"
              @click.stop />
            <div class="mini-player__times" data-tauri-drag-region>
              <span data-tauri-drag-region>{{ formatTime(player.currentTimeSeconds.value) }}</span>
              <span data-tauri-drag-region>{{ formatTime(player.durationSeconds.value) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mini-player__bottom" data-tauri-drag-region>
        <div class="mini-player__controls" data-tauri-drag-region>
          <button
            class="mini-player__btn"
            :class="{ 'mini-player__btn--active': player.playbackOrder.value === 'random' }"
            :aria-label="t('player.shuffle')"
            @click.stop="player.toggleShuffle()">
            <AppIcon name="ph:shuffle" />
          </button>

          <button
            class="mini-player__btn"
            :disabled="!player.hasPrev.value"
            :aria-label="t('player.prev')"
            @click.stop="player.playPrev()">
            <AppIcon name="ph:skip-back-fill" />
          </button>

          <button
            class="mini-player__btn mini-player__btn--play"
            :disabled="!displayTrack"
            :aria-label="player.isPlaying.value ? t('player.pause') : t('player.play')"
            @click.stop="player.togglePlay()">
            <AppSpinner v-if="player.isLoading.value" size="sm" />
            <AppIcon v-else-if="player.isPlaying.value" name="ph:pause-fill" />
            <AppIcon v-else name="ph:play-fill" />
          </button>

          <button
            class="mini-player__btn"
            :disabled="!player.hasNext.value"
            :aria-label="t('player.next')"
            @click.stop="player.playNext()">
            <AppIcon name="ph:skip-forward-fill" />
          </button>

          <button
            class="mini-player__btn"
            :class="{ 'mini-player__btn--active': player.repeatMode.value !== 'off' }"
            :aria-label="t('player.repeat')"
            @click.stop="player.toggleRepeat()">
            <AppIcon :name="player.repeatMode.value === 'one' ? 'ph:repeat-once' : 'ph:repeat'" />
          </button>
        </div>
      </div>
    </div>

    <div class="mini-player__actions">
      <button
        class="mini-player__action-btn mini-player__action-btn--close"
        :aria-label="t('core.actions.close')"
        @click.stop="closeApp()">
        <AppIcon name="ph:x-bold" />
      </button>
      <button
        class="mini-player__action-btn"
        :aria-label="t('core.exitMiniPlayer')"
        :title="t('core.exitMiniPlayer')"
        @click.stop="layoutStore.toggleMiniPlayer()">
        <AppIcon name="ph:arrows-out" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-player {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-2);
  overflow: hidden;
  z-index: 99999;
  user-select: none;
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;

    &-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(40px) saturate(1.6) brightness(0.3);
      transform: scale(1.2);
    }

    &-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 1;
      mix-blend-mode: screen;
      filter: blur(16px);
      transform: scale(3.5);
    }
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  &__content-wrap {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
  }

  &__bottom {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  &__artwork {
    position: relative;
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }

    &-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.08);
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.4);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  &__meta {
    min-width: 0;
    padding-right: 50px;

    .mini-player__title,
    .mini-player__artist {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }
  }

  &__title {
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
  }

  &__artist {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 1px;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__seek {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    background: transparent;
    cursor: pointer;
    margin: 0;
    padding: 0;

    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 3px;
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(255, 255, 255, 0.9) var(--pct, 0%),
        rgba(255, 255, 255, 0.2) var(--pct, 0%),
        rgba(255, 255, 255, 0.2) 100%
      );
      border-radius: var(--radius-full);
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #fff;
      margin-top: -3.5px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
      transition: transform 0.1s;
    }

    &:hover::-webkit-slider-thumb {
      transform: scale(1.3);
    }

    &::-moz-range-track {
      height: 3px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
    }

    &::-moz-range-progress {
      height: 3px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: var(--radius-full);
    }

    &::-moz-range-thumb {
      width: 10px;
      height: 10px;
      border: none;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    }
  }

  &__times {
    display: flex;
    justify-content: space-between;
    font-size: 0.58rem;
    color: rgba(255, 255, 255, 0.45);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: 0.95rem;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      color: #fff;
    }

    &:disabled {
      opacity: 0.25;
      cursor: default;
    }

    &--active {
      color: var(--color-primary);

      &:hover:not(:disabled) {
        color: var(--color-primary);
        filter: brightness(1.2);
      }
    }

    &--play {
      width: 32px;
      height: 32px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.9);
      color: #111;
      backdrop-filter: blur(4px);

      &:hover:not(:disabled) {
        background: #fff;
        color: #111;
        transform: scale(1.06);
      }

      &:active:not(:disabled) {
        transform: scale(0.94);
      }
    }
  }

  &__actions {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    z-index: 10;
    display: flex;
    gap: 2px;
  }

  &__action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: 0.78rem;
    transition: all 0.15s;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    &--close:hover {
      color: #ff4444;
    }
  }
}
</style>
