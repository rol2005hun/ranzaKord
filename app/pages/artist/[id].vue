<script setup lang="ts">
definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = computed(() => route.params.id as string);
</script>

<template>
  <ArtistPage :key="id" :artist-id="id" />
</template>
