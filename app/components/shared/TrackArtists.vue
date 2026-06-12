<script setup lang="ts">
import type { TrackArtist } from '~/features/player/types/player.types';
import { getTrackArtists } from '~/utils/artist';

const props = defineProps<{
  track?: { artist?: string; artists?: TrackArtist[]; artistId?: string } | null;
}>();

const artists = computed(() => getTrackArtists(props.track || undefined));
</script>

<template>
  <span class="app-track-artists">
    <template v-if="artists.length > 0">
      <template v-for="(artist, index) in artists" :key="index">
        <NuxtLink
          v-if="artist.id"
          :to="`/artist/${artist.id}`"
          class="app-track-artists__link"
          @click.stop>
          {{ artist.name }}
        </NuxtLink>
        <NuxtLink
          v-else
          :to="`/search?q=${encodeURIComponent(artist.name)}&type=artist`"
          class="app-track-artists__link"
          @click.stop>
          {{ artist.name }}
        </NuxtLink>
        <template v-if="index < artists.length - 1">{{ ', ' }}</template>
      </template>
    </template>
    <template v-else>
      <span class="app-track-artists__text">{{ $t('player.startSomething') }}</span>
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
