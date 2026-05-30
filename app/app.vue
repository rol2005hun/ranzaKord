<script setup lang="ts">
const { themeId, customColor } = useTheme();

const customColorStyle = computed(() => {
  if (!customColor.value) return '';
  return `:root { --color-primary-h: ${customColor.value.h}; --color-primary-s: ${customColor.value.s}%; --color-primary-l: ${customColor.value.l}%; }`;
});

useHead({
  htmlAttrs: {
    'data-theme': themeId
  },
  style: [{ innerHTML: customColorStyle, id: 'theme-custom-color' }]
});

onMounted(async () => {
  try {
    const { isTauri } = await import('@tauri-apps/api/core');
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      // Delay showing the window slightly to avoid a black flash during webview initialization
      setTimeout(() => {
        getCurrentWindow().show();
      }, 50);
    }
  } catch {
    // Ignored
  }
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
  </div>
</template>
