<script setup lang="ts">
const route = useRoute();
const { isAuthenticated } = useAuth();
const playlistsStore = usePlaylistsStore();
const layoutStore = useLayoutStore();

const showCreateModal = ref(false);
const showImportModal = ref(false);
const showMobilePlaylists = ref(false);

useAsyncData(
  'user-playlists',
  async () => {
    if (isAuthenticated.value) {
      await playlistsStore.fetchAll();
    }
    return true;
  },
  {
    lazy: true
  }
);

function onPlaylistCreated(id: string): void {
  showCreateModal.value = false;
  navigateTo(`/playlist/${id}`);
}

function onPlaylistImported(id: string): void {
  showImportModal.value = false;
  navigateTo(`/playlist/${id}`);
}
const isHydrated = ref(false);
onMounted(() => {
  isHydrated.value = true;
});
</script>

<template>
  <div class="music-layout">
    <AppSidebar>
      <template #header-top>
        <NuxtLink to="/" class="app-sidebar__brand">
          <AppBrand />
        </NuxtLink>
      </template>

      <template #default="{ isExpanded }">
        <div v-if="isAuthenticated" class="music-layout__library">
          <div
            class="music-layout__library-header"
            :class="{ 'music-layout__library-header--expanded': isExpanded }">
            <div class="music-layout__library-title-wrapper" :title="$t('playlists.title')">
              <AppIcon name="ph:books-duotone" class="music-layout__library-icon" />
              <span class="music-layout__library-title app-sidebar__text">
                {{ $t('playlists.title') }}
              </span>
            </div>
            <div
              class="music-layout__library-actions"
              :class="{ 'music-layout__library-actions--expanded': isExpanded }">
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

          <div
            v-if="!isHydrated || playlistsStore.isLoading"
            class="music-layout__library-skeletons">
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

          <template v-else>
            <div
              v-if="playlistsStore.playlists.length === 0"
              class="music-layout__library-empty app-sidebar__text">
              <div class="music-layout__library-empty-content">
                <AppIcon
                  name="ph:music-notes-plus-duotone"
                  class="music-layout__library-empty-icon" />
                <p class="music-layout__library-empty-title">{{ $t('playlists.noPlaylists') }}</p>
                <p class="music-layout__library-empty-desc">{{ $t('playlists.createFirst') }}</p>
                <button class="music-layout__library-empty-btn" @click="showCreateModal = true">
                  {{ $t('playlists.newPlaylist') }}
                </button>
              </div>
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
          </template>
        </div>
      </template>
    </AppSidebar>

    <div class="music-layout__content">
      <AppNavbar @open-playlists="showMobilePlaylists = true" />
      <main class="music-layout__main">
        <slot />
      </main>
    </div>

    <Transition name="right-sidebar">
      <PlayerRightSidebar v-if="layoutStore.isRightSidebarOpen" />
    </Transition>

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
  height: calc(100dvh - var(--titlebar-height, 0px));
  margin-top: var(--titlebar-height, 0px);
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
  }

  &__library-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-2);
    padding: var(--space-2) 0;
    opacity: 1;
    overflow: hidden;
    gap: var(--space-2);

    &--expanded {
      flex-direction: row;
      justify-content: space-between;
      padding: var(--space-2) var(--space-3) var(--space-2) 1.5rem;
      height: 36px;
    }
  }

  &__library-title-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-secondary);
  }

  &__library-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    transition: color var(--transition-fast);
  }

  &__library-title {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: inherit;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__library-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex-shrink: 0;

    &--expanded {
      flex-direction: row;
      gap: var(--space-1);
    }
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
    padding: var(--space-2) 1.3rem;
  }

  &__library-empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-2);
    background: color-mix(in srgb, var(--color-surface-hover) 50%, transparent);
    border: 1px dashed var(--color-border-hover);
    border-radius: var(--radius-md);
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    white-space: normal; /* override app-sidebar__text */
  }

  &__library-empty-icon {
    font-size: 2rem;
    color: var(--color-text-secondary);
    opacity: 0.7;
    margin-bottom: -4px;
  }

  &__library-empty-title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__library-empty-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__library-empty-btn {
    margin-top: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-text-primary);
    color: var(--color-bg);
    border: none;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      transform: scale(1.05);
      background: var(--color-text-secondary);
    }
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

  :deep(.app-sidebar--expanded) &__playlist-info {
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

.right-sidebar-enter-active,
.right-sidebar-leave-active {
  transition:
    width var(--transition-slow),
    opacity var(--transition-slow);
  overflow: hidden;
}

.right-sidebar-enter-from,
.right-sidebar-leave-to {
  width: 0 !important;
  opacity: 0;
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
