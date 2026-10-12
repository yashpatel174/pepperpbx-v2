import { request } from '../../services/api/apiClient'
import { isMockMode } from '../../services/auth/auth.mock'
import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import { MOCK_WILDCARD_DOMAINS, mockRegistrations } from './registrations.mock'
import type { Registration, RegistrationListParams, RegistrationListResponse, RegistrationListResult } from './registrations.types'

/**
 * Registrations is read-only: this service exposes one REST read, nothing that mutates. Axion's
 * Unregister / Reboot / Provision endpoints are unreachable from its UI (registrations.md §3/§11/§28),
 * so no such calls exist here. Realtime (Socket.IO) INSERT/DELETE updates are deliberately NOT
 * wired — a later phase, once the socket contract is confirmed.
 */

const matchesSearch = (registration: Registration, needle: string): boolean =>
  [
    registration.username,
    registration.domain,
    registration.userAgent,
    registration.contact,
    registration.lanIP,
    registration.ip,
    registration.port,
    registration.status,
    registration.expires,
  ].some((value) => value.toLowerCase().includes(needle))

/** Mock stand-in for the server: scope by domain, search, then paginate. Search semantics are unconfirmed (§28), so a case-insensitive substring over every column is assumed. */
const listMockRegistrations = ({ pageSize, pageNumber, search, showAll }: RegistrationListParams): RegistrationListResult => {
  const needle = search.trim().toLowerCase()
  const scoped = showAll ? mockRegistrations : mockRegistrations.filter((item) => item.domain === MOCK_DEFAULT_DOMAIN)
  const matched = needle ? scoped.filter((item) => matchesSearch(item, needle)) : scoped
  const start = (pageNumber - 1) * pageSize
  return {
    data: matched.slice(start, start + pageSize),
    totalRecords: matched.length,
    wildCardDomains: [...MOCK_WILDCARD_DOMAINS],
  }
}

/**
 * GET /api/activeRegistration/list?pageSize=&pageNumber=&search=&showAll= (registrations.md §12) —
 * server-paginated and server-searched. Axios encodes `search` itself, so no manual
 * encodeURIComponent.
 *
 * Mock mode returns static SAMPLE records (never real registrations). With Show All off only the
 * stand-in default domain is returned, mirroring Axion's domain-scoped default (§15).
 *
 * BACKEND CONTRACT REQUIRED — endpoint and `{ data, total_records, wildCardDomains }` body are from
 * the Axion audit only. Axion's `total_pages` is not read: the page count is derived from
 * `total_records` and the page size, so there is a single source of truth for paging.
 */
export const fetchRegistrations = (params: RegistrationListParams): Promise<RegistrationListResult> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(listMockRegistrations(params)), 300)
    })
  }

  return request.get<RegistrationListResponse>('/activeRegistration/list', { params }).then((response) => {
    const data = response.data ?? []
    // Axion skips a legitimate 0 here (§28); nullish-aware so a real zero is honoured.
    const totalRecords = Number(response.total_records ?? data.length)
    return {
      data,
      totalRecords: Number.isFinite(totalRecords) ? totalRecords : data.length,
      wildCardDomains: response.wildCardDomains ?? [],
    }
  })
}
