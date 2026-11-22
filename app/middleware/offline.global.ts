export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const publicRoutes = ['/login', '/auth/save-token', '/unauthorized'];
  if (publicRoutes.includes(to.path) || to.path.startsWith('/auth/')) {
    return;
  }

  const { isOffline } = useNetworkStatus();
  if (isOffline.value) {
    if (to.path !== '/offline' && !to.path.startsWith('/offline/')) {
      return navigateTo('/offline');
    }
  }
});
