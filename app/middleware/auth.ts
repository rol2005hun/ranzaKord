export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  const publicRoutes = ['/login', '/auth/callback'];

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/');
  }
});
