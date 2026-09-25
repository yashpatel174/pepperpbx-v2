export type DestinationType = 'inbound' | 'outbound' | 'local'

export interface Destination {
  id: string
  domain: string
  type: DestinationType
  /** Country code — destination_prefix. */
  prefix?: string
  /** destination_number. */
  destination: string
  /**
   * Raw "Destination Actions" list-column string, sourced separately from the form's own
   * destination_action field — per the Axion audit (§27), the backend's list record carries
   * this as its own field, distinct from what the Add/Edit form writes.
   */
  destinationActions?: string
  context?: string
  description?: string
  enabled: boolean
}

export interface DestinationListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
  destinationType?: DestinationType
}

export interface DestinationListResponse {
  data: Destination[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** GET /api/hiveuser/details?module=Destination&domain_name=... — Add/Edit bootstrap. */
export interface HiveDestinationDetails {
  defaultDomain: string
  domainOptions: string[]
  accountNumber: string
  /** Suggested next destination number for the current domain — used to prefill Copy. */
  autoDestinationNumber: string
}

export interface SelectOption {
  label: string
  value: string
}

export interface HoldMusicOption {
  id?: string
  label: string
  value: string
}

/** One group ("Music on Hold" / "Recordings" / "Streams") within the Hold Music select. */
export interface HoldMusicGroup {
  label: string
  options: HoldMusicOption[]
}

/**
 * One category group ("Announcements" / "Call Center" / "Extensions" / ...) within the Actions
 * select — Alternate Actions reuses the exact same fetched groups, bound to its own form field.
 * Same grouped shape as HoldMusicGroup, but built from plain SelectOption entries (no id).
 */
export interface ActionOptionGroup {
  label: string
  options: SelectOption[]
}

/**
 * Raw response body of GET /api/destinations/list/actions. `data` is the ActionOptionGroup[]
 * array itself, mirroring HoldMusicResponse's shape.
 */
export interface ActionOptionsResponse {
  status: number
  success: boolean
  notification: string[]
  data: ActionOptionGroup[]
  privileges?: Record<string, boolean>
  wildCardDomains?: string[]
}

/**
 * Raw response body of GET /api/destinations/list/holdMusic. Unlike DestinationFieldsResponse,
 * `data` here is the HoldMusicGroup[] array itself, not a further-nested wrapper.
 */
export interface HoldMusicResponse {
  status: number
  success: boolean
  notification: string[]
  data: HoldMusicGroup[]
  privileges?: Record<string, boolean>
  wildCardDomains?: string[]
}

/**
 * What the Add/Edit form actually collects. `destination_order` stays numeric (Axion's exact
 * option list isn't confirmed by the audit, so this is a bounded number input, not a Select —
 * see destination.constants.ts). All other numeric-looking fields stay strings, validated by
 * regex, and are only ever displayed/stored as strings — the audit's Number() coercion is a
 * form→list display detail, not a type change (see destination.service.ts's toDetails).
 */
export interface DestinationFormValues {
  destination_type: DestinationType
  destination_prefix?: string
  destination_trunk_prefix?: string
  destination_area_code?: string
  destination_number: string
  destination_cid_name_prefix?: string
  destination_caller_id_name?: string
  destination_caller_id_number?: string
  destination_context: string
  destination_distinctive_ring?: string
  /** Hidden when destination_type === 'outbound', but its value is kept and submitted — see DestinationForm. */
  destination_action?: string
  destination_alternate_action?: string
  /** Only rendered when destination_type === 'inbound' — see DestinationForm. */
  fax_uuid?: string
  destination_hold_music?: string
  /** Always read-only/disabled — server-derived. */
  destination_accountcode: string
  /** Editable on Add, disabled on Edit. */
  domain_name: string
  destination_order: number
  destination_description?: string
  // Usage
  destination_type_voice: boolean
  destination_type_fax: boolean
  destination_type_text: boolean
  destination_type_emergency: boolean
  // Options
  destination_record: boolean
  sms_enabled: boolean
  destination_enabled: boolean
}

/** The stored/API record shape — the create/update form model as returned by the server. */
export interface DestinationDetails extends DestinationFormValues {
  destination_uuid: string
  /**
   * Raw "Destination Actions" list-column string as the backend's list record carries it
   * (e.g. "busy-au-tone (Tones)", "phrase:<uuid>") — distinct from `destination_action`, the
   * form's own select value (see destinations.md §27). Falls back to `destination_action` in
   * destination.service.ts's toListDestination for records that never set this separately
   * (e.g. ones created locally via the Add form).
   */
  destinationActionDisplay?: string
}

export interface ExportFieldOption {
  key: string
  label: string
}

/**
 * Raw response body of GET /api/destinations/fields. apiClient's response interceptor only
 * unwraps Axios's own `response.data` (see services/api/interceptors.ts) — it does not dig into
 * the backend's own `data` envelope — so callers of `request.get` see this full shape and must
 * read `.data.fields` themselves.
 */
export interface DestinationFieldsResponse {
  status: number
  success: boolean
  notification: string[]
  data: {
    fields: ExportFieldOption[]
  }
}

export type ImportDelimiter = ',' | '|' | '\t'
export type ImportEnclosure = '"' | ' '

export interface ImportDestinationOptions {
  fromRow: number
  delimiter: ImportDelimiter
  enclosure: ImportEnclosure
}

/**
 * Result of the Import step — correlates to the Import-match step via `csvId`, mirroring the
 * Axion reference's CSV_id-keyed two-step contract (see destinations.md §33). `matchedFields`
 * are DB fields the parser could confidently line up against a CSV column; `unmatchedDbFields`
 * are the remaining known DB fields the user must manually map from `csvColumns`.
 */
export interface ImportDestinationResult {
  csvId: string
  csvColumns: string[]
  matchedFields: Record<string, string>
  unmatchedDbFields: string[]
  rowCount: number
}

export interface ImportMatchResult {
  imported: number
  skipped: number
}
