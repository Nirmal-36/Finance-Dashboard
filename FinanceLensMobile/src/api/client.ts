import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// For a physical Android device or emulator, "localhost" refers to the
// device itself, not your development machine. 10.0.2.2 is the Android
// emulator's special alias for the host machine's localhost. A physical
// device needs your machine's real LAN IP instead — see README.md for
// how to find and set that.
export const BASE_URL = 'http://10.222.228.203:8000/api/v1'

export const api = axios.create({ baseURL: BASE_URL })

const ACCESS_KEY = 'financelens_access'
const REFRESH_KEY = 'financelens_refresh'

// In-memory cache alongside AsyncStorage: AsyncStorage is async, but the
// axios request interceptor below needs the token synchronously-ish (it
// can await, but we want zero-latency reads on the hot path). This cache
// is hydrated once at startup (see store/authStore.ts) and kept in sync
// on every write.
let accessTokenCache: string | null = null
let refreshTokenCache: string | null = null

export function getAccessToken() {
  return accessTokenCache
}
export function getRefreshToken() {
  return refreshTokenCache
}

export async function setTokens(access: string, refresh: string) {
  accessTokenCache = access
  refreshTokenCache = refresh
  await AsyncStorage.setMany({ [ACCESS_KEY]: access, [REFRESH_KEY]: refresh })
}

export async function loadStoredTokens() {
  const stored = await AsyncStorage.getMany([ACCESS_KEY, REFRESH_KEY])
  const access = stored[ACCESS_KEY]
  const refresh = stored[REFRESH_KEY]
  accessTokenCache = access
  refreshTokenCache = refresh
  return { access, refresh }
}

export async function clearTokens() {
  accessTokenCache = null
  refreshTokenCache = null
  await AsyncStorage.removeMany([ACCESS_KEY, REFRESH_KEY])
}

api.interceptors.request.use((config) => {
  if (accessTokenCache) config.headers.Authorization = `Bearer ${accessTokenCache}`
  return config
})

// Queue concurrent requests while a single refresh is in flight, so a
// burst of 401s doesn't trigger N refresh calls — only the first one
// refreshes; the rest wait on it. Same pattern as the web client.
let refreshPromise: Promise<string> | null = null

async function performRefresh(): Promise<string> {
  const refresh_token = refreshTokenCache
  if (!refresh_token) throw new Error('No refresh token')

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token })
  await setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

// A callback the auth store registers so the interceptor can force a
// logout/navigation-to-login when refresh fails — set in authStore.ts
// to avoid a circular import (client -> store -> client).
let onAuthFailure: (() => void) | null = null
export function setOnAuthFailure(cb: () => void) {
  onAuthFailure = cb
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry && refreshTokenCache) {
      original._retry = true
      try {
        if (!refreshPromise) refreshPromise = performRefresh()
        const newAccess = await refreshPromise
        refreshPromise = null
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        refreshPromise = null
        await clearTokens()
        onAuthFailure?.()
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail
    if (detail) return detail
    if (err.message) return err.message
  }
  return 'Something went wrong. Please try again.'
}
