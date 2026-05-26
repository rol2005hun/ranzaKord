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
