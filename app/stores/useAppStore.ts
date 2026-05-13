import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Global app-level store.
 * Use this for cross-feature state (e.g. theme, loading, auth status).
 * Feature-specific state belongs in feature/stores/.
 */
export const useAppStore = defineStore('app', () => {
  // --- State ---
  const isLoading = ref(false)
  const theme = ref<'light' | 'dark'>('light')

  // --- Getters ---
  const isDark = computed(() => theme.value === 'dark')

  // --- Actions ---
  function setLoading(value: boolean) {
    isLoading.value = value
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { isLoading, theme, isDark, setLoading, toggleTheme }
})
