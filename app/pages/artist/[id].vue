<script setup lang="ts">
import type {
  ArtistDetail,
  SearchResult,
  PaginatedSongs
} from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';

definePageMeta({
  layout: 'music'
});

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
const { playTrack, togglePlay, isPlaying, currentTrack } = usePlayer();

const isArtistPlaying = computed(() => {
  if (!artist.value || artist.value.topSongs.length === 0) return false;
  if (!isPlaying.value) return false;
  return artist.value.topSongs.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
});

function onPlaySong(track: SearchResult): void {
  playTrack({
    videoId: track.id,
    title: track.title,
    artist: track.artist,
    artistId: track.artistId,
    thumbnailUrl: track.thumbnailUrl,
    durationSeconds: track.durationSeconds || 0
  });
}

function onPlayArtist(): void {
  if (!artist.value || artist.value.topSongs.length === 0) return;

  if (
    isArtistPlaying.value ||
    (currentTrack.value &&
      artist.value.topSongs.some((t: SearchResult) => t.id === currentTrack.value?.videoId))
  ) {
    togglePlay();
    return;
  }

  const queue: Track[] = artist.value.topSongs.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
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
      const newItems = data.items.filter(
        (item) => !allSongs.value.some((existing) => existing.id === item.id)
      );
      allSongs.value.push(...newItems);
    }
    continuation.value = data.continuation || null;
  } catch (e) {
    console.error('Failed to load songs', e);
  } finally {
    isLoadingSongs.value = false;
  }
}

watch(
  artist,
  (newVal) => {
    if (newVal && allSongs.value.length === 0) {
      loadSongs();
    }
  },
  { immediate: true }
);

onMounted(() => {
  useInfiniteScroll(
    window,
    () => {
      if (continuation.value && !isLoadingSongs.value) {
        loadSongs();
      }
    },
    { distance: 200 }
  );
});
</script>

<template>
  <div class="artist-page">
    <AppMusicDetailView
      :is-loading="status === 'pending'"
      :is-error="!!error || (!artist && status !== 'pending')"
      :error-text="$t('search.artist.loadError')"
      :title="artist?.name"
      :badge="$t('search.artist.badge')"
      :image-url="artist?.thumbnailUrl"
      :rounded-image="true"
      :show-tracks="false"
      :is-list-playing="isArtistPlaying"
      :disable-play-button="!artist || artist.topSongs.length === 0"
      @play-all="onPlayArtist">
      <template #fallback-icon>
        <AppIcon name="ph:user" />
      </template>

      <template #content>
        <template v-if="status === 'pending'">
          <AppMusicSection
            :title="$t('search.artist.topSongs') + ' (All)'"
            layout="list"
            :is-loading="true"
            :skeleton-count="5" />
        </template>

        <template v-else-if="artist">
          <AppMusicSection
            v-if="allSongs.length > 0 || isLoadingSongs"
            :title="$t('search.artist.topSongs') + ' (All)'"
            layout="list">
            <SearchListItem
              v-for="song in allSongs"
              :key="song.id"
              :track="song"
              @click="onPlaySong(song)" />

            <AppMusicSection
              v-if="isLoadingSongs"
              title=""
              layout="list"
              :is-loading="true"
              :skeleton-count="allSongs.length === 0 ? 5 : 3" />
          </AppMusicSection>

          <AppMusicSection
            v-if="artist.albums.length > 0"
            :title="$t('search.artist.albums')"
            layout="grid">
            <TopResultCard
              v-for="album in artist.albums"
              :key="album.id"
              :result="album"
              @play="onPlaySong" />
          </AppMusicSection>
        </template>
      </template>
    </AppMusicDetailView>
  </div>
</template>

<style lang="scss" scoped></style>
