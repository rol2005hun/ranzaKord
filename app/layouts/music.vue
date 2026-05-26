<script setup lang="ts">
const { currentUser, logout, isAuthenticated } = useAuth();
const route = useRoute();

const navItems = [
  { to: '/', icon: 'ph:house-fill', labelKey: 'nav.home' },
  { to: '/search', icon: 'ph:magnifying-glass-bold', labelKey: 'nav.search' }
];
</script>

<template>
  <div class="music-layout">
    <aside class="music-layout__sidebar">
      <div class="music-layout__brand">
        <AppIcon name="ph:music-note-fill" class="music-layout__brand-icon" />
        <span class="music-layout__brand-name">ranzaKord</span>
      </div>

      <nav class="music-layout__nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="music-layout__nav-item"
          :class="{ 'music-layout__nav-item--active': route.path === item.to }"
        >
          <AppIcon :name="item.icon" class="music-layout__nav-icon" />
          <span>{{ $t(item.labelKey) }}</span>
        </NuxtLink>
      </nav>

      <div class="music-layout__sidebar-footer">
        <div v-if="isAuthenticated && currentUser" class="music-layout__user">
          <div class="music-layout__avatar">
            <img
              v-if="currentUser.picture"
              :src="currentUser.picture"
              :alt="currentUser.name"
              class="music-layout__avatar-img"
            />
            <AppIcon v-else name="ph:user-circle-fill" />
          </div>
          <div class="music-layout__user-info">
            <span class="music-layout__user-name">{{ currentUser.name }}</span>
            <span class="music-layout__user-email">{{ currentUser.email }}</span>
          </div>
          <button
            class="music-layout__logout-btn"
            :aria-label="$t('auth.logout')"
            @click="logout"
          >
            <AppIcon name="ph:sign-out" />
          </button>
        </div>
      </div>
    </aside>

    <main class="music-layout__main">
      <slot />
    </main>

    <PlayerBar />
  </div>
</template>

<style lang="scss" scoped>
.music-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: 1fr;
  min-height: 100dvh;
  background: var(--color-bg);
  color: var(--color-text-primary);

  &__sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--sidebar-bg, var(--color-surface));
    border-right: 1px solid var(--color-border);
    z-index: var(--z-sidebar);
    overflow-y: auto;
    padding-bottom: var(--player-height);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-6) var(--space-5);
    border-bottom: 1px solid var(--color-border);
  }

  &__brand-icon {
    font-size: var(--text-2xl);
    color: var(--color-primary);
  }

  &__brand-name {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(
      135deg,
      var(--color-primary) 0%,
      var(--color-accent, var(--color-primary-hover)) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4) var(--space-3);
    flex: 1;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-3);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    transition:
      color var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--sidebar-hover-bg, var(--color-surface-hover));
    }

    &--active {
      color: var(--color-text-primary);
      background: var(--sidebar-active-bg, var(--color-surface-hover));
      font-weight: var(--font-weight-semibold);

      .music-layout__nav-icon {
        color: var(--color-primary);
      }
    }
  }

  &__nav-icon {
    font-size: var(--text-lg);
    flex-shrink: 0;
  }

  &__sidebar-footer {
    padding: var(--space-4) var(--space-3);
    border-top: 1px solid var(--color-border);
  }

  &__user {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  &__avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    overflow: hidden;
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: var(--text-xl);
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__user-name {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-email {
    font-size: 10px;
    color: var(--color-text-disabled);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__logout-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-danger);
    }
  }

  &__main {
    min-height: 100dvh;
    padding-bottom: var(--player-height);
    overflow-y: auto;
  }
}
</style>
