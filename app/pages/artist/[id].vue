<script setup lang="ts">
definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = route.params.id as string;
</script>

<template>
  <ArtistPage :artist-id="id" />
</template>
