export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'post',
  async setup() {
    const { fetchUser, isAuthenticated } = useAuth();
    const authInitialized = useState<boolean>('auth:initialized', () => false);

    if (import.meta.server) {
      authInitialized.value = true;
      await fetchUser();
    } else if (!authInitialized.value) {
      authInitialized.value = true;
      if (!isAuthenticated.value) {
        await fetchUser();
      }
    }
  }
});
