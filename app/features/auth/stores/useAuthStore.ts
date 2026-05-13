import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRepo } from 'pinia-orm'
import { User } from '../models/User'
import type { AuthSession, LoginCredentials } from '../types/auth.types'

/**
 * Auth store.
 * Manages session state (token). User entity data lives in Pinia ORM (useRepo(User)).
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    // --- State ---
    const session = ref<AuthSession | null>(null)

    // --- Getters ---
    const isAuthenticated = computed(() => !!session.value?.token)

    const currentUser = computed(() => {
      // Reads the first user from Pinia ORM repository
      return useRepo(User).all()[0] ?? null
    })

    // --- Actions ---
    async function login(credentials: LoginCredentials) {
      // TODO: replace with real API call
      // const { fetchData } = useApi()
      // const res = await fetchData<AuthSession>('/api/auth/login', { method: 'POST', body: credentials })
      console.log('Logging in with', credentials)

      // Mock: store session and save user to ORM repo
      session.value = {
        token: 'mock-token-abc123',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      }

      useRepo(User).save({
        id: 1,
        name: 'Demo User',
        email: credentials.email,
        isAdmin: false,
        avatarUrl: '',
      })
    }

    function logout() {
      session.value = null
      useRepo(User).flush()
    }

    return { session, isAuthenticated, currentUser, login, logout }
  },
  {
    // Persist session across page reloads via localStorage
    persist: true,
  },
)
