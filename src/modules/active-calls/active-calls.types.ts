/**
 * BACKEND CONTRACT REQUIRED. Every field below comes from the Axion functional audit only
 * (active-calls.md §5/§23/§28 — inferred from the table's `accessorKey` values), not from a
 * confirmed PepperPBX backend contract. The real payload may carry more fields. Don't add fields
 * here speculatively.
 */

/** One live call as listed by Axion's Active Calls table. `uuid` is the identity Axion merges on (§23). */
export interface ActiveCall {
  uuid: string
  callState: string
  direction: string
  /** ISO-like timestamp; Axion renders an empty cell when falsy (§5). */
  created?: string
  cid_name: string
  cid_num: string
  destination: string
  /** SBC IP column. */
  ip_addr: string
  domain: string
  /** "Freeswitch IP" column. */
  hostname: string
}

/** Query for GET /api/activeCalls/list — `showAll` is the only param Axion sends (§12). */
export interface ActiveCallListParams {
  showAll: boolean
}

/** Body of the list response after apiClient unwraps the Axios response. `privileges` is deliberately not typed (RBAC lives in store/permissions.ts). */
export interface ActiveCallListResponse {
  data: ActiveCall[]
  wildCardDomains?: string[]
}

export interface ActiveCallListResult {
  data: ActiveCall[]
  wildCardDomains: string[]
}
