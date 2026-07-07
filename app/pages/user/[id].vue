<script setup lang="ts">
import { useProfile } from '@/features/profile/composables/useProfile';
import type { SearchResult } from '@/features/search/types/search.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const userId = route.params.id as string;
const { profile, playlists, pending, error, loadProfile, toggleFollow } = useProfile(userId);
const { t } = useI18n();

useHead({
  title: computed(() => profile.value?.name || t('profile.title'))
});

onMounted(() => {
  loadProfile();
});

const mappedPlaylists = computed<SearchResult[]>(() => {
  return playlists.value.map((p) => ({
    id: p.id,
    title: p.name,
    artist: `${p.trackCount} ${t('search.artist.songs', 'songs')}`,
    thumbnailUrl: p.imageUrl || '',
    type: 'playlist' as const,
    channelId: userId,
    durationSeconds: 0
  }));
});

const auth = useAuthStore();
const isSelf = computed(() => auth.user?.sub === userId);

const onPlayPlaylist = (playlist: SearchResult) => {
  navigateTo(`/playlist/${playlist.id}`);
};
</script>

<template>
  <div class="profile-page">
    <AppMusicPage
      :is-loading="pending"
      :is-error="!!error"
      :error-text="error?.message || $t('profile.private')"
      :title="profile?.name"
      :badge="$t('profile.title')"
      :image-url="profile?.picture"
      :rounded-image="true"
      :disable-play-button="true"
      :show-play-button="false">
      <template v-if="profile" #meta>
        <div class="profile-meta">
          <div class="profile-stats">
            <span>
              <strong>{{ profile.followersCount }}</strong>
              {{ $t('profile.followers') }}
            </span>
            <span>
              <strong>{{ profile.followingCount }}</strong>
              {{ $t('profile.following') }}
            </span>
          </div>
          <AppButton
            v-if="!isSelf"
            variant="primary"
            size="sm"
            class="profile-follow-btn"
            @click="toggleFollow">
            <AppIcon :name="profile.isFollowing ? 'ph:check-circle-fill' : 'ph:user-plus'" />
            {{ profile.isFollowing ? $t('profile.unfollow') : $t('profile.follow') }}
          </AppButton>
        </div>
      </template>

      <template #fallback-icon>
        <AppIcon name="ph:user" />
      </template>

      <template #tracks>
        <template v-if="profile && profile.isPublicProfile">
          <AppMusicSection :title="$t('profile.playlists')" layout="grid">
            <template v-if="playlists.length > 0">
              <TopResultCard
                v-for="playlist in mappedPlaylists"
                :key="playlist.id"
                :result="playlist"
                @play="onPlayPlaylist" />
            </template>
            <div v-else class="music-page__empty">
              <AppIcon name="ph:music-notes-plus" class="music-page__empty-icon" />
              <p>{{ $t('profile.noPlaylists') }}</p>
            </div>
          </AppMusicSection>
        </template>
      </template>
    </AppMusicPage>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  height: 100%;
}
.profile-meta {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  margin-top: var(--space-4);
}
.profile-stats {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-primary);
    font-size: var(--text-base);
  }
}
.profile-follow-btn {
  border-radius: var(--radius-full);
}
.music-page__empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
  color: var(--color-text-secondary);
  text-align: center;
}
.music-page__empty-icon {
  font-size: 3rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-4);
}
</style>
