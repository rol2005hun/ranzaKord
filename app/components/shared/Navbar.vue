<script setup lang="ts">
const { currentUser, logout, isAuthenticated } = useAuth();
const { themeId, themes, setTheme } = useTheme();
const { locale, setLocale } = useI18n();

const isDropdownOpen = ref(false);

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
      <div v-if="isAuthenticated && currentUser" class="app-navbar__user">
        <button class="app-navbar__avatar" :aria-label="$t('auth.profile')" @click="toggleDropdown">
          <img
            v-if="currentUser.picture"
            :src="currentUser.picture"
            :alt="currentUser.name"
            class="app-navbar__avatar-img" />
          <AppIcon v-else name="ph:user-circle-fill" />
        </button>

        <div
          v-if="isDropdownOpen"
          class="app-navbar__dropdown-overlay"
          @click="closeDropdown"></div>

        <div v-if="isDropdownOpen" class="app-navbar__dropdown">
          <div class="app-navbar__dropdown-row">
            <span class="app-navbar__dropdown-row-label">Language</span>
            <div class="app-navbar__dropdown-toggle">
              <button :class="{ active: (locale as any) === 'en' }" @click="setLocale('en' as any)">
                EN
              </button>
              <button :class="{ active: (locale as any) === 'hu' }" @click="setLocale('hu' as any)">
                HU
              </button>
            </div>
          </div>

          <div class="app-navbar__dropdown-row">
            <span class="app-navbar__dropdown-row-label">Theme</span>
            <div class="app-navbar__dropdown-toggle">
              <button
                v-for="theme in themes"
                :key="theme.id"
                :class="{ active: themeId === theme.id }"
                @click="setTheme(theme.id)">
                <AppIcon :name="theme.icon" />
              </button>
            </div>
          </div>

          <div
            class="app-navbar__dropdown-divider"
            style="margin: var(--space-2) var(--space-4)"></div>

          <button
            class="app-navbar__dropdown-item"
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
    width: 260px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: var(--space-2) 0;
    animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__dropdown-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
  }

  &__dropdown-row-label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__dropdown-toggle {
    display: flex;
    background: var(--color-surface-hover);
    border-radius: var(--radius-md);
    padding: 2px;

    button {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        background var(--transition-fast),
        color var(--transition-fast);

      &.active {
        background: var(--color-surface);
        color: var(--color-primary);
        box-shadow: var(--shadow-sm);
      }

      &:hover:not(.active) {
        color: var(--color-text-primary);
      }

      .app-icon {
        font-size: var(--text-lg);
      }
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

@media (max-width: 768px) {
  .app-navbar {
    padding: 0 var(--space-4);
  }
}
</style>
