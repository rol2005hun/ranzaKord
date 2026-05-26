export default defineNuxtPlugin(async () => {
  const { fetchUser, isAuthenticated } = useAuth();

  if (import.meta.server) {
    await fetchUser();
  } else if (!isAuthenticated.value) {
    await fetchUser();
  }
});
