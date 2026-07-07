<script setup lang="ts">
import type { SearchResult } from '../types/search.types';
import type { TrackListItem } from '@/components/shared/TrackList.vue';

interface Props {
  artistId: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const router = useRouter();

const {
  artist,
  status,
  error,
  allSongs,
  isLoadingSongs,
  isArtistPlaying,
  isArtistLoading,
  mappedTopSongs,
  mappedAllSongs,
  onPlayArtist,
  onPlayTopSong,
  onPlaySong,
  onPlayAlbumSong,
  onScroll
} = useArtist(props.artistId);

const { playTrack } = usePlayer();
const playerStore = usePlayerStore();

function onShuffleArtist() {
  if (!artist.value) return;
  const sourceSongs =
    artist.value.topSongs?.length > 0 ? artist.value.topSongs.slice(0, 10) : allSongs.value;
  if (sourceSongs.length === 0) return;

  const shuffled = [...sourceSongs].sort(() => Math.random() - 0.5);
  const queue = shuffled.map((t: SearchResult) => ({
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

function onNavigateAlbum(album: SearchResult) {
  router.push(`/album/${album.id}`);
}

const isEmpty = computed(
  () =>
    allSongs.value.length === 0 &&
    !isLoadingSongs.value &&
    (!artist.value?.topSongs || artist.value.topSongs.length === 0) &&
    (!artist.value?.albums || artist.value.albums.length === 0)
);
</script>

<template>
  <div class="artist-page-inner" @scroll="onScroll">
    <div
      v-if="status === 'error' || (error && status !== 'pending')"
      class="artist-page-inner__error">
      <AppIcon name="ph:warning-circle" />
      <p>{{ t('search.artist.loadError') }}</p>
    </div>

    <template v-else>
      <ArtistHeader
        v-if="artist || status === 'pending'"
        :name="artist?.name || ''"
        :thumbnail-url="artist?.thumbnailUrl || ''"
        :banner-url="artist?.bannerUrl"
        :description="artist?.description"
        :is-playing="isArtistPlaying"
        :is-loading="isArtistLoading"
        :disable-play="
          !artist || (allSongs.length === 0 && (!artist.topSongs || artist.topSongs.length === 0))
        "
        @play="onPlayArtist"
        @shuffle="onShuffleArtist" />

      <div v-if="status === 'pending'" class="artist-page-inner__skeleton">
        <div class="artist-page-inner__skeleton-title" />
        <AppTrackList
          :is-loading="true"
          :columns="['index', 'title', 'time']"
          :show-thumbnails="true" />
      </div>

      <template v-else-if="artist">
        <div v-if="isEmpty" class="artist-page-inner__empty">
          <AppIcon name="ph:music-notes-plus" class="artist-page-inner__empty-icon" />
          <p>{{ t('core.musicDetail.empty') }}</p>
          <NuxtLink to="/" class="artist-page-inner__empty-btn">
            {{ t('playlists.discover') }}
          </NuxtLink>
        </div>

        <template v-else>
          <ArtistTopSongs
            v-if="mappedTopSongs.length > 0"
            :tracks="mappedTopSongs"
            :title="t('search.artist.topSongs')"
            class="artist-page-inner__section"
            @play="(track: TrackListItem, index: number) => onPlayTopSong(track, index)" />

          <ArtistDiscography
            v-if="artist.albums.length > 0"
            :albums="artist.albums"
            :title="t('search.artist.discography')"
            class="artist-page-inner__section"
            @play="onPlayAlbumSong"
            @navigate="onNavigateAlbum" />

          <section v-if="allSongs.length > 0 || isLoadingSongs" class="artist-page-inner__section">
            <h2 class="artist-page-inner__section-title">{{ t('search.artist.allSongs') }}</h2>
            <AppTrackList
              :tracks="mappedAllSongs"
              :is-loading="isLoadingSongs"
              :columns="['index', 'title', 'time']"
              :show-thumbnails="true"
              @play="onPlaySong" />
          </section>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
.artist-page-inner {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  scrollbar-width: thin;

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
    gap: 1rem;
    color: var(--color-text-secondary);
    font-size: 1rem;
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__skeleton-title {
    height: 1.5rem;
    width: 180px;
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    animation: shimmer 1.5s infinite;
  }

  &__section {
    margin-bottom: 2.5rem;
  }

  &__section-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 1rem;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  &__empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  &__empty-btn {
    color: hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l));
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
