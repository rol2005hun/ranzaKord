<script setup lang="ts">
import type { TrackArtist } from '~/features/player/types/player.types';
import { getTrackArtists } from '~/utils/artist';

const props = defineProps<{
  track?: { artist?: string; artists?: TrackArtist[]; artistId?: string } | null;
}>();

const artists = computed(() => getTrackArtists(props.track || undefined));
</script>

<template>
  <span class="app-track-artists" data-allow-mismatch="children">
    <template v-if="artists.length > 0">
      <span
        v-for="(artist, index) in artists"
        :key="index"
        class="app-track-artists__artist"
        data-allow-mismatch="children">
        <NuxtLink
          v-if="artist.id"
          :to="`/artist/${artist.id}`"
          class="app-track-artists__link"
          data-allow-mismatch
          @click.stop>
          {{ artist.name }}
        </NuxtLink>
        <NuxtLink
          v-else
          :to="{ path: '/search', query: { q: artist.name, type: 'artist' } }"
          class="app-track-artists__link"
          data-allow-mismatch
          @click.stop>
          {{ artist.name }}
        </NuxtLink>
        <span
          v-if="index < artists.length - 1"
          class="app-track-artists__separator"
          data-allow-mismatch>
          {{ ', ' }}
        </span>
      </span>
    </template>
    <template v-else>
      <span class="app-track-artists__text" data-allow-mismatch>
        {{ track ? $t('player.unknownArtist') : $t('player.startSomething') }}
      </span>
    </template>
  </span>
</template>

<style scoped lang="scss">
.app-track-artists {
  display: inline;
  color: inherit;
  font-size: inherit;

  &__link {
    color: inherit;
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      text-decoration: underline;
      color: var(--color-primary);
    }
  }

  &__text {
    color: inherit;
  }
}
</style>
