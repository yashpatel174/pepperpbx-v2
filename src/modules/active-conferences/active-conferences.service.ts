import { request } from '../../services/api/apiClient'
import { isMockMode } from '../../services/auth/auth.mock'
import type { ActiveConferenceListParams, ActiveConferenceListResponse, ActiveConferenceListResult } from './active-conferences.types'

/**
 * Active Conferences is read-only: this service exposes one REST read, nothing that mutates.
 * Realtime (Socket.IO) updates are not wired yet.
 */

/**
 * GET /api/activeConferences/list?showAll= — the only REST call (active-conferences.md §12).
 * Search is client-side and never sent. No pagination params: the backend returns the full set.
 *
 * Mock mode has no backend to ask and deliberately returns NO records — live conferences only ever
 * come from a real backend, never from placeholder data.
 *
 * BACKEND CONTRACT REQUIRED — endpoint and `{ data, wildCardDomains }` body are from the Axion audit
 * only. Domain scoping with Show All off is left to the backend (Axion sends no domain param).
 */
export const fetchActiveConferences = ({ showAll }: ActiveConferenceListParams): Promise<ActiveConferenceListResult> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ data: [], wildCardDomains: [] }), 300)
    })
  }

  return request
    .get<ActiveConferenceListResponse>('/activeConferences/list', { params: { showAll } })
    .then((response) => ({ data: response.data ?? [], wildCardDomains: response.wildCardDomains ?? [] }))
}
