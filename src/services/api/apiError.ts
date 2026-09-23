/**
 * The shape `interceptors.ts` rejects every failed `apiClient` request with (`status` is 0 for a
 * network failure). Mock services that emulate an HTTP error should reject with this same shape,
 * so pages branch on `status` rather than on message text.
 */
export interface ApiError {
  status: number
  message: string
  data?: unknown
}

const isApiError =(error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'

export const isNotFoundError = (error: unknown): boolean => isApiError(error) && error.status === 404
