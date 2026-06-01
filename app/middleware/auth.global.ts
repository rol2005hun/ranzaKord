export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  const publicRoutes = ['/login', '/auth/save-token', '/unauthorized'];

  // Ignore internal Nuxt paths (e.g. __nuxt_hints)
  if (to.path.startsWith('/__nuxt')) return;

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated) {
    const hasAccess = authStore.currentUser?.hasAccess ?? false;

    if (!hasAccess && to.path !== '/unauthorized' && to.path !== '/auth/save-token') {
      return navigateTo('/unauthorized');
    }

    if (hasAccess && (to.path === '/login' || to.path === '/unauthorized')) {
      return navigateTo('/');
    }
  }
});
