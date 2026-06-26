<script setup lang="ts">
const playerStore = usePlayerStore();
const player = usePlayer();
const { t } = useI18n({ useScope: 'global' });

const orderOptions = computed(() => [
  { label: t('player.orderSequential'), value: 'sequential', icon: 'ph:arrow-right' },
  { label: t('player.orderRandom'), value: 'random', icon: 'ph:shuffle' },
  { label: t('player.orderReverse'), value: 'reverse', icon: 'ph:arrow-u-up-left' }
]);

// We need to keep a local copy for the drag and drop to work smoothly without layout thrashing
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function handleDragStart(event: DragEvent, index: number) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    // We just need some data to make it draggable in Firefox
    event.dataTransfer.setData('text/plain', index.toString());
  }
  dragIndex.value = index;
}

function handleDragEnter(event: DragEvent, index: number) {
  event.preventDefault();
  dragOverIndex.value = index;
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault(); // Necessary to allow dropping
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverIndex.value = index;
}

function handleDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function handleDrop(event: DragEvent, toIndex: number) {
  event.preventDefault();
  const fromIndex = dragIndex.value;

  if (fromIndex !== null && fromIndex !== toIndex) {
    playerStore.reorderQueue(fromIndex, toIndex);
  }

  dragIndex.value = null;
  dragOverIndex.value = null;
}

function playQueueTrack(index: number) {
  const track = playerStore.queue[index];
  if (track) {
    player.playTrack(track);
  }
}
</script>

<template>
  <div class="player-queue">
    <div class="player-queue__header">
      <div class="player-queue__header-top">
        <h3 class="player-queue__title">{{ $t('player.queue') }}</h3>
        <button
          v-if="playerStore.queue.length > 0"
          class="player-queue__clear-btn"
          @click="playerStore.clearQueue()">
          {{ $t('player.clearQueue') }}
        </button>
      </div>
      <div class="player-queue__order-select">
        <AppSelect v-model="playerStore.playbackOrder" :options="orderOptions" />
      </div>
    </div>

    <div v-if="playerStore.queue.length === 0" class="player-queue__empty">
      <AppIcon name="ph:queue-duotone" class="player-queue__empty-icon" />
      <p class="player-queue__empty-text">{{ $t('player.queueEmpty') }}</p>
    </div>

    <ul v-else class="player-queue__list" @dragend="handleDragEnd">
      <li
        v-for="(track, index) in playerStore.queue"
        :key="track.videoId + '-' + index"
        draggable="true"
        class="player-queue__item"
        :class="{
          'player-queue__item--dragging': dragIndex === index,
          'player-queue__item--drag-over': dragOverIndex === index,
          'player-queue__item--playing': playerStore.currentTrack?.videoId === track.videoId
        }"
        @dragstart="handleDragStart($event, index)"
        @dragenter="handleDragEnter($event, index)"
        @dragover="handleDragOver($event, index)"
        @drop="handleDrop($event, index)">
        <div class="player-queue__drag-handle">
          <AppIcon name="ph:dots-six-vertical" />
        </div>

        <div class="player-queue__track-info" @click="playQueueTrack(index)">
          <div class="player-queue__track-thumb">
            <img v-if="track.thumbnailUrl" :src="track.thumbnailUrl" :alt="track.title" />
            <div v-else class="player-queue__track-thumb-placeholder">
              <AppIcon name="ph:music-notes" />
            </div>
          </div>

          <div class="player-queue__track-text">
            <span class="player-queue__track-title">{{ track.title }}</span>
            <span class="player-queue__track-artist">{{ track.artist }}</span>
          </div>
        </div>

        <button
          class="player-queue__remove-btn"
          :title="$t('player.removeFromQueue')"
          @click.stop="playerStore.removeFromQueue(index)">
          <AppIcon name="ph:x" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.player-queue {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.player-queue__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.player-queue__header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-queue__order-select {
  width: 100%;
}

.player-queue__title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.player-queue__clear-btn {
  background: transparent;
  border: none;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);

  &:hover {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  }
}

.player-queue__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
}

.player-queue__empty-icon {
  font-size: 3rem;
  opacity: 0.4;
}

.player-queue__empty-text {
  font-size: var(--text-sm);
  margin: 0;
}

.player-queue__list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: var(--space-2);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--radius-full);
  }
}

.player-queue__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: transparent;
  transition: background-color var(--transition-fast);

  &:hover {
    background: var(--color-surface-hover);

    .player-queue__drag-handle {
      opacity: 0.7;
    }

    .player-queue__remove-btn {
      opacity: 1;
    }
  }

  &--dragging {
    opacity: 0.4;
    background: var(--color-surface-hover);
  }

  &--drag-over {
    border-top: 2px solid var(--color-primary);
  }

  &--playing {
    .player-queue__track-title {
      color: var(--color-primary);
    }
  }
}

.player-queue__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 1.25rem;
  opacity: 0;
  cursor: grab;
  padding: var(--space-1);
  transition: opacity var(--transition-fast);

  &:active {
    cursor: grabbing;
  }
}

.player-queue__track-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  cursor: pointer;
}

.player-queue__track-thumb {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface-hover);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.player-queue__track-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 1.25rem;
}

.player-queue__track-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.player-queue__track-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-queue__track-artist {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-queue__remove-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 15%, transparent);
  }
}
</style>
