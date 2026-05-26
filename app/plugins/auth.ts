export default defineNuxtPlugin(async () => {
  const { fetchUser } = useAuth();

  // Only fetch user on the server (SSR) or if it's a client-side navigation and we don't have state
  if (import.meta.server) {
    await fetchUser();
  }
});
