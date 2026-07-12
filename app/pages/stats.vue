<script setup lang="ts">
definePageMeta({
  layout: 'music',
  middleware: [
    function () {
      const authStore = useAuthStore();
      if (!authStore.currentUser?.roles?.includes('ranzaKreator')) {
        return navigateTo('/');
      }
    }
  ]
});

useHead({
  title: 'ranzaKord Wrapped'
});
</script>

<template>
  <StatsDashboard />
</template>
