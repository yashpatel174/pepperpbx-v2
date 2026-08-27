export interface AuthUser {
  id: string | number
  username: string
  email: string
  avatar?: string
  [key: string]: unknown
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResult {
  user: AuthUser
  tokens: AuthTokens
}
