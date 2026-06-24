<script setup lang="ts">
import type { LyricLine } from '../types/sidebar.types';

const player = usePlayer();
const layoutStore = useLayoutStore();
const { lyricsData, isLoading: lyricsLoading, fetchLyrics, getActiveLine } = useLyrics();

const lyricsListRef = ref<HTMLElement | null>(null);
const isResizing = ref(false);

const isHydrated = ref(false);

onMounted(() => {
  isHydrated.value = true;
});

const currentTrack = computed(() => (isHydrated.value ? player.currentTrack.value : null));
const currentTime = computed(() => (isHydrated.value ? player.currentTimeSeconds.value : 0));

watch(
  currentTrack,
  (track) => {
    if (track) {
      fetchLyrics(track);
    }
  },
  { immediate: true }
);

const activeLineIndex = computed(() => getActiveLine(currentTime.value));

const syncedLines = computed<LyricLine[]>(() => lyricsData.value?.synced ?? []);
const plainLyrics = computed<string | null>(() => lyricsData.value?.plain ?? null);
const hasSyncedLyrics = computed(() => syncedLines.value.length > 0);
const hasAnyLyrics = computed(() => hasSyncedLyrics.value || !!plainLyrics.value);

let autoScrollEnabled = true;
let scrollResumeTimer: ReturnType<typeof setTimeout> | null = null;
let isProgrammaticScroll = false;
let programmaticScrollTimer: ReturnType<typeof setTimeout> | null = null;

function scrollToActiveLine() {
  const idx = activeLineIndex.value;
  if (idx < 0) return;
  nextTick(() => {
    const container = lyricsListRef.value;
    const el = container?.querySelector(`[data-line="${idx}"]`) as HTMLElement | null;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top;
      const scrollPosition =
        container.scrollTop + relativeTop - containerRect.height / 2 + elRect.height / 2;

      isProgrammaticScroll = true;
      if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
      programmaticScrollTimer = setTimeout(() => {
        isProgrammaticScroll = false;
      }, 800);

      container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  });
}

watch(activeLineIndex, () => {
  if (!autoScrollEnabled) return;
  scrollToActiveLine();
});

function onLyricsScroll() {
  if (isProgrammaticScroll) return;

  autoScrollEnabled = false;
  if (scrollResumeTimer) clearTimeout(scrollResumeTimer);
  scrollResumeTimer = setTimeout(() => {
    autoScrollEnabled = true;
    scrollToActiveLine();
  }, 3000);
}

function onResizeStart(event: MouseEvent | TouchEvent) {
  isResizing.value = true;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ew-resize';

  const startX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
  const startWidth = layoutStore.rightSidebarWidth;

  function onMove(e: MouseEvent | TouchEvent) {
    const currentX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const delta = startX - currentX;
    layoutStore.setRightSidebarWidth(startWidth + delta);
  }

  function onEnd() {
    isResizing.value = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onMove);
  document.addEventListener('touchend', onEnd);
}

const sidebarStyle = computed(() => ({
  width: `${isHydrated.value ? layoutStore.rightSidebarWidth : 300}px`
}));
</script>

