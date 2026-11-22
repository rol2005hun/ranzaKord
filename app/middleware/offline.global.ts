export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const { isOffline } = useNetworkStatus();
  if (isOffline.value) {
    if (to.path !== '/offline' && !to.path.startsWith('/offline/')) {
      return navigateTo('/offline');
    }
  }
});
