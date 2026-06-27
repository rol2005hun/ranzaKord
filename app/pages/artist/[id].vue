<script setup lang="ts">
import type {
  ArtistDetail,
  SearchResult,
  PaginatedSongs
} from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';
import type { TrackListItem } from '@/components/shared/AppTrackList.vue';

definePageMeta({
  layout: 'music'
});

const { t } = useI18n({ useScope: 'global' });

const route = useRoute();
const id = route.params.id as string;

const headers = useRequestHeaders(['cookie']);
const {
  data: artist,
  status,
  error
} = await useFetch<ArtistDetail>('/api/artist', {
  headers,
  query: { id },
  lazy: true
});

const playerStore = usePlayerStore();
const { playTrack, togglePlay, isPlaying, currentTrack, playQueue } = usePlayer();

useHead({
  title: computed(() => artist.value?.name || t('search.artist.badge'))
});

const isArtistPlaying = computed(() => {
  if (allSongs.value.length === 0) return false;
  if (!isPlaying.value) return false;
  return allSongs.value.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
});

const isArtistLoading = computed(() => {
  if (allSongs.value.length === 0) return false;
  if (!playerStore.isLoading) return false;
  return allSongs.value.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
});

function onPlaySong(track: TrackListItem, index: number): void {
  const tracksToPlay: Track[] = allSongs.value.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    artists: t.artists,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0
  }));

  const resolvedIndex = allSongs.value.findIndex((t) => t.id === track.id);
  playQueue(tracksToPlay, resolvedIndex >= 0 ? resolvedIndex : index);
}

function onPlayAlbumSong(result: SearchResult): void {
  playTrack({
    videoId: result.id,
    title: result.title,
    artist: result.artist,
    artists: result.artists,
    artistId: result.artistId,
    thumbnailUrl: result.thumbnailUrl,
    durationSeconds: result.durationSeconds || 0
  });
}

function onPlayArtist(): void {
  if (!artist.value || allSongs.value.length === 0) return;

  if (
    isArtistPlaying.value ||
    (currentTrack.value &&
      allSongs.value.some((t: SearchResult) => t.id === currentTrack.value?.videoId))
  ) {
    togglePlay();
    return;
  }

  const queue: Track[] = allSongs.value.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    artists: t.artists,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0
  }));

  playerStore.setQueue(queue);
  if (queue[0]) playTrack(queue[0]);
}

const allSongs = ref<SearchResult[]>([]);
const continuation = ref<string | null>(null);
const isLoadingSongs = ref(false);

async function loadSongs() {
  if (isLoadingSongs.value || (!artist.value?.name && !continuation.value)) return;
  isLoadingSongs.value = true;
  try {
    const data = await $fetch<PaginatedSongs>('/api/artist/songs', {
      query: {
        q: artist.value?.name,
        continuation: continuation.value || undefined
      }
    });
    if (data.items) {
      const currentArtistName = artist.value?.name?.toLowerCase() || '';
      const newItems = data.items.filter(
        (item) =>
          !allSongs.value.some((existing) => existing.id === item.id) &&
          (item.artist?.toLowerCase().includes(currentArtistName) ||
            item.artists?.some((a) => a.name.toLowerCase().includes(currentArtistName)))
      );
      allSongs.value.push(...newItems);

      if (newItems.length === 0 && data.continuation) {
        continuation.value = data.continuation;
        setTimeout(() => {
          loadSongs();
        }, 50);
        return;
      }
    }
    continuation.value = data.continuation || null;
  } catch (e) {
    console.error('Failed to load songs', e);
  } finally {
    isLoadingSongs.value = false;
  }
}

const mappedSongs = computed<TrackListItem[]>(() => {
  return allSongs.value.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    artistId: song.artistId,
    thumbnailUrl: song.thumbnailUrl,
    durationSeconds: song.durationSeconds || 0,
    isPlaying: isPlaying.value && currentTrack.value?.videoId === song.id
  }));
});

watch(
  artist,
  (newVal) => {
    if (newVal && allSongs.value.length === 0) {
      loadSongs();
    }
  },
  { immediate: true }
);

function onScroll(event: Event): void {
  const el = event.target as HTMLElement;
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
    if (continuation.value && !isLoadingSongs.value) {
      loadSongs();
    }
  }
}
</script>

<template>
  <div class="artist-page">
    <AppMusicPage
      :is-loading="status === 'pending'"
      :is-error="!!error || (!artist && status !== 'pending')"
      :error-text="$t('search.artist.loadError')"
      :title="artist?.name"
      :badge="$t('search.artist.badge')"
      :image-url="artist?.thumbnailUrl"
      :rounded-image="true"
      :is-list-playing="isArtistPlaying"
      :is-list-loading="isArtistLoading"
      :disable-play-button="!artist || allSongs.length === 0"
      @play-all="onPlayArtist"
      @scroll="onScroll">
      <template #fallback-icon>
        <AppIcon name="ph:user" />
      </template>

      <template #skeleton-tracks>
        <AppTrackList
          :is-loading="true"
          :columns="['index', 'title', 'time']"
          :show-thumbnails="true" />
      </template>

      <template #tracks>
        <template v-if="artist">
          <div
            v-if="allSongs.length === 0 && !isLoadingSongs && artist.albums.length === 0"
            class="music-page__empty">
            <AppIcon name="ph:music-notes-plus" class="music-page__empty-icon" />
            <p>{{ $t('core.musicDetail.empty') }}</p>
            <NuxtLink to="/" class="music-page__empty-btn">
              {{ $t('playlists.discover') }}
            </NuxtLink>
          </div>
          <template v-else>
            <AppTrackList
              v-if="allSongs.length > 0 || isLoadingSongs"
              :tracks="mappedSongs"
              :is-loading="isLoadingSongs"
              :columns="['index', 'title', 'time']"
              :show-thumbnails="true"
              @play="onPlaySong" />

            <AppMusicSection
              v-if="artist.albums.length > 0"
              :title="$t('search.artist.albums')"
              layout="grid">
              <TopResultCard
                v-for="album in artist.albums"
                :key="album.id"
                :result="album"
                @play="onPlayAlbumSong" />
            </AppMusicSection>
          </template>
        </template>
      </template>
    </AppMusicPage>
  </div>
</template>

<style lang="scss" scoped>
.artist-page {
  height: 100%;
}
</style>
