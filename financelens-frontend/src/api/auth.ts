import { api } from './client'
import type { TokenResponse, User } from '../types'

export const authApi = {
  signup: (data: { email: string; password: string; full_name: string }) =>
    api.post<TokenResponse>('/auth/signup', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
