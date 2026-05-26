<script setup lang="ts">
const route = useRoute();

const navItems = [
  { to: '/', icon: 'ph:house-fill', labelKey: 'core.nav.home' }
];
</script>

<template>
  <div class="music-layout">
    <AppSidebar>
      <template #header-top>
        <NuxtLink to="/" class="app-sidebar__brand">
          <AppIcon name="ph:music-note-fill" style="font-size: 2rem; color: var(--color-primary);" />
          <span class="app-sidebar__text" style="font-size: 1.25rem; font-weight: bold; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent, var(--color-primary-hover)) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ranzaKord</span>
        </NuxtLink>
      </template>

      <AppSidebarItem
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        :label="$t(item.labelKey)"
        :active="route.path === item.to"
      />
    </AppSidebar>

    <div class="music-layout__content">
      <AppNavbar />
      <main class="music-layout__main">
        <slot />
      </main>
    </div>

    <PlayerBar />
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

  @media (max-width: 768px) {
    flex-direction: column;

    &__content {
      /* Mobile sidebar is bottom nav above the player bar */
      padding-bottom: calc(var(--player-height, 0px) + 60px); 
    }
  }
}
</style>
