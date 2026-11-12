<script setup lang="ts">
import type { Snowflake } from '@/features/theme/types/theme.types';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
const snowflakes: Snowflake[] = [];
const SNOWFLAKE_COUNT = 45;

function createSnowflake(width: number, height: number, initialY = false): Snowflake {
  return {
    x: Math.random() * width,
    y: initialY ? Math.random() * height : -10,
    radius: Math.random() * 2.2 + 1.2,
    speedY: Math.random() * 0.9 + 0.5,
    speedX: Math.random() * 0.5 - 0.25,
    opacity: Math.random() * 0.55 + 0.35,
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: Math.random() * 0.02 + 0.01
  };
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  resizeCanvas(canvas);
}

function updateAndDraw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < snowflakes.length; i++) {
    const flake = snowflakes[i];
    if (!flake) continue;

    flake.phase += flake.phaseSpeed;
    flake.y += flake.speedY;
    flake.x += flake.speedX + Math.sin(flake.phase) * 0.4;

    if (flake.y > height + 10) {
      snowflakes[i] = createSnowflake(width, height, false);
      continue;
    }

    if (flake.x > width + 10) {
      flake.x = -10;
    } else if (flake.x < -10) {
      flake.x = width + 10;
    }

    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }
}

function animate() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    updateAndDraw(ctx, canvas.width, canvas.height);
  }
  animationFrameId = requestAnimationFrame(animate);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  resizeCanvas(canvas);
  window.addEventListener('resize', handleResize, { passive: true });

  for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
    snowflakes.push(createSnowflake(canvas.width, canvas.height, true));
  }

  animationFrameId = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <canvas ref="canvasRef" class="snow-effect" aria-hidden="true" />
</template>

<style scoped lang="scss">
.snow-effect {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}
</style>
