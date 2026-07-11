<script setup lang="ts">
import { useRoute } from 'vue-router';
import type { UserProfileResponse } from '@/features/profile/types/profile.types';
import ConnectionsModal from '@/features/profile/components/ConnectionsModal.vue';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const userId = route.params.id as string;
const authStore = useAuthStore();
const toast = useToast();

const { data, pending, error, refresh } = await useFetch<UserProfileResponse>(
  `/api/user/profile?id=${userId}`,
  {
    key: `user-profile-${userId}`,
    server: false
  }
);

const profile = computed(() => data.value?.profile);
const playlists = computed(() => data.value?.playlists || []);
const isSelf = computed(() => authStore.currentUser?.sub === userId);

useHead(() => ({
  title: profile.value ? profile.value.name : 'Profil'
}));

const isFollowLoading = ref(false);

const toggleFollow = async () => {
  if (!data.value?.profile || isSelf.value || isFollowLoading.value) return;
  const action = data.value.profile.isFollowing ? 'unfollow' : 'follow';

  isFollowLoading.value = true;
  try {
    await $fetch(`/api/user/follow`, {
      method: 'POST',
      body: { action, targetSub: userId }
    });
    // Optimistic UI update
    data.value.profile.isFollowing = !data.value.profile.isFollowing;
    if (data.value.profile.isFollowing) {
      data.value.profile.followersCount++;
    } else {
      data.value.profile.followersCount--;
    }
  } catch (err) {
    console.error('Follow error:', err);
    toast.danger('Hiba történt a művelet során.');
  } finally {
    isFollowLoading.value = false;
  }
};

const isConnectionsModalOpen = ref(false);
const connectionsModalType = ref<'followers' | 'following'>('followers');

const openConnections = (type: 'followers' | 'following') => {
  const count =
    type === 'followers' ? profile.value?.followersCount : profile.value?.followingCount;

  if (!count) return;

  connectionsModalType.value = type;
  isConnectionsModalOpen.value = true;
};
</script>

<template>
  <div class="user-page">
    <AppMusicPage
      :is-loading="pending"
      :is-error="!!error || (!profile && !pending)"
      error-text="Profil nem található. Lehet, hogy privát vagy nem létezik."
      :title="profile?.name"
      badge="Profil"
      :image-url="profile?.picture"
      :rounded-image="true"
      :show-play-button="false">
      <template #fallback-icon>
        <AppIcon name="ph:user-fill" />
      </template>

      <template #skeleton-tracks>
        <div class="user-page__content">
          <h2 class="user-page__section-title">Publikus listák</h2>
          <div class="user-page__grid">
            <div
              v-for="i in 6"
              :key="`sk-pl-${i}`"
              class="user-page__playlist-card"
              style="pointer-events: none">
              <div
                class="user-page__playlist-cover"
                style="
                  background: var(--color-surface-raised);
                  animation: pulse 1.5s infinite ease-in-out;
                "></div>
              <div
                style="
                  width: 80%;
                  height: 16px;
                  background: var(--color-surface-raised);
                  margin-bottom: 8px;
                  border-radius: var(--radius-sm);
                  animation: pulse 1.5s infinite ease-in-out;
                "></div>
              <div
                style="
                  width: 40%;
                  height: 12px;
                  background: var(--color-surface-raised);
                  border-radius: var(--radius-sm);
                  animation: pulse 1.5s infinite ease-in-out;
                "></div>
            </div>
          </div>
        </div>
      </template>

      <template #meta>
        <span
          class="user-page__stat"
          :class="{ 'user-page__stat--clickable': profile?.followersCount }"
          @click="openConnections('followers')">
          {{ profile?.followersCount || 0 }} {{ $t('profile.followers') }}
        </span>
        <span class="user-page__stat-dot">•</span>
        <span
          class="user-page__stat"
          :class="{ 'user-page__stat--clickable': profile?.followingCount }"
          @click="openConnections('following')">
          {{ profile?.followingCount || 0 }} {{ $t('profile.following') }}
        </span>
        <span class="user-page__stat-dot">•</span>
        <span class="user-page__stat">{{ playlists.length }} {{ $t('profile.playlists') }}</span>
      </template>

      <template #actions>
        <button
          v-if="!isSelf && profile"
          class="user-page__follow-btn"
          :class="{
            'user-page__follow-btn--following': profile.isFollowing,
            'is-loading': isFollowLoading
          }"
          :disabled="isFollowLoading"
          @click="toggleFollow">
          <div class="user-page__follow-content">
            <AppSpinner v-if="isFollowLoading" size="sm" />
            <template v-else>
              <AppIcon
                v-if="profile.isFollowing"
                name="ph:check-bold"
                class="user-page__follow-icon" />
              <span>{{ profile.isFollowing ? 'Követve' : 'Követés' }}</span>
            </template>
          </div>
        </button>
        <AppButton
          variant="ghost"
          size="sm"
          class="user-page__refresh-btn"
          aria-label="Frissítés"
          @click="refresh">
          <AppIcon name="ph:arrows-clockwise" class="text-xl" />
        </AppButton>
      </template>

      <template #tracks>
        <div class="user-page__content">
          <h2 class="user-page__section-title">Publikus listák</h2>

          <div v-if="playlists.length === 0 && !pending" class="user-page__empty">
            <AppIcon name="ph:books" class="user-page__empty-icon" />
            <p>Nincsenek publikus lejátszási listák.</p>
          </div>

          <div v-else class="user-page__grid">
            <NuxtLink
              v-for="playlist in playlists"
              :key="playlist.id"
              :to="`/playlist/${playlist.id}`"
              class="user-page__playlist-card">
              <div class="user-page__playlist-cover">
                <img v-if="playlist.imageUrl" :src="playlist.imageUrl" :alt="playlist.name" />
                <div v-else class="user-page__playlist-fallback">
                  <AppIcon name="ph:music-notes-fill" />
                </div>
                <div class="user-page__playlist-overlay">
                  <div class="user-page__playlist-play">
                    <AppIcon name="ph:play-fill" />
                  </div>
                </div>
              </div>
              <h3 class="user-page__playlist-name">{{ playlist.name }}</h3>
              <p class="user-page__playlist-count">{{ playlist.trackCount }} dal</p>
            </NuxtLink>
          </div>
        </div>
      </template>
    </AppMusicPage>

    <ConnectionsModal
      v-model="isConnectionsModalOpen"
      :user-id="userId"
      :type="connectionsModalType" />
  </div>
