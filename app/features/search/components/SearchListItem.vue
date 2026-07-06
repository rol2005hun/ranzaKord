<script setup lang="ts">
import type { SearchResult } from '@/features/search/types/search.types';

const props = defineProps<{
  track: SearchResult;
}>();

const { playTrack } = usePlayer();
const playlistsStore = usePlaylistsStore();
const playerStore = usePlayerStore();
const router = useRouter();

const showAddToPlaylist = ref(false);
const addBtnRef = ref<HTMLElement | null>(null);
const isInAnyPlaylist = computed(
  () => props.track.type === 'song' && playlistsStore.isTrackInAnyPlaylist(props.track.id)
);

const isCurrentlyPlaying = computed(
  () => props.track.type === 'song' && playerStore.currentTrack?.videoId === props.track.id
);
const isPlaying = computed(() => isCurrentlyPlaying.value && playerStore.isPlaying);

const emit = defineEmits<{
  (e: 'click'): void;
}>();

function onClick() {
  emit('click');
  if (props.track.type === 'song') {
    playTrack({
      videoId: props.track.id,
      title: props.track.title,
      artist: props.track.artist,
      artists: props.track.artists,
      artistId: props.track.artistId,
      thumbnailUrl: props.track.thumbnailUrl,
      durationSeconds: props.track.durationSeconds || 0
    });
  } else if (props.track.type === 'artist') {
    router.push(`/artist/${props.track.id}`);
  } else if (props.track.type === 'album') {
    router.push(`/album/${props.track.id}`);
  } else if (props.track.type === 'playlist') {
    router.push(`/playlist/${props.track.id}`);
  }
}

function resolveArtists(track: SearchResult): { name: string; id?: string }[] {
  const separatorRe = /,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i;
  const parts = (track.artist || '')
    .split(separatorRe)
    .map((s) => s.trim())
    .filter(Boolean);

  if (track.artists && track.artists.length > 0) {
    if (parts.length > track.artists.length) {
      const merged = [...track.artists];
      for (const part of parts) {
        if (!merged.find((a) => a.name.toLowerCase() === part.toLowerCase())) {
          merged.push({ name: part });
        }
      }
      return merged;
    }
    return track.artists;
  }

  if (parts.length <= 1) return [];
  return parts.map((name) => ({ name }));
}
</script>

