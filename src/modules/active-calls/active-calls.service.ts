import { request } from '../../services/api/apiClient'
import { isMockMode } from '../../services/auth/auth.mock'
import { MOCK_DEFAULT_DOMAIN } from './active-calls.constants'
import { MOCK_WILDCARD_DOMAINS, mockActiveCalls } from './active-calls.mock'
import type { ActiveCallListParams, ActiveCallListResponse, ActiveCallListResult } from './active-calls.types'

/**
 * Active Calls is read-only: this service exposes one REST read, nothing that mutates. The audit's
 * Hangup action is disabled in Axion (active-calls.md §3/§11), so no hangup call exists here.
 * Realtime (Socket.IO) updates are deliberately NOT wired — a later phase.
 */

/**
 * GET /api/activeCalls/list?showAll= — the only REST call (active-calls.md §12). Search is
 * client-side and never sent.
 *
 * Mock mode returns static SAMPLE records (never real calls). With Show All off only the stand-in
 * default domain is returned, mirroring Axion's domain-scoped default (§15).
 *
 * BACKEND CONTRACT REQUIRED — endpoint and `{ data, wildCardDomains }` body are from the Axion
 * audit only.
 */
export const fetchActiveCalls = ({ showAll }: ActiveCallListParams): Promise<ActiveCallListResult> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = showAll ? mockActiveCalls : mockActiveCalls.filter((call) => call.domain === MOCK_DEFAULT_DOMAIN)
        resolve({ data: [...data], wildCardDomains: [...MOCK_WILDCARD_DOMAINS] })
      }, 300)
    })
  }

  return request
    .get<ActiveCallListResponse>('/activeCalls/list', { params: { showAll } })
    .then((response) => ({ data: response.data ?? [], wildCardDomains: response.wildCardDomains ?? [] }))
}
