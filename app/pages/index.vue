<script setup lang="ts">
definePageMeta({
  layout: 'music',
  middleware: ['auth']
});

useHead({ title: 'Home' });
</script>

<template>
  <HomeHero />
</template>
