import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({ baseURL: BASE_URL })

const ACCESS_KEY = 'financelens_access'
const REFRESH_KEY = 'financelens_refresh'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Queue concurrent requests while a single refresh is in flight, so a burst
// of 401s (e.g. several widgets loading at once) doesn't trigger N refresh
// calls — only the first one refreshes; the rest wait on it.
let refreshPromise: Promise<string> | null = null

async function performRefresh(): Promise<string> {
  const refresh_token = getRefreshToken()
  if (!refresh_token) throw new Error('No refresh token')

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token })
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry && getRefreshToken()) {
      original._retry = true
      try {
        if (!refreshPromise) refreshPromise = performRefresh()
        const newAccess = await refreshPromise
        refreshPromise = null
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        refreshPromise = null
        clearTokens()
        window.location.href = '/login'
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
