<script setup lang="ts">
const player = usePlayer();
const layoutStore = useLayoutStore();
const { connect: connectVisualizer } = useAudioVisualizer();
const { drawVisualizer } = useCanvasVisualizer();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

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
</script>

<template>
  <Transition name="fade">
    <div v-if="layoutStore.isFullscreenVisualizer" ref="containerRef" class="fullscreen-visualizer">
      <canvas ref="canvasRef" class="fullscreen-visualizer__canvas"></canvas>

      <div class="fullscreen-visualizer__overlay">
        <!-- Close button -->
        <button class="fullscreen-visualizer__close" @click="closeFullscreen">
          <AppIcon name="ph:x-bold" />
        </button>

        <!-- Track Info -->
        <div v-if="player.currentTrack.value" class="fullscreen-visualizer__info">
          <img
            v-if="player.currentTrack.value.thumbnailUrl"
            :src="player.currentTrack.value.thumbnailUrl"
            class="fullscreen-visualizer__thumbnail"
            alt="Thumbnail" />
          <div class="fullscreen-visualizer__text">
            <div class="fullscreen-visualizer__title">{{ player.currentTrack.value.title }}</div>
            <div class="fullscreen-visualizer__artist">{{ player.currentTrack.value.artist }}</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.fullscreen-visualizer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: var(--color-bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  --bass-scale: 1;

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
  }

  &__close {
    pointer-events: auto;
    align-self: flex-end;
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

  &__info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    pointer-events: auto;
    margin-bottom: 2rem;
    margin-left: 2rem;
  }

  &__thumbnail {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-md);
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  &__artist {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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
