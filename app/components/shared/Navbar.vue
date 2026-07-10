<script setup lang="ts">
const { currentUser, logout, isAuthenticated } = useAuth();
const { updateInfo, showUpdateModal } = useAppUpdate();
const layoutStore = useLayoutStore();

const isDropdownOpen = ref(false);
const isTauriApp = ref(false);

onMounted(() => {
  isTauriApp.value = '__TAURI_INTERNALS__' in window;
});

watch(
  () => updateInfo.value.available,
  (available) => {
    if (available && updateInfo.value.isMandatory) {
      showUpdateModal.value = true;
    }
  }
);

const emit = defineEmits<{
  (e: 'open-playlists'): void;
}>();

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function closeDropdown() {
  isDropdownOpen.value = false;
}
</script>

<template>
  <header class="app-navbar">
    <div class="app-navbar__left">
      <button
        class="app-navbar__mobile-menu"
        :aria-label="$t('playlists.title')"
        @click="emit('open-playlists')">
        <AppIcon name="ph:list" />
      </button>
      <SearchBar />
    </div>

    <div class="app-navbar__right">
      <button
        v-if="updateInfo.available"
        class="app-navbar__update-btn"
        :title="$t('updater.updateAvailable')"
        @click="showUpdateModal = true">
        <AppIcon name="ph:download-simple" />
        <span class="app-navbar__update-text">{{ $t('updater.updateAvailable') }}</span>
      </button>

      <a
        v-if="!isTauriApp"
        href="https://github.com/rol2005hun/ranzaKord/releases/latest"
        target="_blank"
        class="app-navbar__download-btn">
        <AppIcon name="ph:desktop" />
        <span>{{ $t('core.nav.downloadApp') }}</span>
      </a>

      <div v-if="isAuthenticated && currentUser" class="app-navbar__user">
        <div class="app-navbar__avatar-wrapper">
          <button
            class="app-navbar__avatar"
            :aria-label="$t('auth.profile')"
            @click="toggleDropdown">
            <img
              v-if="currentUser.picture"
              :src="currentUser.picture"
              :alt="currentUser.name"
              class="app-navbar__avatar-img" />
            <AppIcon v-else name="ph:user-circle-fill" />
          </button>

          <div
            v-if="currentUser.roles?.includes('ranzaKreator')"
            class="app-navbar__dev-badge"
            title="ranzaKreator">
            <AppIcon name="ph:code-bold" />
          </div>
        </div>

        <div
          v-if="isDropdownOpen"
          class="app-navbar__dropdown-overlay"
          @click="closeDropdown"></div>

        <div v-if="isDropdownOpen" class="app-navbar__dropdown">
          <button
            class="app-navbar__dropdown-item"
            @click="
              () => {
                layoutStore.openSettings();
                closeDropdown();
              }
            ">
            <AppIcon name="ph:gear" class="app-navbar__dropdown-icon" />
            <span class="app-navbar__dropdown-label">
              {{ $t('core.actions.settings') }}
            </span>
          </button>

          <div class="app-navbar__dropdown-divider" style="margin: var(--space-2) 0"></div>

          <button
            class="app-navbar__dropdown-item app-navbar__dropdown-item--danger"
            @click="
              () => {
                logout();
                closeDropdown();
              }
            ">
            <AppIcon name="ph:sign-out" class="app-navbar__dropdown-icon" />
            <span class="app-navbar__dropdown-label">{{ $t('auth.logout') }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  <SettingsModal />
</template>

<style lang="scss" scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: 4.5rem;
  padding: 0 var(--space-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: var(--z-fixed, 100);

  &__left {
    flex: 1;
    display: flex;
    align-items: center;
    max-width: 600px;
    min-width: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-left: auto;
  }

  &__download-btn {
    display: none;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background-color: var(--color-surface-hover);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    transition: all var(--transition-fast);

    &:hover {
      background-color: var(--color-primary);
      color: var(--color-primary-foreground, #ffffff);
      border-color: var(--color-primary);
    }

    @media (min-width: 769px) {
      display: flex;
    }
  }

  &__update-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    animation: pulse 2s infinite;

    &:hover {
      background-color: var(--color-primary);
      color: var(--color-primary-foreground, #ffffff);
    }

    @media (max-width: 768px) {
      padding: var(--space-2);
      gap: 0;
    }
  }

  &__update-text {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &__mobile-menu {
    display: none;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: var(--text-2xl);
    cursor: pointer;
    margin-right: var(--space-3);
    padding: var(--space-1);
    outline: none;

    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  &__user {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__avatar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__dev-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: linear-gradient(135deg, var(--color-primary), #9353d3);
    color: #ffffff;
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    border: 2px solid var(--color-surface);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    z-index: 2;
    pointer-events: none;
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    overflow: hidden;
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: var(--text-2xl);
    border: none;
    padding: 0;
    cursor: pointer;
    outline: none;
    transition:
      transform var(--transition-fast),
      box-shadow var(--transition-fast);

    &:hover {
      transform: scale(1.05);
    }

    &:focus-visible {
      box-shadow: 0 0 0 2px var(--color-ring);
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__dropdown-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    width: 280px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    display: flex;
    flex-direction: column;
    overflow: visible;
    padding: var(--space-2) 0;
    animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__dropdown-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
  }

  &__dropdown-row-label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__select {
    width: 140px;
    flex-shrink: 0;

    :deep(.select) {
      padding-top: var(--space-2);
      padding-bottom: var(--space-2);
      font-size: var(--text-sm);
    }
  }

  &__dropdown-divider {
    height: 1px;
    background-color: var(--color-border);
    margin: 0;
  }

  &__dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: none;
    border: none;
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    text-align: left;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      background-color: var(--color-surface-hover);
    }

    &--danger {
      color: var(--color-danger);

      &:hover {
        background-color: color-mix(in srgb, var(--color-danger) 10%, transparent);
      }
    }

    &--active {
      color: var(--color-primary);
      background-color: var(--color-primary-subtle);

      &:hover {
        background-color: var(--color-primary-subtle);
      }
    }
  }

  &__dropdown-icon {
    font-size: var(--text-lg);
    flex-shrink: 0;
  }

  &__dropdown-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__dropdown-check {
    font-size: 0.85rem;
    color: var(--color-primary);
    flex-shrink: 0;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 40%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@media (max-width: 768px) {
  .app-navbar {
    padding-top: max(var(--safe-area-top, 0px), var(--space-2));
    padding-bottom: var(--space-2);
    padding-left: var(--space-4);
    padding-right: var(--space-4);
    height: auto;
    min-height: calc(3.5rem + max(var(--safe-area-top, 0px), var(--space-2)));
  }
}
</style>
