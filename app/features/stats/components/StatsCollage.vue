<script setup lang="ts">
import { computed } from 'vue';
import type { TopArtistAggregated } from '../types/stats.types';

interface Props {
  artists: TopArtistAggregated[];
  images: Record<string, string>;
}

const props = defineProps<Props>();

interface CollageRect {
  artist: TopArtistAggregated;
  image: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}

const collageItems = computed<CollageRect[]>(() => {
  const topArtists = props.artists.slice(0, 8); // Top 8 is enough for a collage
  if (topArtists.length === 0) return [];

  let remainingValue = topArtists.reduce((sum, a) => sum + a.playCount, 0);
  const rect = { x: 0, y: 0, w: 100, h: 100 };
  const items: CollageRect[] = [];

  for (const artist of topArtists) {
    if (remainingValue <= 0) break;
    const ratio = artist.playCount / remainingValue;
    const itemRect = { x: 0, y: 0, w: 0, h: 0 };

    if (rect.w > rect.h) {
      itemRect.w = rect.w * ratio;
      itemRect.h = rect.h;
      itemRect.x = rect.x;
      itemRect.y = rect.y;
      rect.x += itemRect.w;
      rect.w -= itemRect.w;
    } else {
      itemRect.h = rect.h * ratio;
      itemRect.w = rect.w;
      itemRect.x = rect.x;
      itemRect.y = rect.y;
      rect.y += itemRect.h;
      rect.h -= itemRect.h;
    }

    items.push({
      artist,
      image: props.images[artist.name] || null,
      ...itemRect
    });
    remainingValue -= artist.playCount;
  }

  return items;
});
</script>

<template>
  <div class="stats-collage">
    <div
      v-for="item in collageItems"
      :key="item.artist.name"
      class="stats-collage__item"
      :style="{
        left: item.x + '%',
        top: item.y + '%',
        width: item.w + '%',
        height: item.h + '%'
      }">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.artist.name"
        class="stats-collage__img"
        loading="lazy" />
      <div v-else class="stats-collage__placeholder">
        <AppIcon name="ph:microphone-stage-fill" />
      </div>
      <div class="stats-collage__overlay">
        <span class="stats-collage__name">{{ item.artist.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stats-collage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 140px;
  min-width: 140px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);

  &__item {
    position: absolute;
    border: 1px solid var(--color-surface);
    overflow: hidden;
    transition: transform 0.3s ease;

    &:hover {
      z-index: 10;
      transform: scale(1.05);
      box-shadow: var(--shadow-lg);
      border-radius: var(--radius-md);

      .stats-collage__overlay {
        opacity: 1;
      }
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    opacity: 0.8;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    padding: var(--space-2);
  }

  &__name {
    color: white;
    font-size: var(--text-xs);
    font-weight: 700;
    text-align: center;
    text-wrap: balance;
  }
}
</style>