<template>
  <div
    class="search-list-item"
    :class="{
      'search-list-item--artist': track.type === 'artist',
      'search-list-item--active': isCurrentlyPlaying
    }"
    @click="onClick">
    <div class="search-list-item__thumb">
      <img
        v-if="track.thumbnailUrl"
        :src="track.thumbnailUrl"
        :alt="track.title"
        referrerpolicy="no-referrer"
        loading="lazy" />
      <AppIcon v-else name="ph:music-notes-simple" />
      <div
        v-if="track.type === 'song'"
        class="search-list-item__overlay"
        :class="{ 'search-list-item__overlay--active': isCurrentlyPlaying }">
        <AppIcon v-if="isPlaying" name="ph:pause-fill" />
        <AppIcon v-else name="ph:play-fill" />
      </div>
    </div>

    <div class="search-list-item__info">
      <h3 class="search-list-item__title" :class="{ 'text-primary': isCurrentlyPlaying }">
        <AppIcon
          v-if="isPlaying"
          name="ph:speaker-high-fill"
          style="margin-right: 4px; font-size: 1.1em; vertical-align: text-bottom" />
        <AppIcon
          v-else-if="isCurrentlyPlaying"
          name="ph:speaker-none-fill"
          style="margin-right: 4px; font-size: 1.1em; vertical-align: text-bottom" />
        {{ track.title }}
      </h3>
      <p class="search-list-item__subtitle">
        <span v-if="track.type === 'song'">
          {{ $t('search.list.song') }} •
          <template v-if="resolveArtists(track).length > 0">
            <template v-for="(artist, index) in resolveArtists(track)" :key="index">
              <NuxtLink
                :to="
                  artist.id
                    ? `/artist/${artist.id}`
                    : `/search?q=${encodeURIComponent(artist.name)}&type=artist`
                "
                class="artist-link"
                @click.stop>
                {{ artist.name }}
              </NuxtLink>
              <span v-if="index < resolveArtists(track).length - 1">,&nbsp;</span>
            </template>
          </template>
          <template v-else>
            <NuxtLink
              v-if="track.artistId"
              :to="`/artist/${track.artistId}`"
              class="artist-link"
              @click.stop>
              {{ track.artist }}
            </NuxtLink>
            <NuxtLink
              v-else-if="track.artist"
              :to="`/search?q=${encodeURIComponent(track.artist)}&type=artist`"
              class="artist-link"
              @click.stop>
              {{ track.artist }}
            </NuxtLink>
          </template>
        </span>
        <span v-else-if="track.type === 'artist'">{{ $t('search.list.artist') }}</span>
        <span v-else-if="track.type === 'album'">
          {{ $t('search.list.album') }} •
          <template v-if="resolveArtists(track).length > 0">
            <template v-for="(artist, index) in resolveArtists(track)" :key="index">
              <NuxtLink
                :to="
                  artist.id
                    ? `/artist/${artist.id}`
                    : `/search?q=${encodeURIComponent(artist.name)}&type=artist`
                "
                class="artist-link"
                @click.stop>
                {{ artist.name }}
              </NuxtLink>
              <span v-if="index < resolveArtists(track).length - 1">,&nbsp;</span>
            </template>
          </template>
          <template v-else>
            <NuxtLink
              v-if="track.artistId"
              :to="`/artist/${track.artistId}`"
              class="artist-link"
              @click.stop>
              {{ track.artist }}
            </NuxtLink>
            <NuxtLink
              v-else-if="track.artist"
              :to="`/search?q=${encodeURIComponent(track.artist)}&type=artist`"
              class="artist-link"
              @click.stop>
              {{ track.artist }}
            </NuxtLink>
          </template>
        </span>
        <span v-else-if="track.type === 'playlist'">
          Playlist •
          <template v-if="track.artistId">
            <NuxtLink :to="`/artist/${track.artistId}`" class="artist-link" @click.stop>
              {{ track.artist }}
            </NuxtLink>
          </template>
          <template v-else-if="track.artist">
            <NuxtLink
              :to="`/search?q=${encodeURIComponent(track.artist)}&type=artist`"
              class="artist-link"
              @click.stop>
              {{ track.artist }}
            </NuxtLink>
          </template>
        </span>
      </p>
    </div>

    <div v-if="track.type === 'song'" class="search-list-item__actions">
      <button class="search-list-item__action" :aria-label="$t('search.list.options')" @click.stop>
        <AppIcon name="ph:dots-three-bold" />
      </button>
      <button
        ref="addBtnRef"
        class="search-list-item__action"
        :aria-label="$t('search.list.addToPlaylist')"
        @click.stop="showAddToPlaylist = !showAddToPlaylist">
        <AppIcon v-if="isInAnyPlaylist" name="ph:check-circle-fill" class="text-success" />
        <AppIcon v-else name="ph:plus-circle" />
      </button>
    </div>

    <AddToPlaylistPopup
      v-if="showAddToPlaylist && track.type === 'song'"
      :track="{
        videoId: track.id,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
        durationMs: (track.durationSeconds || 0) * 1000
      }"
      :anchor="addBtnRef"
      @close="showAddToPlaylist = false" />
  </div>
</template>

<style lang="scss" scoped>
.search-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);

    .search-list-item__overlay {
      opacity: 1;
    }
  }

  &--artist &__thumb {
    border-radius: 50%;
  }

  &__thumb {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-fast);
    color: white;
    font-size: var(--text-xl);

    &--active {
      opacity: 0.6;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__title {
    margin: 0;
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &:hover &__actions {
    opacity: 1;
  }

  &__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: var(--text-lg);
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background-color: var(--color-surface-raised);
    }
  }
}

@media (max-width: 768px) {
  .search-list-item__actions {
    opacity: 1;
  }
}

.text-success {
  color: hsl(140, 60%, 50%) !important;
}

.text-primary {
  color: var(--color-primary) !important;
}

.artist-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    text-decoration: underline;
    color: var(--color-text-primary);
  }
}
</style>
