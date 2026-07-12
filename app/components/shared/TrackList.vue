<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import OfflineDownloadButton from '@/features/offline/components/DownloadButton.vue';

const player = usePlayer();

export interface TrackItemArtist {
  name: string;
  channelId?: string;
}

export interface TrackListItem {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  artists?: TrackItemArtist[];
  thumbnailUrl?: string | null;
  durationSeconds: number;
  addedAt?: string;
  addedBy?: { sub: string; name: string; picture: string } | string;
  isPlaying?: boolean;
  plays?: string;
}

export type TrackListColumn = 'index' | 'title' | 'date' | 'time' | 'plays' | 'action' | 'download';

export interface VirtualTrackItem {
  index: number;
  data: TrackListItem | null;
}

interface Props {
  tracks?: TrackListItem[];
  virtual?: boolean;
  visibleItems?: VirtualTrackItem[];
  offsetY?: number;
  totalHeight?: number;
  columns?: TrackListColumn[];
  showThumbnails?: boolean;
  itemHeight?: number;
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  reorderable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tracks: () => [],
  visibleItems: () => [],
  offsetY: 0,
  totalHeight: 0,
  columns: () => ['index', 'title', 'time'],
  showThumbnails: false,
  virtual: false,
  itemHeight: 56,
  isLoading: false,
  sortBy: '',
  sortOrder: 'asc',
  reorderable: false
});

const emit = defineEmits<{
  (e: 'play' | 'remove', track: TrackListItem, index: number): void;
  (e: 'sort', by: string, order: 'asc' | 'desc'): void;
  (e: 'reorder', fromIndex: number, toIndex: number): void;
}>();

function handleSort(column: string): void {
  if (props.sortBy === column) {
    if (props.sortOrder === 'asc') {
      emit('sort', column, 'desc');
    } else {
      emit('sort', '', 'asc');
    }
  } else {
    emit('sort', column, 'asc');
  }
}

const hoveredTrackId = ref<string | null>(null);

const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function handleDragStart(event: DragEvent, index: number) {
  if (!props.reorderable) return;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
  dragIndex.value = index;
}

function handleDragEnter(event: DragEvent, index: number) {
  if (!props.reorderable) return;
  event.preventDefault();
  dragOverIndex.value = index;
}

function handleDragOver(event: DragEvent, index: number) {
  if (!props.reorderable) return;
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverIndex.value = index;
}

