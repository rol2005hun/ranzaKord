<script setup lang="ts">
const { themeId, themes, setTheme } = useTheme();
const { isAuthenticated, currentUser, logout } = useAuth();
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <nav class="layout__nav">
        <NuxtLink to="/" class="layout__logo">
          {{ $t('appName') }}
        </NuxtLink>

        <div class="layout__nav-actions">
          <select
            :value="themeId"
            class="layout__theme-select"
            @change="
              setTheme(($event.target as HTMLSelectElement).value as (typeof themes)[number]['id'])
            ">
            <option v-for="theme in themes" :key="theme.id" :value="theme.id">
              {{ theme.label }}
            </option>
          </select>

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

  &__theme-select {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
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
