<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStatsStore } from '../stores/useStatsStore';

const statsStore = useStatsStore();
const playerStore = usePlayerStore();
const { t } = useI18n();

onMounted(() => {
  statsStore.fetchStats();
});

const totalHours = computed(() => Math.floor(statsStore.totalListeningSeconds / 3600));
const totalMinutes = computed(() => Math.floor((statsStore.totalListeningSeconds % 3600) / 60));

function playTrack(index: number) {
  const tracksToPlay = statsStore.topTracks.map((t) => ({
    videoId: t.trackId,
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl || '',
    durationSeconds: t.totalDurationSeconds
  }));
  playerStore.setQueue(tracksToPlay);
  const track = tracksToPlay[index];
  if (track) {
    playerStore.setTrack(track);
    playerStore.isPlaying = true;
  }
}
</script>

<template>
  <div class="stats-dashboard">
    <div class="stats-dashboard__header">
      <div class="stats-dashboard__header-content">
        <h1 class="stats-dashboard__title">{{ t('stats.title') }}</h1>
        <p class="stats-dashboard__subtitle">{{ t('stats.description') }}</p>
      </div>

      <div class="stats-dashboard__total">
        <span class="stats-dashboard__total-label">{{ t('stats.totalListeningTime') }}</span>
        <div class="stats-dashboard__total-value">
          <span v-if="totalHours > 0">
            {{ totalHours }}
            <small>{{ t('stats.hours') }}</small>
          </span>
          <span>
            {{ totalMinutes }}
            <small>{{ t('stats.minutes') }}</small>
          </span>
        </div>
      </div>
    </div>

    <div v-if="statsStore.isLoading" class="stats-dashboard__loading">
      <AppSpinner size="lg" />
    </div>

    <div v-else-if="statsStore.topTracks.length === 0" class="stats-dashboard__empty">
      <AppIcon name="ph:music-notes-simple-duotone" />
      <p>{{ t('stats.empty') }}</p>
    </div>

    <div v-else class="stats-dashboard__content">
      <section class="stats-section stats-section--artists">
        <h2 class="stats-section__title">
          <AppIcon name="ph:microphone-stage-duotone" />
          {{ t('stats.topArtists') }}
        </h2>
        <div class="stats-list">
          <div
            v-for="(artist, index) in statsStore.topArtists.slice(0, 10)"
            :key="artist.name"
            class="stats-artist">
            <span class="stats-artist__rank">#{{ index + 1 }}</span>
            <div class="stats-artist__info">
              <span class="stats-artist__name">{{ artist.name }}</span>
              <span class="stats-artist__plays">
                {{ t('stats.plays', { count: artist.playCount }) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-section stats-section--tracks">
        <h2 class="stats-section__title">
          <AppIcon name="ph:music-notes-duotone" />
          {{ t('stats.topTracks') }}
        </h2>
        <div class="stats-list">
          <div
            v-for="(track, index) in statsStore.topTracks.slice(0, 10)"
            :key="track.trackId"
            class="stats-track"
            @click="playTrack(index)">
            <span class="stats-track__rank">#{{ index + 1 }}</span>
            <NuxtImg
              v-if="track.thumbnailUrl"
              :src="track.thumbnailUrl"
              :alt="track.title"
              class="stats-track__image"
              width="48"
              height="48"
              loading="lazy" />
            <div v-else class="stats-track__image stats-track__image--placeholder">
              <AppIcon name="ph:music-note-bold" />
            </div>

            <div class="stats-track__info">
              <span class="stats-track__title">{{ track.title }}</span>
              <span class="stats-track__artist">{{ track.artist }}</span>
            </div>

            <div class="stats-track__stats">
              <span class="stats-track__plays">
                {{ t('stats.plays', { count: track.playCount }) }}
              </span>
            </div>

            <button class="stats-track__play-btn">
              <AppIcon name="ph:play-fill" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stats-dashboard {
  padding: var(--space-6) var(--space-8);
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: var(--space-4);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--space-8);
    background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.2) 0%, transparent 100%);
    padding: var(--space-8);
    border-radius: var(--radius-2xl);
    border: 1px solid var(--color-surface-raised);

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-6);
      padding: var(--space-6);
    }
  }

  &__title {
    font-size: 3rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(90deg, var(--color-text-primary), var(--color-primary));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -1px;
  }

  &__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    margin: var(--space-2) 0 0 0;
  }

  &__total {
    text-align: right;

    @media (max-width: 768px) {
      text-align: left;
    }
  }

  &__total-label {
    display: block;
    text-transform: uppercase;
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--color-primary);
    margin-bottom: var(--space-1);
  }

  &__total-value {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
    display: flex;
    gap: var(--space-2);
    align-items: baseline;

    small {
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-left: 2px;
    }
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) 0;
    color: var(--color-text-secondary);

    svg {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }
  }

  &__content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-8);

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }
}

.stats-section {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid var(--color-surface-raised);

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xl);
    font-weight: 700;
    margin: 0 0 var(--space-6) 0;
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-surface-raised);

    svg {
      color: var(--color-primary);
    }
  }
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stats-artist {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-surface-raised);
    transform: translateX(4px);
  }

  &__rank {
    font-weight: 700;
    color: var(--color-primary);
    width: 40px;
    font-size: var(--text-lg);
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-base);
  }

  &__plays {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

.stats-track {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    background: var(--color-surface-raised);

    .stats-track__play-btn {
      opacity: 1;
      transform: scale(1);
    }
  }

  &__rank {
    font-weight: 700;
    color: var(--color-primary);
    width: 40px;
    font-size: var(--text-lg);
  }

  &__image {
    border-radius: var(--radius-md);
    margin-right: var(--space-4);
    object-fit: cover;

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface-raised);
      color: var(--color-text-secondary);
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-weight: 600;
    font-size: var(--text-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__stats {
    text-align: right;
    margin-left: var(--space-4);
    margin-right: var(--space-8);

    @media (max-width: 640px) {
      display: none;
    }
  }

  &__plays {
    font-size: var(--text-sm);
    color: var(--color-primary);
    font-weight: 600;
    background: rgba(var(--color-primary-rgb), 0.1);
    padding: 2px 8px;
    border-radius: 12px;
  }

  &__play-btn {
    position: absolute;
    right: var(--space-4);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: none;

    &:hover {
      transform: scale(1.1);
    }
  }
}
</style>
