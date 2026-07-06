<script setup lang="ts">
import type { TopTrackAggregated, TopArtistAggregated, WrappedSlideId } from '../types/stats.types';
import type { SearchResult } from '../../search/types/search.types';

import WrappedSlideIntro from './wrapped/WrappedSlideIntro.vue';
import WrappedSlideTotalTime from './wrapped/WrappedSlideTotalTime.vue';
import WrappedSlideTopArtist from './wrapped/WrappedSlideTopArtist.vue';
import WrappedSlideTopArtists from './wrapped/WrappedSlideTopArtists.vue';
import WrappedSlideTopTrack from './wrapped/WrappedSlideTopTrack.vue';
import WrappedSlideTopTracks from './wrapped/WrappedSlideTopTracks.vue';
import WrappedSlideOutro from './wrapped/WrappedSlideOutro.vue';

interface Props {
  topTracks: TopTrackAggregated[];
  topArtists: TopArtistAggregated[];
  totalListeningSeconds: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const { playQueue } = usePlayer();

const slideIds: WrappedSlideId[] = [
  'intro',
  'total-time',
  'top-artist',
  'top-artists',
  'top-track',
  'top-tracks',
  'outro'
];

const currentIndex = ref(0);
const direction = ref<'next' | 'prev'>('next');
const isAnimating = ref(false);
const KEY_DURATION = 400;

const artistImages = ref<Record<string, string>>({});
const imagesFetched = ref(false);

watch(
  () => props.topArtists,
  async (artists) => {
    if (!artists || artists.length === 0 || imagesFetched.value) return;
    imagesFetched.value = true;
    for (const artist of artists.slice(0, 5)) {
      if (artistImages.value[artist.name]) continue;
      try {
        const data = await $fetch<SearchResult[]>(
          `/api/search?q=${encodeURIComponent(artist.name)}&type=artist`
        );
        if (Array.isArray(data) && data.length > 0 && data[0]) {
          artistImages.value[artist.name] = data[0].thumbnailUrl;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch {
        // Ignore
      }
    }
  },
  { immediate: true }
);

function goTo(index: number, dir: 'next' | 'prev') {
  if (isAnimating.value) return;
  if (index < 0 || index >= slideIds.length) return;
  direction.value = dir;
  isAnimating.value = true;
  setTimeout(() => {
    currentIndex.value = index;
    isAnimating.value = false;
  }, KEY_DURATION);
}

function next() {
  if (currentIndex.value < slideIds.length - 1) {
    goTo(currentIndex.value + 1, 'next');
  }
}

function prev() {
  if (currentIndex.value > 0) {
    goTo(currentIndex.value - 1, 'prev');
  }
}

function close() {
  emit('close');
}

function playAll() {
  const tracks = props.topTracks.map((t) => ({
    videoId: t.trackId,
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl || '',
    durationSeconds: t.durationSeconds
  }));
  playQueue(tracks, 0);
  close();
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    next();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prev();
  } else if (e.key === 'Escape') {
    close();
  }
}

let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0]?.clientX ?? 0;
  touchStartY = e.touches[0]?.clientY ?? 0;
}

function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
  const dy = Math.abs((e.changedTouches[0]?.clientY ?? 0) - touchStartY);
  if (Math.abs(dx) > 50 && dy < 80) {
    if (dx < 0) next();
    else prev();
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
  document.body.style.overflow = '';
});

const currentSlide = computed(() => slideIds[currentIndex.value]);
const topArtist = computed(() => props.topArtists[0]);
const topArtistImage = computed(() =>
  topArtist.value ? (artistImages.value[topArtist.value.name] ?? '') : ''
);
const topTrack = computed(() => props.topTracks[0]);

const slideTransitionName = computed(() =>
  direction.value === 'next' ? 'slide-next' : 'slide-prev'
);
</script>

<template>
  <Teleport to="body">
    <div
      id="wrapped-experience"
      class="wrapped-experience"
      role="dialog"
      aria-modal="true"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd">
      <Transition :name="slideTransitionName" mode="out-in">
        <div :key="currentSlide" class="wrapped-experience__slide">
          <WrappedSlideIntro v-if="currentSlide === 'intro'" />
          <WrappedSlideTotalTime
            v-else-if="currentSlide === 'total-time'"
            :total-seconds="totalListeningSeconds" />
          <WrappedSlideTopArtist
            v-else-if="currentSlide === 'top-artist' && topArtist"
            :artist="topArtist"
            :artist-image-url="topArtistImage" />
          <WrappedSlideTopArtists
            v-else-if="currentSlide === 'top-artists'"
            :artists="topArtists"
            :artist-images="artistImages" />
          <WrappedSlideTopTrack
            v-else-if="currentSlide === 'top-track' && topTrack"
            :track="topTrack" />
          <WrappedSlideTopTracks v-else-if="currentSlide === 'top-tracks'" :tracks="topTracks" />
          <WrappedSlideOutro
            v-else-if="currentSlide === 'outro'"
            :on-play-all="playAll"
            :on-close="close" />
        </div>
      </Transition>

      <button
        id="wrapped-close-x"
        class="wrapped-experience__close"
        :title="$t('stats.wrapped.close')"
        @click="close">
        <AppIcon name="ph:x-bold" />
      </button>

      <nav class="wrapped-experience__nav">
        <button
          id="wrapped-prev-btn"
          class="wrapped-experience__nav-btn"
          :disabled="currentIndex === 0"
          :title="$t('stats.wrapped.prev')"
          @click="prev">
          <AppIcon name="ph:caret-left-bold" />
        </button>

        <div class="wrapped-experience__dots">
          <button
            v-for="(_, i) in slideIds"
            :id="`wrapped-dot-${i}`"
            :key="i"
            class="wrapped-experience__dot"
            :class="{ 'wrapped-experience__dot--active': i === currentIndex }"
            @click="goTo(i, i > currentIndex ? 'next' : 'prev')" />
        </div>

        <button
          id="wrapped-next-btn"
          class="wrapped-experience__nav-btn"
          :disabled="currentIndex === slideIds.length - 1"
          :title="$t('stats.wrapped.next')"
          @click="next">
          <AppIcon name="ph:caret-right-bold" />
        </button>
      </nav>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.wrapped-experience {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: #000;

  &__slide {
    flex: 1;
    overflow: hidden;
  }

  &__close {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    border: none;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    color: rgba(255, 255, 255, 0.85);
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid rgba(255, 255, 255, 0.15);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      transform: scale(1.05);
    }
  }

  &__nav {
    position: absolute;
    bottom: var(--space-6);
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    z-index: 10;
    padding: 0 var(--space-4);
  }

  &__nav-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    &:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }
  }

  &__dots {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    border: none;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 0;

    &--active {
      width: 24px;
      background: #fff;
    }

    &:hover:not(&--active) {
      background: rgba(255, 255, 255, 0.6);
    }
  }
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
}

.slide-next-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-next-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-prev-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-prev-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