<template>
  <aside
    class="right-sidebar"
    :class="{
      'right-sidebar--open': layoutStore.isRightSidebarOpen,
      'right-sidebar--resizing': isResizing
    }"
    :style="sidebarStyle"
    :aria-label="$t('player.openInfoPanel')">
    <div
      class="right-sidebar__resize-handle"
      role="separator"
      :aria-label="'Resize sidebar'"
      @mousedown="onResizeStart"
      @touchstart.passive="onResizeStart" />

    <div class="right-sidebar__header">
      <div class="right-sidebar__tabs">
        <button
          id="sidebar-tab-info"
          class="right-sidebar__tab"
          :class="{
            'right-sidebar__tab--active': !isHydrated || layoutStore.rightSidebarMode === 'info'
          }"
          @click="layoutStore.setRightSidebarMode('info')">
          <AppIcon name="ph:music-note" />
          <span>{{ $t('player.nowPlaying') }}</span>
        </button>
        <button
          id="sidebar-tab-lyrics"
          class="right-sidebar__tab"
          :class="{
            'right-sidebar__tab--active': isHydrated && layoutStore.rightSidebarMode === 'lyrics'
          }"
          @click="layoutStore.setRightSidebarMode('lyrics')">
          <AppIcon name="ph:microphone-stage" />
          <span>{{ $t('player.lyrics') }}</span>
        </button>
      </div>
      <button
        id="sidebar-close-btn"
        class="right-sidebar__close"
        :aria-label="$t('player.closeInfoPanel')"
        @click="layoutStore.closeRightSidebar()">
        <AppIcon name="ph:x-bold" />
      </button>
    </div>

    <div class="right-sidebar__body">
      <div
        v-if="!isHydrated || layoutStore.rightSidebarMode === 'info'"
        class="right-sidebar__info">
        <template v-if="!isHydrated">
          <div class="right-sidebar__artwork-wrap">
            <AppSkeleton width="100%" height="100%" border-radius="var(--radius-lg)" />
          </div>
          <div class="right-sidebar__track-meta" style="gap: 12px; margin-top: 24px">
            <AppSkeleton width="80%" height="24px" border-radius="var(--radius-sm)" />
            <AppSkeleton width="50%" height="18px" border-radius="var(--radius-sm)" />
          </div>
        </template>

        <template v-else-if="currentTrack">
          <div class="right-sidebar__artwork-wrap">
            <img
              v-if="currentTrack.thumbnailUrl"
              :src="currentTrack.thumbnailUrl"
              :alt="currentTrack.title"
              class="right-sidebar__artwork" />
            <div v-else class="right-sidebar__artwork-placeholder">
              <AppIcon name="ph:music-notes-simple" />
            </div>
          </div>

          <div class="right-sidebar__track-meta">
            <p class="right-sidebar__track-title">{{ currentTrack.title }}</p>
            <AppTrackArtists :track="currentTrack" class="right-sidebar__track-artist" />
          </div>
        </template>

        <template v-else>
          <div class="right-sidebar__empty-state">
            <AppIcon name="ph:music-notes-duotone" class="right-sidebar__empty-icon" />
            <p class="right-sidebar__empty-text">{{ $t('player.noTrack') }}</p>
            <p class="right-sidebar__empty-hint">{{ $t('player.startSomething') }}</p>
          </div>
        </template>
      </div>

      <div
        v-else-if="isHydrated && layoutStore.rightSidebarMode === 'lyrics'"
        class="right-sidebar__lyrics">
        <div
          v-if="lyricsLoading || (currentTrack && lyricsData?.trackId !== currentTrack.videoId)"
          class="right-sidebar__lyrics-loading-skeleton">
          <AppSkeleton
            v-for="(width, index) in [
              '60%',
              '85%',
              '45%',
              '70%',
              '90%',
              '55%',
              '75%',
              '40%',
              '80%',
              '65%',
              '50%',
              '85%',
              '70%',
              '45%',
              '60%',
              '75%',
              '55%',
              '80%',
              '40%',
              '90%',
              '65%',
              '75%',
              '45%',
              '85%',
              '50%',
              '70%',
              '80%',
              '60%',
              '90%',
              '55%'
            ]"
            :key="index"
            :width="width"
            height="24px"
            border-radius="var(--radius-sm)"
            :style="{ opacity: Math.max(0.05, 1 - index * 0.035) }" />
        </div>

        <div v-else-if="!currentTrack" class="right-sidebar__empty-state">
          <AppIcon name="ph:music-notes-duotone" class="right-sidebar__empty-icon" />
          <p class="right-sidebar__empty-text">{{ $t('player.noTrack') }}</p>
          <p class="right-sidebar__empty-hint">{{ $t('player.startSomething') }}</p>
        </div>

        <div v-else-if="!hasAnyLyrics" class="right-sidebar__empty-state">
          <AppIcon name="ph:file-x-duotone" class="right-sidebar__empty-icon" />
          <p class="right-sidebar__empty-text">{{ $t('player.lyricsNotFound') }}</p>
        </div>

        <template v-else-if="hasSyncedLyrics">
          <div
            ref="lyricsListRef"
            class="right-sidebar__lyrics-list"
            @scroll.passive="onLyricsScroll">
            <p
              v-for="(line, idx) in syncedLines"
              :key="idx"
              :data-line="idx"
              class="right-sidebar__lyric-line"
              :class="{ 'right-sidebar__lyric-line--active': idx === activeLineIndex }"
              @click="player.seek(line.time)">
              {{ line.text }}
            </p>
          </div>
        </template>

        <template v-else>
          <div class="right-sidebar__plain-lyrics-wrap">
            <p class="right-sidebar__unsync-badge">
              <AppIcon name="ph:warning" />
              {{ $t('player.lyricsNotSynced') }}
            </p>
            <p class="right-sidebar__plain-lyrics">{{ plainLyrics }}</p>
          </div>
        </template>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.right-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow: hidden;
  flex-shrink: 0;
  min-width: 220px;
  max-width: 30vw;
  transition: width var(--transition-slow);

  &--resizing {
    transition: none;
  }

  &__resize-handle {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    cursor: ew-resize;
    z-index: 1;
    transition: background var(--transition-fast);

    &:hover {
      background: color-mix(in srgb, var(--color-primary) 40%, transparent);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    gap: var(--space-2);
  }

  &__tabs {
    display: flex;
    gap: var(--space-1);
    flex: 1;
    min-width: 0;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border: none;
    color: var(--color-text-primary);
    opacity: 0.8;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    white-space: nowrap;
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }

    &--active {
      color: var(--color-text-primary);
      opacity: 1;
      background: color-mix(in srgb, var(--color-primary) 20%, transparent);
    }
  }

  &__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    transition: all var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-4) var(--space-3);
    gap: var(--space-3);
    overflow-y: auto;
  }

  &__artwork-wrap {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-hover);
    box-shadow: var(--shadow-xl);
  }

  &__artwork {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__artwork-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: var(--color-text-secondary);
    opacity: 0.4;
  }

  &__track-meta {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__track-title {
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track-artist {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    text-decoration: none;

    &--link {
      &:hover {
        color: var(--color-primary);
        text-decoration: underline;
      }
    }
  }

  &__empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8) var(--space-4);
    text-align: center;
    width: 100%;
  }

  &__empty-icon {
    font-size: 3rem;
    color: var(--color-text-secondary);
    opacity: 0.4;
  }

  &__empty-text {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__empty-hint {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    opacity: 0.7;
    margin: 0;
  }

  &__lyrics {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__lyrics-loading-skeleton {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--space-6) var(--space-4);
    gap: var(--space-4);
  }

  &__lyrics-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-full);
    }
  }

  &__lyric-line {
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
    cursor: pointer;
    transition:
      color var(--transition-base),
      transform var(--transition-base),
      opacity var(--transition-base);
    opacity: 0.45;
    transform-origin: left;

    &:hover {
      opacity: 0.7;
      color: var(--color-text-primary);
    }

    &--active {
      color: var(--color-text-primary);
      opacity: 1;
      transform: scale(1.04);
      font-size: var(--text-lg);
    }
  }

  &__plain-lyrics-wrap {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-full);
    }
  }

  &__unsync-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    padding: var(--space-1) var(--space-3);
    margin: 0;
    align-self: flex-start;
  }

  &__plain-lyrics {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
    white-space: pre-line;
    margin: 0;
  }

  @media (max-width: 768px) {
    display: none;
  }
}
</style>
