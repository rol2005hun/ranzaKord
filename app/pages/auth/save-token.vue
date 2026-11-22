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
    const maxAge = remember ? 31536000 : 86400;
    const isHttps = window.location.protocol === 'https:';
    document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`;
  }

  const { fetchUser } = useAuth();
  await fetchUser();

  const authStore = useAuthStore();
  if (authStore.isAuthenticated) {
    if (authStore.currentUser?.hasAccess) {
      await navigateTo('/');
    } else {
      await navigateTo('/unauthorized');
    }
  } else {
    await navigateTo('/login');
  }
});
</script>

<template>
  <div class="auth-callback">
    <AppSpinner size="lg" />
    <h1 class="auth-callback__title">{{ $t('auth.callback.loading') }}</h1>
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

  &__title {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    color: var(--color-text-secondary);
  }
}
</style>
