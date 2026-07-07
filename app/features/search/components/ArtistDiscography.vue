<script setup lang="ts">
import type { SearchResult } from '../types/search.types';

interface Props {
  albums: SearchResult[];
  title: string;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'play' | 'navigate', album: SearchResult): void;
}>();
</script>

<template>
  <section class="artist-discography">
    <h2 class="artist-discography__title">{{ title }}</h2>
    <div class="artist-discography__grid">
      <div
        v-for="album in albums"
        :key="album.id"
        class="artist-discography__card"
        @click="emit('navigate', album)">
        <div class="artist-discography__cover-wrap">
          <img
            v-if="album.thumbnailUrl"
            :src="album.thumbnailUrl"
            :alt="album.title"
            class="artist-discography__cover" />
          <div v-else class="artist-discography__cover artist-discography__cover--empty">
            <AppIcon name="ph:vinyl-record" />
          </div>
          <div class="artist-discography__overlay">
            <button class="artist-discography__play-btn" @click.stop="emit('play', album)">
              <AppIcon name="ph:play-fill" />
            </button>
          </div>
        </div>
        <p class="artist-discography__card-title">{{ album.title }}</p>
        <p class="artist-discography__card-type">
          {{ album.type === 'album' ? 'Album' : 'Single' }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.artist-discography {
  &__title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 1rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1.25rem;
  }

  &__card {
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;

      .artist-discography__overlay {
        opacity: 1;
      }

      .artist-discography__play-btn {
        transform: translateY(0) scale(1);
      }
    }
  }

  &__cover-wrap {
    position: relative;
    border-radius: var(--radius-md);
    overflow: hidden;
    aspect-ratio: 1;
    margin-bottom: 0.6rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  }

  &__cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;

    &--empty {
      background: var(--color-bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: var(--color-text-secondary);
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    align-items: flex-end;
    padding: 0.75rem;
  }

  &__play-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    transform: translateY(8px) scale(0.85);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    box-shadow: 0 4px 12px
      hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.5);
    margin-left: auto;

    &:hover {
      box-shadow: 0 6px 20px
        hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.7);
    }
  }

  &__card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 0 2px;
  }

  &__card-type {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
</style>
