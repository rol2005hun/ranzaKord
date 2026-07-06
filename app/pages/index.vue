<script setup lang="ts">
definePageMeta({
  layout: 'music'
});

const { t } = useI18n({ useScope: 'global' });
useHead({ title: () => t('core.nav.home') });
</script>

<template>
  <HomeHero />
</template>
