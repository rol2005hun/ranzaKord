<script setup lang="ts">
import type { SearchResult } from '../types/search.types';

interface Props {
  track: SearchResult;
}

const props = defineProps<Props>();

const player = usePlayer();

const isCurrentTrack = computed(() => player.currentTrack.value?.videoId === props.track.id);

function formatTime(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const emit = defineEmits<{
  (e: 'play', track: SearchResult): void;
}>();

function onPlay() {
  emit('play', props.track);
}

const showAddToPlaylist = ref(false);
const addBtnRef = ref<HTMLElement | null>(null);

const playlistsStore = usePlaylistsStore();
const isInAnyPlaylist = computed(() => playlistsStore.isTrackInAnyPlaylist(props.track.id));
</script>

<template>
  <article class="track-card" :class="{ 'track-card--active': isCurrentTrack }" @click="onPlay">
    <div class="track-card__thumbnail">
      <img
        v-if="track.thumbnailUrl"
        :src="`/api/image?url=${encodeURIComponent(track.thumbnailUrl)}`"
        :alt="track.title"
        class="track-card__img"
        fetchpriority="high" />
      <div v-else class="track-card__img-placeholder">
        <AppIcon name="ph:music-note" />
      </div>

      <div class="track-card__overlay">
        <div class="track-card__overlay-actions">
          <button
            ref="addBtnRef"
            class="track-card__add-btn"
            :aria-label="$t('playlists.addToPlaylist') || 'Add to playlist'"
            @click.stop="showAddToPlaylist = !showAddToPlaylist">
            <AppIcon v-if="isInAnyPlaylist" name="ph:check-circle-fill" class="text-success" />
            <AppIcon v-else name="ph:plus-circle" />
          </button>
          <button class="track-card__play-btn" :aria-label="$t('player.play')" @click.stop="onPlay">
            <AppIcon v-if="isCurrentTrack && player.isPlaying.value" name="ph:pause-fill" />
            <AppIcon v-else name="ph:play-fill" />
          </button>
        </div>
      </div>

      <div v-if="isCurrentTrack" class="track-card__playing-indicator">
        <span class="track-card__bar" />
        <span class="track-card__bar" />
        <span class="track-card__bar" />
      </div>
    </div>

    <div class="track-card__info">
      <p class="track-card__title">{{ track.title }}</p>
      <p class="track-card__artist">{{ track.artist }}</p>
      <p v-if="track.durationSeconds" class="track-card__duration">
        {{ formatTime(track.durationSeconds) }}
      </p>
    </div>

    <AddToPlaylistPopup
      v-if="showAddToPlaylist"
      :track="{
        videoId: track.id,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        durationMs: (track.durationSeconds || 0) * 1000
      }"
      :anchor="addBtnRef"
      @close="showAddToPlaylist = false" />
  </article>
</template>

<style lang="scss" scoped>
.track-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  overflow: hidden;
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);

  &:hover {
    transform: translateY(-4px);
    border-color: var(--color-border-focus);
    box-shadow: var(--glow-primary, var(--shadow-lg));

    .track-card__overlay {
      opacity: 1;
    }
  }

  &--active {
    border-color: var(--color-primary);
    box-shadow: var(--glow-primary, var(--shadow-md));
  }

  &__thumbnail {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--color-surface-hover);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow);

    .track-card:hover & {
      transform: scale(1.05);
    }
  }

  &__img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: var(--color-text-disabled);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: var(--gradient-card, linear-gradient(transparent 40%, rgb(0 0 0 / 0.6) 100%));
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: var(--space-3);
    opacity: 0;
    transition: opacity var(--transition-base);

    .track-card--active & {
      opacity: 1;
    }
  }

  &__overlay-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__add-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    border: none;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: var(--text-xl);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--transition-fast),
      transform var(--transition-fast);

    &:hover {
      background: var(--color-primary);
      color: #fff;
      transform: scale(1.1);
    }
  }

  &__play-btn {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    border: none;
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    font-size: var(--text-xl);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition:
      transform var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      background: var(--color-primary-hover);
      transform: scale(1.1);
    }
  }

  &__playing-indicator {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 16px;
  }

  &__bar {
    width: 3px;
    background: var(--color-primary);
    border-radius: 2px;
    animation: equalizer 0.8s ease-in-out infinite alternate;

    &:nth-child(1) {
      height: 6px;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      height: 14px;
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      height: 10px;
      animation-delay: 0.4s;
    }
  }

  &__info {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color var(--transition-fast);
  }

  &__artist {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__duration {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin-top: 4px;
    font-variant-numeric: tabular-nums;
  }
}

.text-success {
  color: hsl(140, 60%, 50%) !important;
}

@keyframes equalizer {
  from {
    transform: scaleY(0.4);
  }
  to {
    transform: scaleY(1);
  }
}
</style>
