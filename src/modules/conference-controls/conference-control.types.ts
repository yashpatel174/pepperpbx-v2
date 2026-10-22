/** A flag as the backend may return it — the audit can't confirm boolean vs `'true'`/`'false'` (conference-controls.md §28). */
export type WireBoolean = boolean | 'true' | 'false'

/**
 * Lean list/table entity. Status is always a real boolean here — the service normalizes the
 * wire value, so the table never repeats Axion's `=== 'true'` comparison (§28).
 */
export interface ConferenceControl {
  conference_control_uuid: string
  control_name: string
  control_enabled: boolean
  control_description?: string
}

/**
 * GET /api/conference/control/list — query: pageSize, pageNumber, search only. There is no
 * `showAll` and no domain parameter for this module (conference-controls.md §6/§7/§15).
 */
export interface ConferenceControlListParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ConferenceControlListResponse {
  data: ConferenceControl[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** One DTMF mapping row of `conference_control_details` (conference-controls.md §8). */
export interface ConferenceControlDetail {
  /** 0–999 — multi-digit DTMF sequences are allowed (§26). */
  control_digits: number
  /** Free text; the backend owns which actions are valid (§26). */
  control_action: string
  control_data?: string
  control_detail_enabled: boolean
}

/**
 * What the shared Add/Edit form collects. `conference_control_details` is only rendered — and so
 * only submitted — in Edit mode (the two-step creation flow, §3/§26).
 */
export interface ConferenceControlFormValues {
  control_name: string
  control_description?: string
  control_enabled: boolean
  conference_control_details?: ConferenceControlDetail[]
}

/** The normalized stored record — form model plus its uuid, with details always present. */
export interface ConferenceControlDetails extends ConferenceControlFormValues {
  conference_control_uuid: string
  conference_control_details: ConferenceControlDetail[]
}

/** A detail row as the backend may return it (digits may arrive as a string). */
export interface ConferenceControlDetailRecord extends Omit<ConferenceControlDetail, 'control_digits' | 'control_detail_enabled'> {
  control_digits: number | string
  control_detail_enabled: WireBoolean
}

/** The record as the backend may return it — normalized by the service before anything else sees it. */
export interface ConferenceControlRecord {
  conference_control_uuid: string
  control_name: string
  control_description?: string
  control_enabled: WireBoolean
  conference_control_details?: ConferenceControlDetailRecord[]
}

/** GET /api/conference/control/details/{uuid} — `{ data: {...record} }` (§12/§13). */
export interface ConferenceControlDetailsResponse {
  data: ConferenceControlRecord
}

/** POST /create and PATCH /update/{uuid} — `{ data: [{ conference_control_uuid }] }` (§12/§13). */
export interface ConferenceControlMutationResponse {
  data: { conference_control_uuid: string }[]
}

/** PATCH /api/conference/control/toggle body (§11/§12). */
export interface ConferenceControlTogglePayload {
  conference_control_uuids: string[]
}
