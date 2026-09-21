export interface SelectOption {
  label: string
  value: string
}

export type CallBlockDirection = 'inbound' | 'outbound'

export interface CallBlock {
  call_block_uuid: string
  domain_name: string
  call_block_direction: CallBlockDirection
  extension?: string
  call_block_name?: string
  call_block_country_code?: string
  call_block_number?: string
  call_block_count: number
  call_block_action: string
  call_block_enabled: boolean
  /** ISO date string — formatted at render time (native `Intl`, no new date-library dependency). */
  date_added: string
  call_block_description?: string
}

export interface CallBlockListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface CallBlockListResponse {
  data: CallBlock[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** GET /api/hiveuser/details?module=CallBlock&domain_name=... — Add/Edit bootstrap (call-block.md §3/§12). */
export interface HiveCallBlockDetails {
  defaultDomain: string
  domainOptions: string[]
}

/**
 * What the Add/Edit form actually collects — ONE shared shape for both modes. `call_block_name`
 * and `call_block_number` are mutually required-if-other-empty (call-block.md §8/§9/§10/§26) —
 * both stay optional at the type level; the cross-field requirement is enforced by validation
 * rules (see call-block.validation.ts), not the type.
 */
export interface CallBlockFormValues {
  call_block_direction: CallBlockDirection
  extension_uuid?: string
  call_block_name?: string
  call_block_action: string
  call_block_country_code?: string
  call_block_number?: string
  domain_name: string
  call_block_enabled: boolean
  call_block_description?: string
}

/** The stored/API record shape — the create/update form model as returned by the server. */
export interface CallBlockDetails extends CallBlockFormValues {
  call_block_uuid: string
  call_block_count: number
  date_added: string
}

/**
 * Edit-only "Recent Calls" sub-table (call-block.md §3/§5/§21/§33) — recent call-log entries
 * matching this block's domain + name/number, so the admin can bulk-block calls straight from
 * history. Distinct dataset from the Call Block list itself.
 */
export interface RecentCall {
  id: string
  direction: CallBlockDirection
  callerIdName?: string
  callerIdNumber?: string
  destination?: string
  /** Epoch seconds — formatted at render time. */
  startEpoch: number
  /** Seconds. */
  duration: number
}

export interface RecentCallListQuery {
  page?: number
  pageSize?: number
  domainName: string
  name?: string
  number?: string
}

export interface RecentCallListResponse {
  data: RecentCall[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

export interface BlockRecentCallsPayload {
  direction: CallBlockDirection
  extensionUuid: string
  action: string
  uuids: string[]
}
