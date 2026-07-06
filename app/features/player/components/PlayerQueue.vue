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

const isHydrated = ref(false);
onMounted(() => {
  isHydrated.value = true;
});
</script>

<template>
  <div class="player-queue">
    <div class="player-queue__header">
      <div class="player-queue__header-top">
        <h3 class="player-queue__title">{{ $t('player.queue') }}</h3>
        <button
          v-if="isHydrated && playerStore.queue.length > 0"
          class="player-queue__clear-btn"
          @click="playerStore.clearQueue()">
          {{ $t('player.clearQueue') }}
        </button>
      </div>
      <div class="player-queue__order-select">
        <ClientOnly>
          <button
            class="player-queue__autoplay-btn"
            :class="{ 'player-queue__autoplay-btn--active': playerStore.autoplayEnabled }"
            :title="$t('player.autoplay')"
            @click="playerStore.autoplayEnabled = !playerStore.autoplayEnabled">
            <AppIcon name="ph:infinity" />
          </button>
          <AppSelect v-model="playerStore.playbackOrder" :options="orderOptions" />
          <template #fallback>
            <div class="skeleton-box" style="height: 32px; border-radius: var(--radius-sm)"></div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <div v-if="!isHydrated" class="player-queue__list player-queue__list--skeleton">
      <div v-for="i in 20" :key="i" class="player-queue__item">
        <div class="player-queue__num-wrapper">
          <div class="skeleton-box" style="width: 12px; height: 16px; border-radius: 4px"></div>
        </div>
        <div class="player-queue__track-info">
          <div class="player-queue__track-thumb skeleton-box"></div>
          <div class="player-queue__track-text" style="gap: 4px">
            <div class="skeleton-box" style="width: 140px; height: 16px; max-width: 70%"></div>
            <div class="skeleton-box" style="width: 100px; height: 12px; max-width: 50%"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="playerStore.queue.length === 0" class="player-queue__empty">
      <AppIcon name="ph:queue-duotone" class="player-queue__empty-icon" />
      <p class="player-queue__empty-text">{{ $t('player.queueEmpty') }}</p>
    </div>

    <ul v-else class="player-queue__list" @dragend="handleDragEnd">
      <template
        v-for="(track, index) in playerStore.visibleQueue"
        :key="track.queueId || track.videoId + '-' + (playerStore.visibleQueueStartIndex + index)">
        <li
          v-if="
            track.isRadio &&
            (playerStore.visibleQueueStartIndex + index === 0 ||
              !playerStore.queue[playerStore.visibleQueueStartIndex + index - 1]?.isRadio)
          "
          class="player-queue__radio-divider">
          <AppIcon name="ph:radio" class="player-queue__radio-divider-icon" />
          <span>{{ $t('player.radioSection') }}</span>
        </li>
        <li
          draggable="true"
          class="player-queue__item"
          :class="{
            'player-queue__item--dragging':
              dragIndex === playerStore.visibleQueueStartIndex + index,
            'player-queue__item--drag-over':
              dragOverIndex === playerStore.visibleQueueStartIndex + index,
            'player-queue__item--playing': playerStore.currentTrack?.queueId
              ? playerStore.currentTrack.queueId === track.queueId
              : playerStore.currentTrack?.videoId === track.videoId,
            'player-queue__item--radio': track.isRadio
          }"
          @dragstart="handleDragStart($event, playerStore.visibleQueueStartIndex + index)"
          @dragenter="handleDragEnter($event, playerStore.visibleQueueStartIndex + index)"
          @dragover="handleDragOver($event, playerStore.visibleQueueStartIndex + index)"
          @drop="handleDrop($event, playerStore.visibleQueueStartIndex + index)">
          <div class="player-queue__num-wrapper">
            <span
              v-if="
                playerStore.currentTrack?.queueId
                  ? playerStore.currentTrack.queueId === track.queueId
                  : playerStore.currentTrack?.videoId === track.videoId
              "
              class="player-queue__playing-icon">
              <AppIcon name="ph:speaker-high-fill" class="text-primary" />
            </span>
            <span v-else class="player-queue__num">
              {{ playerStore.visibleQueueStartIndex + index + 1 }}
            </span>
            <div class="player-queue__drag-handle">
              <AppIcon name="ph:dots-six-vertical" />
            </div>
          </div>

          <div
            class="player-queue__track-info"
            @click="playQueueTrack(playerStore.visibleQueueStartIndex + index)">
            <div class="player-queue__track-thumb">
              <img
                v-if="track.thumbnailUrl"
                :src="track.thumbnailUrl"
                :alt="track.title"
                loading="lazy" />
              <div v-else class="player-queue__track-thumb-placeholder">
                <AppIcon name="ph:music-notes" />
              </div>
            </div>

            <div class="player-queue__track-text">
              <span
                class="player-queue__track-title"
                :class="{
                  'text-primary': playerStore.currentTrack?.queueId
                    ? playerStore.currentTrack.queueId === track.queueId
                    : playerStore.currentTrack?.videoId === track.videoId
                }">
                {{ track.title }}
              </span>
              <AppTrackArtists :track="track" class="player-queue__track-artist" />
            </div>
          </div>

          <button
            class="player-queue__remove-btn"
            :title="$t('player.removeFromQueue')"
            @click.stop="playerStore.removeFromQueue(playerStore.visibleQueueStartIndex + index)">
            <AppIcon name="ph:x" />
          </button>
        </li>
      </template>
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

  &--skeleton {
    overflow-y: hidden;
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

.player-queue__num-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
  position: relative;
}

.player-queue__num,
.player-queue__playing-icon {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  transition: opacity var(--transition-fast);
}

.player-queue__drag-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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

.player-queue__item:hover {
  .player-queue__num,
  .player-queue__playing-icon {
    opacity: 0;
  }

  .player-queue__drag-handle {
    opacity: 0.7;
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
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-queue__remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);

  &:hover {
    background: color-mix(in srgb, var(--color-danger) 10%, transparent);
    color: var(--color-danger);
  }
}

.skeleton-box {
  background: var(--color-surface-raised, #1a1a3a);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.player-queue__order-select {
  padding: 0 var(--space-4) var(--space-2) var(--space-4);
  display: flex;
  gap: 0;
}

.player-queue__autoplay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  align-self: stretch;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  border: 1px solid var(--color-border);
  border-right: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-border-hover);
    color: var(--color-text-primary);
  }

  &--active {
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
    border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
    border-right: none;
  }
}

.player-queue__order-select :deep(.app-select) {
  flex: 1;
}

.player-queue__order-select :deep(.select-container) {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.player-queue__radio-divider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2) var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  opacity: 0.6;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  list-style: none;

  &::before {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
}

.player-queue__radio-divider-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.player-queue__item--radio {
  border-left: 2px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
  padding-left: calc(var(--space-2) - 2px);
}
</style>
