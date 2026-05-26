<script setup lang="ts">
definePageMeta({
  layout: 'music',
  middleware: ['auth']
});

const { t } = useI18n();
useHead({ title: t('nav.home') });
</script>

<template>
  <HomeHero />
</template>
