<script setup lang="ts">
import { computed, onMounted } from 'vue';

const { themeId, currentCustomPalette } = useTheme();

const customColorStyle = computed(() => {
  if (!currentCustomPalette.value) return '';
  const cc = currentCustomPalette.value.primary;
  return `:root { --color-primary-h: ${cc.h}; --color-primary-s: ${cc.s}%; --color-primary-l: ${cc.l}%; }`;
});

const { locale } = useI18n({ useScope: 'global' });
const { showUpdateModal } = useAppUpdate();
const layoutStore = useLayoutStore();
const playerStore = usePlayerStore();

// Initialize global features
useGlobalShortcuts();
useAdaptiveTheme();

const isTauriDesktop =
  typeof window !== 'undefined' &&
  '__TAURI_INTERNALS__' in window &&
  !/android|ios|iphone|ipad/i.test(navigator.userAgent);

useHead(() => ({
  htmlAttrs: {
    'data-theme': themeId.value,
    lang: locale.value
  },
  bodyAttrs: {
    class: playerStore.isAudioReactiveLyrics ? 'audio-reactive-lyrics' : ''
  },
  style: [{ innerHTML: customColorStyle.value, id: 'theme-custom-color' }]
}));

onMounted(async () => {
  try {
    if (isTauriDesktop) {
      const { Window, getCurrentWindow } = await import('@tauri-apps/api/window');
      setTimeout(async () => {
        const splashscreen = await Window.getByLabel('splashscreen');
        if (splashscreen) {
          await splashscreen.close();
        }
        await getCurrentWindow().show();
      }, 50);
    }
  } catch (err) {
    console.error('Failed to initialize Tauri window:', err);
  }
});
</script>

<template>
  <div :class="{ 'is-tauri': isTauriDesktop }">
    <AppTitlebar v-if="isTauriDesktop" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
    <ClientOnly>
      <AppUpdateModal v-model="showUpdateModal" />
      <SettingsModal />
    </ClientOnly>

    <Teleport to="body">
      <FullscreenVisualizer v-if="layoutStore.isFullscreenVisualizer" />
      <ClientOnly>
        <MiniPlayer />
      </ClientOnly>
    </Teleport>

    <div class="app-version-overlay" aria-hidden="true">
      v{{ useRuntimeConfig().public.appVersion }}
    </div>
  </div>
</template>

<style scoped>
.app-version-overlay {
  position: fixed;
  bottom: 0;
  right: 8px;
  z-index: 9999;
  font-size: 10px;
  color: var(--color-text-secondary);
  pointer-events: none;
  font-family: monospace;
}
</style>
