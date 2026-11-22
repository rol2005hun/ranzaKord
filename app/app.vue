<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { getContrastColor } from '@/utils/color';
import { isTauriApp } from '@/utils/tauri';

const { themeId, currentCustomPalette } = useTheme();
const themeStore = useThemeStore();

const customColorStyle = computed(() => {
  if (!currentCustomPalette.value) return '';
  const cc = currentCustomPalette.value.primary;
  const sec = currentCustomPalette.value.secondary;
  const h = cc.h;

  let style = `html[data-theme] { 
    --color-primary-h: ${cc.h}; 
    --color-primary-s: ${cc.s}%; 
    --color-primary-l: ${cc.l}%; 
    --color-primary-foreground: ${getContrastColor(cc.hex)};
  }`;

  if (themeStore.isAdaptiveThemeEnabled) {
    style += `
      html[data-theme] {
        --color-bg: hsl(${h} 20% 4%);
        --color-surface: hsl(${h} 20% 8%);
        --color-surface-hover: hsl(${h} 20% 12%);
        --color-surface-raised: hsl(${h} 20% 16%);
        --color-surface-glass: hsl(${h} 20% 8% / 0.78);
        --color-border: hsl(${h} 20% 16%);
        --color-border-hover: hsl(${h} 20% 24%);
        --color-text-primary: hsl(${h} 10% 95%);
        --color-text-secondary: hsl(${h} 15% 75%);
        --color-text-tertiary: hsl(${h} 15% 55%);
        --gradient-hero: linear-gradient(135deg, hsl(${sec.h} 30% 12%) 0%, hsl(${h} 20% 4%) 100%);
      }
    `;
  }

  return style;
});

const htmlInlineStyle = computed(() => {
  if (!currentCustomPalette.value) return undefined;
  const cc = currentCustomPalette.value.primary;
  const sec = currentCustomPalette.value.secondary;
  const h = cc.h;

  const styles = [
    `--color-primary-h: ${cc.h}`,
    `--color-primary-s: ${cc.s}%`,
    `--color-primary-l: ${cc.l}%`,
    `--color-primary-foreground: ${getContrastColor(cc.hex)}`
  ];

  if (themeStore.isAdaptiveThemeEnabled) {
    styles.push(
      `--color-bg: hsl(${h} 20% 4%)`,
      `--color-surface: hsl(${h} 20% 8%)`,
      `--color-surface-hover: hsl(${h} 20% 12%)`,
      `--color-surface-raised: hsl(${h} 20% 16%)`,
      `--color-surface-glass: hsl(${h} 20% 8% / 0.78)`,
      `--color-border: hsl(${h} 20% 16%)`,
      `--color-border-hover: hsl(${h} 20% 24%)`,
      `--color-text-primary: hsl(${h} 10% 95%)`,
      `--color-text-secondary: hsl(${h} 15% 75%)`,
      `--color-text-tertiary: hsl(${h} 15% 55%)`,
      `--gradient-hero: linear-gradient(135deg, hsl(${sec.h} 30% 12%) 0%, hsl(${h} 20% 4%) 100%)`
    );
  }

  return styles.join('; ');
});

const { locale } = useI18n({ useScope: 'global' });
const { showUpdateModal } = useAppUpdate();
const layoutStore = useLayoutStore();
const playerStore = usePlayerStore();

useGlobalShortcuts();
useAdaptiveTheme();

const { initNetworkListener } = useNetworkStatus();

onMounted(() => {
  initNetworkListener();
});

const isTauriDesktop = ref(
  typeof window !== 'undefined' &&
    isTauriApp() &&
    !/android|ios|iphone|ipad/i.test(navigator.userAgent)
);

watch(
  () => playerStore.isAudioReactiveLyrics,
  (enabled) => {
    if (import.meta.client) {
      document.body.classList.toggle('audio-reactive-lyrics', Boolean(enabled));
    }
  },
  { immediate: true }
);

useHead(() => ({
  htmlAttrs: {
    'data-theme': themeId.value,
    style: htmlInlineStyle.value,
    lang: locale.value
  },
  bodyAttrs: {
    class: playerStore.isAudioReactiveLyrics ? 'audio-reactive-lyrics' : ''
  },
  style: [
    {
      textContent: customColorStyle.value,
      innerHTML: customColorStyle.value,
      id: 'theme-custom-color'
    }
  ]
}));

onMounted(async () => {
  if (isTauriApp() && !/android|ios|iphone|ipad/i.test(navigator.userAgent)) {
    isTauriDesktop.value = true;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().show();
    } catch (err) {
      console.error('Failed to initialize Tauri window:', err);
    }
  }
});
</script>

<template>
  <div :class="{ 'is-tauri': isTauriDesktop }">
    <ClientOnly>
      <AppTitlebar v-if="isTauriDesktop" />
    </ClientOnly>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
    <ClientOnly>
      <AppUpdateModal v-model="showUpdateModal" />
      <SettingsModal />
      <AppSnowEffect v-if="themeId === 'christmas'" />
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
