<script setup lang="ts">
const route = useRoute();
const { isAuthenticated } = useAuth();
const playlistsStore = usePlaylistsStore();

const navItems = [{ to: '/', icon: 'ph:house-fill', labelKey: 'core.nav.home' }];

const showCreateModal = ref(false);
const showImportModal = ref(false);
const showMobilePlaylists = ref(false);

await useAsyncData('user-playlists', async () => {
  if (isAuthenticated.value) {
    await playlistsStore.fetchAll();
  }
  return true;
});

function onPlaylistCreated(id: string): void {
  showCreateModal.value = false;
  navigateTo(`/playlist/${id}`);
}

function onPlaylistImported(id: string): void {
  showImportModal.value = false;
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

      <div v-if="isAuthenticated" class="music-layout__library">
        <div class="music-layout__library-header">
          <span class="music-layout__library-title app-sidebar__text">
            {{ $t('playlists.title') }}
          </span>
          <div class="music-layout__library-actions">
            <button
              class="music-layout__library-add"
              :title="$t('playlists.importPlaylist')"
              @click="showImportModal = true">
              <AppIcon name="ph:download-simple-bold" />
            </button>
            <button
              class="music-layout__library-add"
              :title="$t('playlists.newPlaylist')"
              @click="showCreateModal = true">
              <AppIcon name="ph:plus-bold" />
            </button>
          </div>
        </div>

        <div v-if="playlistsStore.isLoading" class="music-layout__library-skeletons">
          <div
            v-for="i in 5"
            :key="`skeleton-${i}`"
            class="app-sidebar-item music-layout__playlist-item music-layout__playlist-skeleton">
            <div class="music-layout__playlist-cover skeleton-box"></div>
            <div class="music-layout__playlist-info app-sidebar__text">
              <div class="skeleton-line skeleton-line--name"></div>
              <div class="skeleton-line skeleton-line--count"></div>
            </div>
          </div>
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
          class="app-sidebar-item music-layout__playlist-item"
          :class="{
            'app-sidebar-item--active': route.path === `/playlist/${playlist.id}`
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
    </AppSidebar>

    <div class="music-layout__content">
      <AppNavbar @open-playlists="showMobilePlaylists = true" />
      <main class="music-layout__main">
        <slot />
      </main>
    </div>

    <PlayerBar />

    <PlaylistModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="onPlaylistCreated" />

    <ImportPlaylistModal
      :open="showImportModal"
      @close="showImportModal = false"
      @imported="onPlaylistImported" />

    <AppModal
      :model-value="showMobilePlaylists"
      :title="$t('playlists.title')"
      @update:model-value="showMobilePlaylists = false">
      <div class="mobile-playlists">
        <div class="mobile-playlists__actions">
          <button
            class="mobile-playlists__btn"
            @click="
              showMobilePlaylists = false;
              showImportModal = true;
            ">
            <AppIcon name="ph:download-simple-bold" />
            {{ $t('playlists.importPlaylist') }}
          </button>
          <button
            class="mobile-playlists__btn mobile-playlists__btn--primary"
            @click="
              showMobilePlaylists = false;
              showCreateModal = true;
            ">
            <AppIcon name="ph:plus-bold" />
            {{ $t('playlists.newPlaylist') }}
          </button>
        </div>

        <div v-if="playlistsStore.isLoading" class="mobile-playlists__list">
          <AppSpinner />
        </div>
        <div v-else-if="playlistsStore.playlists.length === 0" class="mobile-playlists__empty">
          {{ $t('playlists.noPlaylists') }}
        </div>
        <div v-else class="mobile-playlists__list">
          <NuxtLink
            v-for="playlist in playlistsStore.playlists"
            :key="playlist.id"
            :to="`/playlist/${playlist.id}`"
            class="mobile-playlists__item"
            @click="showMobilePlaylists = false">
            <div class="mobile-playlists__cover">
              <img v-if="playlist.imageUrl" :src="playlist.imageUrl" :alt="playlist.name" />
              <AppIcon v-else name="ph:music-notes-fill" />
            </div>
            <div class="mobile-playlists__info">
              <span class="mobile-playlists__name">{{ playlist.name }}</span>
              <span class="mobile-playlists__count">
                {{ $t('playlists.trackCount', { count: playlist.trackCount }) }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style lang="scss" scoped>
.music-layout {
  display: flex;
  height: 100dvh;
  width: 100%;
  background: var(--color-bg);
  overflow: hidden;
  box-sizing: border-box;
  padding-bottom: var(--player-height, 90px);

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
    margin-bottom: var(--space-2);
    padding: var(--space-2) var(--space-3) var(--space-2) 1.3rem;
    height: 36px;
    opacity: 1;
    overflow: hidden;
    transition:
      opacity 0.2s,
      height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :deep(.app-sidebar:not(:hover):not(.app-sidebar--pinned)) &__library-header {
    height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
    transition:
      opacity 0.15s,
      height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__library-title {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__library-actions {
    display: flex;
    gap: var(--space-1);
    flex-shrink: 0;
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

  &__library-skeletons {
    display: flex;
    flex-direction: column;
  }

  &__playlist-skeleton {
    cursor: default;

    .skeleton-box {
      background: var(--color-surface-raised);
      animation: pulse 1.5s infinite ease-in-out;
    }

    .skeleton-line {
      background: var(--color-surface-raised);
      height: 10px;
      border-radius: var(--radius-sm);
      animation: pulse 1.5s infinite ease-in-out;

      &--name {
        width: 100px;
        margin-bottom: 4px;
        height: 12px;
      }

      &--count {
        width: 60px;
      }
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.5;
    }
  }

  &__library-empty {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    padding: var(--space-2) 1.3rem;
  }

  &__playlist-item {
    padding-left: 6px;
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

  :deep(.app-sidebar:hover) &__playlist-info,
  :deep(.app-sidebar--pinned) &__playlist-info {
    margin-left: 0.5rem;
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

    &__main {
      padding-bottom: 60px;
    }

    &__library {
      display: none;
    }
  }
}

.mobile-playlists {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__actions {
    display: flex;
    gap: var(--space-2);
  }

  &__btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;

    &--primary {
      background: var(--color-surface-hover);
      border-color: transparent;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-height: 50vh;
    overflow-y: auto;
    padding-right: var(--space-2);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: background var(--transition-fast);

    &:hover,
    &:active {
      background: var(--color-surface-hover);
    }
  }

  &__cover {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: var(--text-2xl);
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__empty {
    padding: var(--space-4) 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }
}
</style>