function handleDragEnd() {
  if (!props.reorderable) return;
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function handleDrop(event: DragEvent, toIndex: number) {
  if (!props.reorderable) return;
  event.preventDefault();
  const fromIndex = dragIndex.value;

  if (fromIndex !== null && fromIndex !== toIndex) {
    emit('reorder', fromIndex, toIndex);
  }

  dragIndex.value = null;
  dragOverIndex.value = null;
}

const hasDateColumn = computed(() => props.columns.includes('date'));
const hasActionColumn = computed(() => props.columns.includes('action'));
const hasDownloadColumn = computed(() => props.columns.includes('download'));
const hasTimeColumn = computed(() => props.columns.includes('time'));
const hasPlaysColumn = computed(() => props.columns.includes('plays'));

const gridColumns = computed(() => {
  const cols = ['var(--track-list-idx, 48px)', '1fr'];
  if (hasDateColumn.value) cols.push('var(--track-list-date, 160px)');
  if (hasPlaysColumn.value) cols.push('var(--track-list-plays, 120px)');
  if (hasTimeColumn.value) cols.push('var(--track-list-time, 60px)');
  if (hasDownloadColumn.value || hasActionColumn.value) cols.push('auto');
  return cols.join(' ');
});

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

const isHydrated = ref(false);
onMounted(() => {
  isHydrated.value = true;
});
</script>

<template>
  <div class="app-track-list">
    <div class="app-track-list__header" :style="{ gridTemplateColumns: gridColumns }">
      <div class="app-track-list__col-index">#</div>
      <div
        class="app-track-list__col-title app-track-list__col-sortable"
        @click="handleSort('title')">
        {{ $t('core.musicDetail.titleColumn', 'CÍM') }}
        <AppIcon
          v-if="sortBy === 'title'"
          :name="sortOrder === 'asc' ? 'ph:arrow-up' : 'ph:arrow-down'"
          class="app-track-list__sort-icon" />
      </div>
      <div
        v-if="hasDateColumn"
        class="app-track-list__col-date app-track-list__col-sortable"
        @click="handleSort('date')">
        {{ $t('playlists.addedAt', 'Dátum') }}
        <AppIcon
          v-if="sortBy === 'date'"
          :name="sortOrder === 'asc' ? 'ph:arrow-up' : 'ph:arrow-down'"
          class="app-track-list__sort-icon" />
      </div>
      <div v-if="hasPlaysColumn" class="app-track-list__col-plays">
        <AppIcon name="ph:eye" />
      </div>
      <div
        v-if="hasTimeColumn"
        class="app-track-list__col-time app-track-list__col-sortable"
        @click="handleSort('duration')">
        <AppIcon name="ph:clock" />
        <AppIcon
          v-if="sortBy === 'duration'"
          :name="sortOrder === 'asc' ? 'ph:arrow-up' : 'ph:arrow-down'"
          class="app-track-list__sort-icon" />
      </div>
      <div v-if="hasDownloadColumn" class="app-track-list__col-action"></div>
      <div v-if="hasActionColumn" class="app-track-list__col-action"></div>
    </div>

    <!-- VIRTUAL CONTAINER -->
    <div v-if="virtual" class="app-track-list__virtual-container">
      <div class="app-track-list__virtual-spacer" :style="{ height: `${totalHeight}px` }">
        <div
          class="app-track-list__virtual-window"
          :style="{ transform: `translateY(${offsetY}px)` }">
          <div
            v-for="{ index, data: track } in visibleItems"
            :key="index"
            class="app-track-list__track"
            :class="{
              'app-track-list__track--playing':
                isHydrated && track && player.currentTrack.value?.videoId === track.id,
              'app-track-list__track--skeleton': !track,
              'app-track-list__track--dragged': dragIndex === index,
              'app-track-list__track--drag-over': dragOverIndex === index
            }"
            :style="{ height: `${itemHeight}px`, gridTemplateColumns: gridColumns }"
            :draggable="reorderable && !!track"
            @dragstart="track && handleDragStart($event, index)"
            @dragenter="track && handleDragEnter($event, index)"
            @dragover="track && handleDragOver($event, index)"
            @dragend="track && handleDragEnd()"
            @drop="track && handleDrop($event, index)"
            @click="track && emit('play', track, index)"
            @mouseenter="track && (hoveredTrackId = track.id)"
            @mouseleave="hoveredTrackId = null">
            <template v-if="!track">
              <div class="app-track-list__track-num-wrapper">
                <div class="skeleton-box" style="height: 14px; width: 16px"></div>
              </div>
              <div class="app-track-list__track-info">
                <div v-if="showThumbnails" class="app-track-list__track-thumb skeleton-box"></div>
                <div class="app-track-list__track-text">
                  <div
                    class="skeleton-box"
                    style="height: 16px; width: 220px; max-width: 70%"></div>
                  <div
                    class="skeleton-box"
                    style="height: 12px; width: 140px; max-width: 50%; margin-top: 4px"></div>
                </div>
              </div>
              <div
                v-if="hasDateColumn"
                class="skeleton-box"
                style="height: 14px; width: 80px"></div>
              <div
                v-if="hasPlaysColumn"
                class="skeleton-box"
                style="height: 14px; width: 60px"></div>
              <div
                v-if="hasTimeColumn"
                class="skeleton-box"
                style="height: 14px; width: 40px"></div>
              <div v-if="hasDownloadColumn"></div>
              <div v-if="hasActionColumn"></div>
            </template>

            <template v-else>
              <div class="app-track-list__track-num-wrapper">
                <ClientOnly>
                  <div style="display: contents">
                    <span
                      class="app-track-list__track-num"
                      :class="{
                        'app-track-list__track-num--playing':
                          isHydrated && player.currentTrack.value?.videoId === track.id
                      }">
                      <AppPlayingIndicator
                        v-if="isHydrated && player.currentTrack.value?.videoId === track.id"
                        data-allow-mismatch
                        class="text-primary" />
                      <template v-else>{{ index + 1 }}</template>
                    </span>
                    <div class="app-track-list__track-play">
                      <AppSpinner
                        v-if="
                          isHydrated &&
                          player.currentTrack.value?.videoId === track.id &&
                          player.isLoading.value
                        "
                        size="sm" />
                      <AppIcon
                        v-else
                        data-allow-mismatch
                        :name="
                          isHydrated &&
                          player.currentTrack.value?.videoId === track.id &&
                          player.isPlaying.value
                            ? 'ph:pause-fill'
                            : 'ph:play-fill'
                        " />
                    </div>
                  </div>
                  <template #fallback>
                    <span class="app-track-list__track-num">{{ index + 1 }}</span>
                  </template>
                </ClientOnly>
              </div>

              <div class="app-track-list__track-info">
                <div
                  v-if="showThumbnails && track.thumbnailUrl"
                  class="app-track-list__track-thumb">
                  <NuxtImg
                    :src="track.thumbnailUrl"
                    :alt="track.title"
                    width="40"
                    height="40"
                    format="webp"
                    loading="lazy" />
                </div>
                <div class="app-track-list__track-text">
                  <span
                    class="app-track-list__track-title"
                    :class="{
                      'text-primary': isHydrated && player.currentTrack.value?.videoId === track.id
                    }">
                    {{ track.title }}
                  </span>
                  <div class="app-track-list__track-artist">
                    <AppTrackArtists :track="track" class="artists-list" />
                  </div>
                </div>
              </div>

              <div v-if="hasDateColumn" class="app-track-list__track-date">
                <span>{{ formatDate(track.addedAt) }}</span>
                <NuxtLink
                  v-if="track.addedBy && typeof track.addedBy === 'object'"
                  :to="`/user/${track.addedBy.sub}`"
                  class="app-track-list__track-added group relative cursor-pointer"
                  @click.stop>
                  <img
                    v-if="track.addedBy.picture"
                    :src="track.addedBy.picture"
                    :alt="track.addedBy.name"
                    class="w-5 h-5 rounded-full object-cover" />
                  <AppIcon v-else name="ph:user-circle" class="text-xl" />
                  <span
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-[var(--color-bg-elevated)] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-[var(--color-border)] shadow-lg">
                    Hozzáadta: {{ track.addedBy.name }}
                  </span>
                </NuxtLink>
                <span v-else-if="track.addedBy" class="app-track-list__track-added">
                  <AppIcon name="ph:user" />
                  {{ track.addedBy }}
                </span>
              </div>

              <span v-if="hasPlaysColumn" class="app-track-list__track-plays">
                {{ track.plays || '-' }}
              </span>

              <span v-if="hasTimeColumn" class="app-track-list__track-duration">
                {{ formatDuration(track.durationSeconds) }}
              </span>

              <Transition name="action-slide">
                <div
                  v-if="(hasDownloadColumn || hasActionColumn) && hoveredTrackId === track.id"
                  class="app-track-list__actions-wrapper"
                  @click.stop>
                  <div class="app-track-list__actions-inner">
                    <div v-if="hasDownloadColumn" class="app-track-list__track-action">
                      <ClientOnly>
                        <OfflineDownloadButton
                          v-if="track"
                          :track="{
                            videoId: track.id,
                            title: track.title,
                            artist: track.artist,
                            thumbnailUrl: track.thumbnailUrl || '',
                            durationSeconds: track.durationSeconds
                          }"
                          size="sm" />
                      </ClientOnly>
                    </div>
                    <div v-if="hasActionColumn" class="app-track-list__track-action">
                      <button
                        v-if="track"
                        class="app-track-list__action-btn"
                        :aria-label="$t('playlists.delete')"
                        @click.stop="emit('remove', track, index)">
                        <AppIcon name="ph:trash" />
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- NORMAL CONTAINER -->
    <div v-else class="app-track-list__container">
      <div
        v-for="(track, index) in tracks"
        :key="track.id"
        class="app-track-list__track"
        :class="{
          'app-track-list__track--playing':
            isHydrated && player.currentTrack.value?.videoId === track.id,
          'app-track-list__track--dragged': dragIndex === index,
          'app-track-list__track--drag-over': dragOverIndex === index
        }"
        :style="{ height: `${itemHeight}px`, gridTemplateColumns: gridColumns }"
        :draggable="reorderable && !!track"
        @dragstart="track && handleDragStart($event, index)"
        @dragenter="track && handleDragEnter($event, index)"
        @dragover="track && handleDragOver($event, index)"
        @dragend="track && handleDragEnd()"
        @drop="track && handleDrop($event, index)"
        @click="emit('play', track, index)"
        @mouseenter="track && (hoveredTrackId = track.id)"
        @mouseleave="hoveredTrackId = null">
        <div class="app-track-list__track-num-wrapper">
          <ClientOnly>
            <div style="display: contents">
              <span
                class="app-track-list__track-num"
                :class="{
                  'app-track-list__track-num--playing':
                    isHydrated && player.currentTrack.value?.videoId === track.id
                }">
                <AppPlayingIndicator
                  v-if="isHydrated && player.currentTrack.value?.videoId === track.id"
                  data-allow-mismatch
                  class="text-primary" />
                <template v-else>{{ index + 1 }}</template>
              </span>
              <div class="app-track-list__track-play">
                <AppSpinner
                  v-if="
                    isHydrated &&
                    player.currentTrack.value?.videoId === track.id &&
                    player.isLoading.value
                  "
                  size="sm" />
                <AppIcon
                  v-else
                  data-allow-mismatch
                  :name="
                    isHydrated &&
                    player.currentTrack.value?.videoId === track.id &&
                    player.isPlaying.value
                      ? 'ph:pause-fill'
                      : 'ph:play-fill'
                  " />
              </div>
            </div>
            <template #fallback>
              <span class="app-track-list__track-num">{{ index + 1 }}</span>
            </template>
          </ClientOnly>
        </div>

        <div class="app-track-list__track-info">
          <div v-if="showThumbnails && track.thumbnailUrl" class="app-track-list__track-thumb">
            <NuxtImg
              :src="track.thumbnailUrl"
              :alt="track.title"
              width="40"
              height="40"
              format="webp"
              loading="lazy" />
          </div>
          <div class="app-track-list__track-text">
            <span
              class="app-track-list__track-title"
              :class="{
                'text-primary': isHydrated && player.currentTrack.value?.videoId === track.id
              }">
              {{ track.title }}
            </span>
            <div class="app-track-list__track-artist">
              <AppTrackArtists :track="track" class="artists-list" />
            </div>
          </div>
        </div>

        <div v-if="hasDateColumn" class="app-track-list__track-date">
          <span>{{ formatDate(track.addedAt) }}</span>
          <NuxtLink
            v-if="track.addedBy && typeof track.addedBy === 'object'"
            :to="`/user/${track.addedBy.sub}`"
            class="app-track-list__track-added group relative cursor-pointer"
            @click.stop>
            <img
              v-if="track.addedBy.picture"
              :src="track.addedBy.picture"
              :alt="track.addedBy.name"
              class="w-5 h-5 rounded-full object-cover" />
            <AppIcon v-else name="ph:user-circle" class="text-xl" />
            <span
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-[var(--color-bg-elevated)] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-[var(--color-border)] shadow-lg">
              Hozzáadta: {{ track.addedBy.name }}
            </span>
          </NuxtLink>
          <span v-else-if="track.addedBy" class="app-track-list__track-added">
            <AppIcon name="ph:user" />
            {{ track.addedBy }}
          </span>
        </div>

        <span v-if="hasPlaysColumn" class="app-track-list__track-plays">
          {{ track.plays || '-' }}
        </span>

        <span v-if="hasTimeColumn" class="app-track-list__track-duration">
          {{ formatDuration(track.durationSeconds) }}
        </span>

        <Transition name="action-slide">
          <div
            v-if="(hasDownloadColumn || hasActionColumn) && hoveredTrackId === track.id"
            class="app-track-list__actions-wrapper"
            @click.stop>
            <div class="app-track-list__actions-inner">
              <div v-if="hasDownloadColumn" class="app-track-list__track-action">
                <ClientOnly>
                  <OfflineDownloadButton
                    :track="{
                      videoId: track.id,
                      title: track.title,
                      artist: track.artist,
                      thumbnailUrl: track.thumbnailUrl || '',
                      durationSeconds: track.durationSeconds
                    }"
                    size="sm" />
                </ClientOnly>
              </div>
              <div v-if="hasActionColumn" class="app-track-list__track-action">
                <button
                  class="app-track-list__action-btn"
                  :aria-label="$t('playlists.delete')"
                  @click.stop="emit('remove', track, index)">
                  <AppIcon name="ph:trash" />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      <template v-if="isLoading">
        <div
          v-for="i in 15"
          :key="`normal-skel-${i}`"
          class="app-track-list__track app-track-list__track--skeleton"
          :style="{ height: `${itemHeight}px`, gridTemplateColumns: gridColumns }">
          <div class="app-track-list__track-num-wrapper">
            <div class="skeleton-box" style="height: 14px; width: 16px"></div>
          </div>
          <div class="app-track-list__track-info">
            <div v-if="showThumbnails" class="app-track-list__track-thumb skeleton-box"></div>
            <div class="app-track-list__track-text">
              <div class="skeleton-box" style="height: 16px; width: 220px; max-width: 70%"></div>
              <div
                class="skeleton-box"
                style="height: 12px; width: 140px; max-width: 50%; margin-top: 4px"></div>
            </div>
          </div>
          <div v-if="hasDateColumn" class="skeleton-box" style="height: 14px; width: 80px"></div>
          <div class="skeleton-box" style="height: 14px; width: 40px"></div>
          <div v-if="hasDownloadColumn"></div>
          <div v-if="hasActionColumn"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-track-list {
  display: flex;
  flex-direction: column;

  &__header {
    display: grid;
    grid-template-columns: v-bind(gridColumns);
    align-items: center;
    gap: var(--space-3);
    position: sticky;
    top: var(--tracklist-sticky-top, 0px);
    z-index: 20;
    background-color: color-mix(in srgb, var(--color-bg) 85%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: var(--space-3) var(--space-6);
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    border-bottom: 1px solid var(--color-border);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  &__col-index {
    text-align: center;
  }

  &__col-sortable {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    cursor: pointer;
    user-select: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
    }
  }

  &__sort-icon {
    font-size: 0.8em;
    flex-shrink: 0;
  }

  &__col-time {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  &__col-plays {
    display: flex;
    align-items: center;
    padding-top: 1px;
  }

  &__virtual-container {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__virtual-spacer {
    position: relative;
    width: 100%;
    /* We don't need fixed height here, it's set by inline style totalHeight */
  }

  &__virtual-window {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
    will-change: transform;
  }

  &__container {
    display: flex;
    flex-direction: column;
  }

  &__track {
    display: grid;
    align-items: center;
    padding: 0 var(--space-6);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    gap: var(--space-3);
    box-sizing: border-box;

    &:hover {
      background-color: var(--color-surface-hover);

      .app-track-list__track-num {
        opacity: 0;
      }

      .app-track-list__track-play {
        opacity: 1;
      }

      .app-track-list__action-btn {
        opacity: 1;
      }
    }

    &--skeleton {
      cursor: default;

      &:hover {
        background-color: transparent;
      }
    }
  }

  &__track-num-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__track-num {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);

    &--playing {
      color: var(--color-primary);
    }
  }

  &__track-play {
    position: absolute;
    opacity: 0;
    color: var(--color-text-primary);
    font-size: var(--text-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);
  }

  &__track-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__track-thumb {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__track-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__track-title {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track-artist {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .artist-link {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
        color: var(--color-text-primary);
      }
    }
  }

  &__track-date {
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: var(--text-sm);
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track-plays {
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    font-size: var(--text-sm);
  }

  &__track-duration {
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }

  &__track-added {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    background: var(--color-surface);
    padding: 2px 6px;
    border-radius: var(--radius-full);
    width: fit-content;
  }

  &__track-action {
    display: flex;
    justify-content: flex-end;
  }

  &__action-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-secondary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: color var(--transition-fast);
    opacity: 0;

    &:hover {
      color: var(--color-danger);
    }

    &:focus-visible {
      opacity: 1;
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

  @media (max-width: 768px) {
    --track-list-idx: 32px;
    --track-list-date: 0fr;
    --track-list-action: 40px;

    &__header {
      padding: var(--space-3) var(--space-2);
    }

    &__track {
      padding: 0 var(--space-2);
      gap: var(--space-2);
    }

    &__col-date,
    &__track-date {
      opacity: 0;
      overflow: hidden;
      white-space: nowrap;
    }

    &__action-btn {
      opacity: 1;
    }
  }
}

.app-track-list__actions-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  height: 100%;
}

.app-track-list__actions-inner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.action-slide-enter-active,
.action-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-slide-enter-from,
.action-slide-leave-to {
  opacity: 0;
  max-width: 0;
  transform: translateX(10px);
}

.action-slide-enter-to,
.action-slide-leave-from {
  opacity: 1;
  max-width: 120px;
  transform: translateX(0);
}
</style>
