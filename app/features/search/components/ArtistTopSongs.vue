<script setup lang="ts">
import type { TrackListItem } from '@/components/shared/TrackList.vue';

interface Props {
  tracks: TrackListItem[];
  title: string;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'play', track: TrackListItem, index: number): void;
}>();

const { currentTrack, isPlaying } = usePlayer();
</script>

<template>
  <section class="artist-top-songs">
    <h2 class="artist-top-songs__title">{{ title }}</h2>
    <div class="artist-top-songs__list">
      <div
        v-for="(track, index) in tracks"
        :key="track.id"
        class="artist-top-songs__row"
        :class="{ 'artist-top-songs__row--active': currentTrack?.videoId === track.id }"
        @click="emit('play', track, index)">
        <div class="artist-top-songs__index">
          <span v-if="currentTrack?.videoId !== track.id" class="artist-top-songs__num">
            {{ index + 1 }}
          </span>
          <span v-else-if="isPlaying" class="artist-top-songs__bars">
            <span />
            <span />
            <span />
          </span>
          <AppIcon v-else name="ph:pause-fill" class="artist-top-songs__pause-icon" />

          <AppIcon name="ph:play-fill" class="artist-top-songs__play-icon" />
        </div>

        <img
          v-if="track.thumbnailUrl"
          :src="track.thumbnailUrl"
          :alt="track.title"
          class="artist-top-songs__thumb" />
        <div v-else class="artist-top-songs__thumb artist-top-songs__thumb--empty">
          <AppIcon name="ph:music-note" />
        </div>

        <div class="artist-top-songs__info">
          <span
            class="artist-top-songs__track-title"
            :class="{
              'artist-top-songs__track-title--active': currentTrack?.videoId === track.id
            }">
            {{ track.title }}
          </span>
          <span class="artist-top-songs__track-artist">{{ track.artist }}</span>
        </div>

        <span class="artist-top-songs__duration">
          {{
            track.durationSeconds
              ? `${Math.floor(track.durationSeconds / 60)}:${String(track.durationSeconds % 60).padStart(2, '0')}`
              : ''
          }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.artist-top-songs {
  &__title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 1rem;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row {
    display: grid;
    grid-template-columns: 2.5rem 3rem 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--color-bg-elevated);

      .artist-top-songs__num {
        display: none;
      }

      .artist-top-songs__play-icon {
        display: block;
      }
    }

    &--active {
      .artist-top-songs__num {
        display: none;
      }
    }
  }

  &__index {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: relative;
  }

  &__num {
    font-size: 0.95rem;
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
  }

  &__play-icon {
    display: none;
    color: var(--color-text-primary);
    font-size: 1rem;
  }

  &__pause-icon {
    color: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
    font-size: 1rem;
  }

  &__bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 16px;

    span {
      width: 3px;
      background: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
      border-radius: 2px;
      animation: eq-bar 0.9s ease-in-out infinite;

      &:nth-child(1) {
        height: 60%;
        animation-delay: 0s;
      }

      &:nth-child(2) {
        height: 100%;
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        height: 40%;
        animation-delay: 0.4s;
      }
    }
  }

  &__thumb {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;

    &--empty {
      background: var(--color-bg-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  &__track-title {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--active {
      color: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
    }
  }

  &__track-artist {
    font-size: 0.78rem;
    color: var(--color-text-secondary);
  }

  &__duration {
    font-size: 0.82rem;
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

@keyframes eq-bar {
  0%,
  100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}
</style>
