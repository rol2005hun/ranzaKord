<script setup lang="ts">
import { computed, onMounted } from 'vue';

const { themeId, currentCustomColor } = useTheme();

const customColorStyle = computed(() => {
  if (!currentCustomColor.value) return '';
  return `:root { --color-primary-h: ${currentCustomColor.value.h}; --color-primary-s: ${currentCustomColor.value.s}%; --color-primary-l: ${currentCustomColor.value.l}%; }`;
});

const { locale } = useI18n({ useScope: 'global' });
const { showUpdateModal } = useAppUpdate();
const layoutStore = useLayoutStore();
const playerStore = usePlayerStore();

const isTauriApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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
    if (isTauriApp) {
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
  <div :class="{ 'is-tauri': isTauriApp }">
    <AppTitlebar v-if="isTauriApp" />
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
