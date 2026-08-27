import axios from 'axios'
import { isMockMode, mockLogin, mockRefresh } from './auth.mock'
import type { AuthTokens, LoginCredentials, LoginResult } from './auth.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// login/refresh/logout intentionally bypass the shared apiClient instance (services/api):
// apiClient's response interceptor calls refresh() on a 401, so routing refresh's own
// HTTP call through that same interceptor chain would create a cycle.
const authHttp = axios.create({ baseURL: API_BASE_URL, timeout: 10000 })

// NOTE: the exact backend response shape (access+refresh token fields, JWE envelope) has not
// been confirmed yet. The mappings below are a best-guess placeholder — verify against the
// real /auth/login and /auth/refresh contracts before removing isMockMode() as the default path.

export const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
  if (isMockMode()) {
    return mockLogin(credentials.username, credentials.password)
  }
  const { data } = await authHttp.post('/auth/login', credentials)
  return {
    user: data.user,
    tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken },
  }
}

export const refresh = async (refreshToken: string): Promise<AuthTokens> => {
  if (isMockMode()) {
    return mockRefresh(refreshToken)
  }
  const { data } = await authHttp.post('/auth/refresh', { refreshToken })
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export const logout = async (): Promise<void> => {
  if (isMockMode()) return
  try {
    await authHttp.post('/auth/logout')
  } catch {
    // best-effort — the caller clears local auth state regardless
  }
}
