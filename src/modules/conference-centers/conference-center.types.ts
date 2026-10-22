export interface SelectOption {
  label: string
  value: string
}

/**
 * Lean list/table entity — deliberately NOT the full Add/Edit shape (see
 * ConferenceCenterFormValues/ConferenceCenterDetails below), matching the entity-vs-form-values
 * separation used by every sibling module. Status is always a real boolean here — any string/boolean
 * ambiguity in the backend's `conference_center_enabled` is normalized inside the service
 * (conference-center.service.ts's `normalizeEnabled`), never in the table.
 */
export interface ConferenceCenter {
  id: string
  domain: string
  name: string
  extension: string
  greeting?: string
  pinLength: number
  enabled: boolean
  description?: string
}

/** GET /api/conference/center/list — query: pageSize, pageNumber, search, showAll (conference-centers.md §11/§12). */
export interface ConferenceCenterListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface ConferenceCenterListResponse {
  data: ConferenceCenter[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/**
 * GET /api/conference/center/listGreetings?domain_name=... — domain-scoped greeting sounds
 * (conference-centers.md §8/§9/§12). The audit notes the response is a flat `data` array.
 */
export type GreetingOption = SelectOption

/**
 * GET /api/hiveuser/details?module=Conference&domain_name=... — Add/Edit bootstrap
 * (conference-centers.md §3/§9/§12). Field names below are PepperPBX's typed mapping of Axion's
 * `domainOptions`/`defaultDomain`/`autoExt`/`additionalExtStart`/`additionalExtEnd`/
 * `additionalExtExclude`/`accountNumber` — the real response shape is NOT confirmed, so the
 * mapping lives in one place (the service) and only this typed result reaches the UI.
 */
export interface HiveUserConferenceDetails {
  defaultDomain: string
  domainOptions: string[]
  autoExtension: string
  extensionRangeStart: number
  extensionRangeEnd: number
  extensionExclude: string[]
  accountCode: string
}

/**
 * What the Add/Edit form collects — one shared shape for both modes. Only the eight documented
 * Conference Center fields (conference-centers.md §8/§26); none of the Conferences-only fields
 * (PIN number/profile/flags/email/order).
 */
export interface ConferenceCenterFormValues {
  conference_center_name: string
  /** Free text (never `type="number"`) — must accept the optional `**` prefix. */
  conference_center_extension: string
  conference_center_greeting?: string
  /** Allowed PIN digit count (3–100), not a PIN value. */
  conference_center_pin_length: number
  /** Always read-only — server/hive-derived. */
  conference_center_account_code?: string
  /** Editable on Add, locked on Edit (conference-centers.md §15/§26). */
  domain_name: string
  conference_center_description?: string
  conference_center_enabled: boolean
}

/** The normalized stored record — form model plus its uuid. */
export interface ConferenceCenterDetails extends ConferenceCenterFormValues {
  conference_center_uuid: string
}

/**
 * The record as the backend may return it. The audit flags that Axion compares
 * `conference_center_enabled === 'true'` (conference-centers.md §27/§28) while its form sends a
 * boolean, so the wire type is unknown; `conference_center_pin_length` is coerced with `Number()`
 * on submit, so it may also come back as a string. Both are accepted here and normalized by the
 * service before anything else sees them.
 */
export interface ConferenceCenterRecord extends Omit<ConferenceCenterDetails, 'conference_center_enabled' | 'conference_center_pin_length'> {
  conference_center_enabled: boolean | 'true' | 'false'
  conference_center_pin_length: number | string
}

/** GET /api/conference/center/details/{uuid} — `{ data: {...record} }` (conference-centers.md §13). */
export interface ConferenceCenterDetailsResponse {
  data: ConferenceCenterRecord
}

/** DELETE /delete and PATCH /toggle body (conference-centers.md §11/§12). */
export interface ConferenceCenterActionPayload {
  conference_center_uuids: string[]
}
