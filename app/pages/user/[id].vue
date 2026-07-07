<script setup lang="ts">
import { useRoute } from 'vue-router';
import type { UserProfileResponse } from '@/features/profile/types/profile.types';

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
  title: profile.value ? `${profile.value.name} - RanzaKord` : 'RanzaKord'
}));

const toggleFollow = async () => {
  if (!profile.value || isSelf.value) return;
  const action = profile.value.isFollowing ? 'unfollow' : 'follow';
  try {
    await $fetch(`/api/user/${userId}/follow`, {
      method: 'POST',
      body: { action }
    });
    // Optimistic UI update
    profile.value.isFollowing = !profile.value.isFollowing;
    if (profile.value.isFollowing) {
      profile.value.followersCount++;
    } else {
      profile.value.followersCount--;
    }
    toast.success(profile.value.isFollowing ? 'Felhasználó követve' : 'Követés visszavonva');
  } catch {
    toast.danger('Hiba történt a művelet során.');
  }
};
</script>

<template>
  <div class="user-page p-6 pb-24">
    <div v-if="pending" class="flex justify-center items-center h-48">
      <AppSpinner size="lg" />
    </div>

    <div v-else-if="error || !profile" class="text-center text-[var(--color-text-secondary)] mt-12">
      <AppIcon name="ph:user-circle-dashed-duotone" class="text-6xl mb-4 opacity-50 mx-auto" />
      <h2 class="text-2xl font-bold mb-2">Profil nem található</h2>
      <p>A felhasználó nem létezik, vagy a profilja privát.</p>
    </div>

    <div v-else class="user-page__content">
      <div
        class="user-page__header flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
        <div class="user-page__avatar relative group shrink-0">
          <img
            v-if="profile.picture"
            :src="profile.picture"
            :alt="profile.name"
            class="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-2xl border-4 border-[var(--color-bg-elevated)]" />
          <div
            v-else
            class="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center shadow-2xl border-4 border-[var(--color-bg-elevated)]">
            <AppIcon
              name="ph:user-fill"
              class="text-6xl md:text-8xl text-[var(--color-text-muted)]" />
          </div>
        </div>

        <div class="user-page__info text-center md:text-left flex-1">
          <span
            class="text-sm uppercase tracking-widest font-bold text-[var(--color-text-secondary)] mb-2 block">
            Profil
          </span>
          <h1
            class="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 tracking-tight leading-none">
            {{ profile.name }}
          </h1>
          <div
            class="flex items-center justify-center md:justify-start gap-4 text-sm text-[var(--color-text-secondary)] font-medium">
            <span>{{ profile.followersCount }} Követő</span>
            <span class="w-1 h-1 rounded-full bg-[var(--color-text-muted)]"></span>
            <span>{{ profile.followingCount }} Követett</span>
            <span class="w-1 h-1 rounded-full bg-[var(--color-text-muted)]"></span>
            <span>{{ playlists.length }} Publikus lista</span>
          </div>
        </div>
      </div>

      <div class="user-page__actions flex items-center justify-center md:justify-start gap-4 mb-10">
        <AppButton
          v-if="!isSelf"
          :variant="profile.isFollowing ? 'secondary' : 'primary'"
          size="lg"
          class="font-bold min-w-[140px]"
          @click="toggleFollow">
          {{ profile.isFollowing ? 'Követés visszavonása' : 'Követés' }}
        </AppButton>
        <AppButton
          variant="ghost"
          size="sm"
          class="rounded-full w-10 h-10 p-0 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white"
          @click="refresh">
          <AppIcon name="ph:arrows-clockwise" class="text-xl" />
        </AppButton>
      </div>

      <div class="user-page__playlists">
        <h2 class="text-2xl font-bold mb-6">Publikus listák</h2>

        <div
          v-if="playlists.length === 0"
          class="text-[var(--color-text-secondary)] py-8 text-center bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)]">
          Nincsenek publikus lejátszási listák.
        </div>

        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <NuxtLink
            v-for="playlist in playlists"
            :key="playlist.id"
            :to="`/playlist/${playlist.id}`"
            class="bg-[var(--color-bg-elevated)] p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all duration-300 group cursor-pointer border border-transparent hover:border-[var(--color-border)] shadow-md hover:shadow-xl">
            <div
              class="aspect-square rounded-lg bg-[var(--color-bg-soft)] mb-4 overflow-hidden relative shadow-lg">
              <img
                v-if="playlist.imageUrl"
                :src="playlist.imageUrl"
                :alt="playlist.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                <AppIcon name="ph:music-notes-fill" class="text-4xl" />
              </div>
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div
                  class="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <AppIcon name="ph:play-fill" class="text-xl ml-1" />
                </div>
              </div>
            </div>
            <h3
              class="font-bold text-[var(--color-text-primary)] truncate text-base mb-1 group-hover:text-[var(--color-primary)] transition-colors">
              {{ playlist.name }}
            </h3>
            <p class="text-sm text-[var(--color-text-secondary)] truncate">
              {{ playlist.trackCount }} dal
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
