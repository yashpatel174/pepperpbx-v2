// Dev-only mock auth. Isolated here deliberately so it never leaks into
// the real auth.service.ts logic — see isMockMode() for how it's gated.
import type { LoginResult } from './auth.types'

const sleep = (delay = 500) => new Promise(resolve => setTimeout(resolve, delay))

export const MOCK_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  },
  user: {
    username: 'user',
    password: 'user123',
    user: {
      id: 2,
      username: 'user',
      email: 'user@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    },
  },
  demo: {
    username: 'demo',
    password: 'demo123',
    user: {
      id: 3,
      username: 'demo',
      email: 'demo@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
  },
}

export const mockLogin = async (username: string, password: string): Promise<LoginResult> => {
  await sleep()

  const entry = Object.values(MOCK_USERS).find(
    candidate => candidate.username === username && candidate.password === password,
  )

  if (!entry) {
    throw new Error('Invalid username or password')
  }

  const stamp = Date.now()
  return {
    user: entry.user,
    tokens: {
      accessToken: `mock_access_${entry.user.id}_${stamp}`,
      refreshToken: `mock_refresh_${entry.user.id}_${stamp}`,
    },
  }
}

export const mockRefresh = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  await sleep(150)
  return { accessToken: `mock_access_${Date.now()}`, refreshToken }
}

/**
 * Whether the app should use the built-in dev/demo auth instead of the real backend.
 * Reads VITE_USE_MOCK; defaults to mock ON when the var is unset so local dev keeps working
 * without extra setup. Set VITE_USE_MOCK=false to hit the real backend.
 */
export const isMockMode = (): boolean => {
  const flag = import.meta.env.VITE_USE_MOCK
  if (flag === undefined) return true
  return flag === 'true'
}
