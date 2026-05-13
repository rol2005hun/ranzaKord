<script setup lang="ts">
const appStore = useAppStore()
const { isAuthenticated, currentUser, logout } = useAuth()
</script>

<template>
  <div
    class="layout"
    :class="{ 'layout--dark': appStore.isDark }"
  >
    <header class="layout__header">
      <nav class="layout__nav">
        <NuxtLink to="/" class="layout__logo">
          {{ $t('appName') }}
        </NuxtLink>

        <div class="layout__nav-actions">
          <AppButton variant="ghost" @click="appStore.toggleTheme">
            <AppIcon :name="appStore.isDark ? 'ph:sun' : 'ph:moon'" />
          </AppButton>

          <template v-if="isAuthenticated">
            <span class="layout__user">{{ currentUser?.name }}</span>
            <AppButton variant="ghost" @click="logout">
              <AppIcon name="ph:sign-out" />
            </AppButton>
          </template>
          <template v-else>
            <AppButton href="/login" variant="secondary">Sign in</AppButton>
          </template>
        </div>
      </nav>
    </header>

    <main class="layout__main">
      <slot />
    </main>

    <footer class="layout__footer">
      <p>{{ $t('appName') }} © {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;

  &--dark {
    --color-bg: var(--color-bg-dark);
    --color-text-primary: var(--color-text-dark-primary);
    --color-text-secondary: var(--color-text-dark-secondary);
    --color-surface: var(--color-surface-dark);
    --color-border: var(--color-border-dark);
  }

  &__header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-3) var(--space-6);
  }

  &__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: var(--max-width);
    margin: 0 auto;
  }

  &__logo {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;
  }

  &__nav-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__user {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__main {
    flex: 1;
    max-width: var(--max-width);
    width: 100%;
    margin: 0 auto;
    padding: var(--space-8) var(--space-6);
  }

  &__footer {
    text-align: center;
    padding: var(--space-6);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    border-top: 1px solid var(--color-border);
  }
}
</style>