</template>

<style scoped lang="scss">
.user-page {
  height: 100%;

  &__stat {
    font-weight: var(--font-weight-medium);

    &--clickable {
      cursor: pointer;
      transition: color var(--transition-fast);

      &:hover {
        color: var(--color-primary);
        text-decoration: underline;
      }
    }
  }

  &__stat-dot {
    color: var(--color-text-muted);
    font-size: 0.8em;
  }

  &__follow-btn {
    font-weight: var(--font-weight-semibold);
    font-size: var(--text-sm);
    padding: 0 var(--space-5);
    min-width: 120px;
    height: 36px;
    border-radius: var(--radius-full);
    border: 1px solid transparent;
    background: var(--color-primary);
    color: #000;
    transition: all 0.2s ease;
    overflow: hidden;
    cursor: pointer;

    &:hover {
      transform: scale(1.04);
    }

    &--following {
      background-color: transparent;
      border-color: rgba(255, 255, 255, 0.4);
      color: var(--color-text-primary);

      &:hover {
        border-color: var(--color-text-danger);
        color: var(--color-text-danger);

        .user-page__follow-content span {
          display: none;
        }
        .user-page__follow-content::after {
          content: 'Kikövetés';
          display: block;
        }
        .user-page__follow-icon {
          display: none;
        }
      }
    }
  }

  &__follow-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  &__follow-icon {
    font-size: 1.1em;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes popIn {
    0% {
      transform: scale(0) rotate(-45deg);
      opacity: 0;
    }
    100% {
      transform: scale(1) rotate(0);
      opacity: 1;
    }
  }

  &__refresh-btn {
    border-radius: 50%;
    width: 44px;
    height: 44px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-text-primary);
      background-color: var(--color-surface-hover);
    }
  }

  &__content {
    padding: var(--space-6);
  }

  &__section-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-6);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12) 0;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    border: 1px dashed var(--color-border);
    gap: var(--space-3);
  }

  &__empty-icon {
    font-size: 4rem;
    opacity: 0.5;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-6);
  }

  &__playlist-card {
    background: var(--color-surface);
    padding: var(--space-4);
    border-radius: var(--radius-xl);
    transition: all var(--transition-normal);
    text-decoration: none;
    border: 1px solid transparent;

    &:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-border);
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);

      .user-page__playlist-overlay {
        opacity: 1;
      }

      .user-page__playlist-play {
        transform: translateY(0);
        opacity: 1;
      }
    }
  }

  &__playlist-cover {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: var(--space-4);
    position: relative;
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-md);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__playlist-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: 4rem;
  }

  &__playlist-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__playlist-play {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transform: translateY(10px);
    opacity: 0;
    transition: all var(--transition-fast) cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);

    svg {
      margin-left: 2px;
    }
  }

  &__playlist-name {
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__playlist-count {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
}
</style>
