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

/**
 * The message to show for a failed request: the normalized `ApiError.message` (the backend's own
 * message, per `interceptors.ts`), else a native `Error`'s message, else the caller's fallback.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isApiError(error) && typeof error.message === 'string' && error.message.trim()) return error.message
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
