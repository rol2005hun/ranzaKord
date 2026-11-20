<script setup lang="ts">
import StreamStatsDashboard from '@/features/streamStats/components/StreamStatsDashboard.vue';

definePageMeta({
  layout: 'music',
  middleware: [
    function () {
      const authStore = useAuthStore();
      if (!authStore.isDeveloper) {
        return navigateTo('/unauthorized');
      }
    }
  ]
});

const { t } = useI18n();

useHead({
  title: t('streamStats.title')
});
</script>

<template>
  <StreamStatsDashboard />
</template>
