<script setup lang="ts">
definePageMeta({
  layout: 'auth'
});

const route = useRoute();
const { t } = useI18n({ useScope: 'global' });

useHead({ title: t('auth.callback.loading') });

onMounted(async () => {
  const token = route.query.token as string | undefined;
  const remember = route.query.remember !== '0';

  if (token) {
    if (remember) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  }

  // Force a hard navigation to root so the app re-initializes and fetches the user
  window.location.href = '/';
});
</script>

<template>
  <div class="auth-callback">
    <AppSpinner size="lg" />
    <p>{{ $t('auth.callback.loading') }}</p>
  </div>
</template>

<style lang="scss" scoped>
.auth-callback {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  background: var(--color-bg);
}
</style>
