/**
 * BACKEND CONTRACT REQUIRED. Every field below comes from the Axion functional audit only
 * (registrations.md §5/§23/§28 — inferred from the table's `accessorKey` values), not from a
 * confirmed PepperPBX backend contract. The audit lists no allowed `status` values and no format
 * for `expires`, so both are plain strings rendered as received. Don't add fields speculatively.
 */

/** One registered SIP endpoint as listed by Axion's Registrations table. `id` is the identity Axion merges on (§23). */
export interface Registration {
  id: string
  username: string
  domain: string
  /** SIP User-Agent string ("Agent" column). */
  userAgent: string
  /** SIP contact URI. */
  contact: string
  lanIP: string
  /** Public/write IP. */
  ip: string
  port: string
  status: string
  expires: string
}

/** Query for GET /api/activeRegistration/list — camelCase on the wire (§12). */
export interface RegistrationListParams {
  pageSize: number
  pageNumber: number
  search: string
  showAll: boolean
}

/** Body of the list response after apiClient unwraps the Axios response. `privileges` is deliberately not typed (RBAC lives in store/permissions.ts). */
export interface RegistrationListResponse {
  data?: Registration[]
  total_records?: number | string
  wildCardDomains?: string[]
}

export interface RegistrationListResult {
  data: Registration[]
  totalRecords: number
  wildCardDomains: string[]
}
