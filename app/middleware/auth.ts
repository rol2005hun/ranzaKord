/**
 * Auth middleware.
 * Protects routes that require authentication.
 * Usage: add `definePageMeta({ middleware: 'auth' })` to any page to protect it.
 */
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Public routes that never need auth
  const publicRoutes = ['/login', '/register']

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  // If already authenticated and hitting the login page, redirect home
  if (authStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
