<script setup lang="ts">
const { themeId, customColor } = useTheme();

const customColorStyle = computed(() => {
  if (!customColor.value) return '';
  return `:root { --color-primary-h: ${customColor.value.h}; --color-primary-s: ${customColor.value.s}%; --color-primary-l: ${customColor.value.l}%; }`;
});

const { locale } = useI18n();
const { showUpdateModal } = useAppUpdate();

useHead({
  htmlAttrs: {
    'data-theme': themeId,
    lang: locale
  },
  style: [{ innerHTML: customColorStyle, id: 'theme-custom-color' }]
});

onMounted(async () => {
  try {
    const { isTauri } = await import('@tauri-apps/api/core');
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      setTimeout(() => {
        getCurrentWindow().show();
      }, 50);
    }
  } catch (err) {
    console.error('Failed to initialize Tauri window:', err);
  }
});
</script>

<template>
  <NuxtErrorBoundary>
    <template #error="{ error, clearError }">
      <div
        style="
          padding: 2rem;
          background: #1a1a1a;
          color: #ff5555;
          height: 100vh;
          font-family: monospace;
          overflow: auto;
        ">
        <h1 style="color: #ff0000; font-size: 24px; margin-bottom: 1rem">
          FATAL ERROR (Hiba történt!)
        </h1>
        <p style="margin-bottom: 1rem; color: #ccc">
          A Nuxt/Vue összeomlott. Kérlek másold ki ezt a hibaüzenetet:
        </p>
        <pre
          style="
            background: #000;
            padding: 1rem;
            border-radius: 4px;
            border: 1px solid #333;
            white-space: pre-wrap;
            word-break: break-all;
          "
          >{{ error }}</pre
        >
        <button
          style="
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #ff5555;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
          "
          @click="clearError()">
          Kezdőlap
        </button>
      </div>
    </template>

    <div>
      <NuxtRouteAnnouncer />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppToast />
      <ClientOnly>
        <AppUpdateModal v-model="showUpdateModal" />
      </ClientOnly>
    </div>
  </NuxtErrorBoundary>
</template>
