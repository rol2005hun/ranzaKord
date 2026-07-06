export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'post',
  async setup() {
    const { fetchUser, isAuthenticated } = useAuth();

    if (import.meta.server) {
      await fetchUser();
    } else if (!isAuthenticated.value) {
      await fetchUser();
    }
  }
});
