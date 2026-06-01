export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  const publicRoutes = ['/login', '/auth/callback', '/unauthorized'];

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated) {
    const hasAccess = authStore.currentUser?.hasAccess ?? false;

    if (!hasAccess && to.path !== '/unauthorized' && to.path !== '/auth/callback') {
      return navigateTo('/unauthorized');
    }

    if (hasAccess && (to.path === '/login' || to.path === '/unauthorized')) {
      return navigateTo('/');
    }
  }
});
