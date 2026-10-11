import { create } from 'zustand'
import { authApi } from '../api/auth'
import { clearTokens, getRefreshToken, loadStoredTokens, setOnAuthFailure, setTokens } from '../api/client'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthed: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthed: false,

  login: async (email, password) => {
    const tokens = await authApi.login({ email, password })
    await setTokens(tokens.access_token, tokens.refresh_token)
    const user = await authApi.me()
    set({ user, isAuthed: true })
  },

  signup: async (email, password, full_name) => {
    const tokens = await authApi.signup({ email, password, full_name })
    await setTokens(tokens.access_token, tokens.refresh_token)
    const user = await authApi.me()
    set({ user, isAuthed: true })
  },

  logout: async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) await authApi.logout(refresh)
    } catch {
      // best-effort — clear local state regardless
    }
    await clearTokens()
    set({ user: null, isAuthed: false })
  },

  hydrate: async () => {
    const { access } = await loadStoredTokens()
    if (!access) {
      set({ isLoading: false })
      return
    }
    try {
      const user = await authApi.me()
      set({ user, isAuthed: true, isLoading: false })
    } catch {
      await clearTokens()
      set({ user: null, isAuthed: false, isLoading: false })
    }
  },
}))

// Registered once at module load: when the API client's response
// interceptor gives up on refreshing an expired/invalid token, force the
// store back to logged-out so navigation reacts (see client.ts for why
// this indirection exists instead of a direct import).
setOnAuthFailure(() => {
  useAuthStore.setState({ user: null, isAuthed: false })
})
