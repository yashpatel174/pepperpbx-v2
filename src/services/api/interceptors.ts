import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import useAuthStore from '../../store/auth'
import { refresh as refreshTokens } from '../auth/auth.service'
import router from '../../router'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Coalesces concurrent 401s into a single refresh call instead of firing one refresh per request.
let refreshPromise: Promise<string | null> | null = null

const getNewAccessToken = async (): Promise<string | null> => {
  const { refreshToken } = useAuthStore.getState()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = refreshTokens(refreshToken)
      .then(tokens => {
        useAuthStore.getState().setTokens(tokens)
        return tokens.accessToken
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const attachInterceptors = (api: AxiosInstance) => {
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { accessToken } = useAuthStore.getState()
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined

      // One retry after a successful refresh; avoids retry loops if the new token also 401s.
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        useAuthStore.getState().refreshToken
      ) {
        originalRequest._retry = true
        const newAccessToken = await getNewAccessToken()
        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers ?? {}
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        }
      }

      if (error.response?.status === 401) {
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/auth/login') {
          router.navigate('/auth/login?sessionExpired=1')
        }
      }

      if (error.response) {
        const { status, data } = error.response as { status: number; data?: { message?: string } }
        return Promise.reject({
          status,
          message: data?.message || error.message || 'Request failed',
          data,
        })
      }

      return Promise.reject({
        status: 0,
        message: error.message || 'Network error, please check your network connection',
      })
    },
  )
}
