<script setup lang="ts">
const route = useRoute();
const { isAuthenticated } = useAuth();
const playlistsStore = usePlaylistsStore();

const navItems = [{ to: '/', icon: 'ph:house-fill', labelKey: 'core.nav.home' }];

const showCreateModal = ref(false);

onMounted(async () => {
  if (isAuthenticated.value) {
    await playlistsStore.fetchAll();
  }
});

function onPlaylistCreated(id: string): void {
  showCreateModal.value = false;
  navigateTo(`/playlist/${id}`);
}
</script>

<template>
  <div class="music-layout">
    <AppSidebar>
      <template #header-top>
        <NuxtLink to="/" class="app-sidebar__brand">
          <AppBrand />
        </NuxtLink>
      </template>

      <AppSidebarItem
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        :label="$t(item.labelKey)"
        :active="route.path === item.to" />

      <ClientOnly>
        <div v-if="isAuthenticated" class="music-layout__library">
          <div class="music-layout__library-header">
            <span class="music-layout__library-title app-sidebar__text">
              {{ $t('playlists.title') }}
            </span>
            <button
              class="music-layout__library-add"
              :title="$t('playlists.newPlaylist')"
              @click="showCreateModal = true">
              <AppIcon name="ph:plus-bold" />
            </button>
          </div>

          <div v-if="playlistsStore.isLoading" class="music-layout__library-loading">
            <AppSpinner size="sm" />
          </div>

          <div
            v-else-if="playlistsStore.playlists.length === 0"
            class="music-layout__library-empty app-sidebar__text">
            {{ $t('playlists.noPlaylists') }}
          </div>

          <NuxtLink
            v-for="playlist in playlistsStore.playlists"
            :key="playlist.id"
            :to="`/playlist/${playlist.id}`"
            class="music-layout__playlist-item"
            :class="{
              'music-layout__playlist-item--active': route.path === `/playlist/${playlist.id}`
            }">
            <div class="music-layout__playlist-cover">
              <img v-if="playlist.imageUrl" :src="playlist.imageUrl" :alt="playlist.name" />
              <AppIcon v-else name="ph:music-notes-fill" />
            </div>
            <div class="music-layout__playlist-info app-sidebar__text">
              <span class="music-layout__playlist-name">{{ playlist.name }}</span>
              <span class="music-layout__playlist-count">
                {{ $t('playlists.trackCount', { count: playlist.trackCount }) }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </ClientOnly>
    </AppSidebar>

    <div class="music-layout__content">
      <AppNavbar />
      <main class="music-layout__main">
        <slot />
      </main>
    </div>

    <PlayerBar />

    <PlaylistModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="onPlaylistCreated" />
  </div>
</template>

<style lang="scss" scoped>
.music-layout {
  display: flex;
  height: 100dvh;
  width: 100%;
  background: var(--color-bg);
  overflow: hidden;

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
    height: 100%;
  }

  &__main {
    flex: 1;
    overflow-y: auto;
    padding-bottom: var(--player-height, 0px);
  }

  &__library {
    padding: var(--space-2) 0;
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-2);
  }

  &__library-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3) var(--space-2) 1.3rem;
    min-height: 36px;
  }

  &__library-title {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__library-add {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--text-lg);
    display: flex;
    align-items: center;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
    flex-shrink: 0;

    &:hover {
      color: var(--color-text-primary);
    }
  }

  &__library-loading {
    display: flex;
    justify-content: center;
    padding: var(--space-4);
  }

  &__library-empty {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    padding: var(--space-2) 1.3rem;
  }

  &__playlist-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 1.3rem;
    text-decoration: none;
    border-radius: var(--radius-md);
    margin: 0 var(--space-2);
    transition: background-color var(--transition-fast);

    &:hover {
      background: var(--color-surface-hover);
    }

    &--active {
      background: var(--color-surface-hover);
    }
  }

  &__playlist-cover {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    color: var(--color-text-secondary);
    font-size: var(--text-lg);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__playlist-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  &__playlist-name {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__playlist-count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  @media (max-width: 768px) {
    flex-direction: column;

    &__content {
      padding-bottom: calc(var(--player-height, 0px) + 60px);
    }

    &__library {
      display: none;
    }
  }
}
</style>
