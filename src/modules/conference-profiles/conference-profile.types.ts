/** A flag as the backend may return it — the audit can't confirm boolean vs `'true'`/`'false'` (conference-profiles.md §27/§28). */
export type WireBoolean = boolean | 'true' | 'false'

/**
 * Lean list/table entity. Status is always a real boolean here — the service normalizes the
 * wire value, so the table never repeats Axion's `=== 'true'` comparison (§28).
 */
export interface ConferenceProfile {
  conference_profile_uuid: string
  profile_name: string
  profile_enabled: boolean
  profile_description?: string
}

/**
 * GET /api/conference/profile/list — query: pageSize, pageNumber, search only. There is no
 * `showAll` and no domain parameter for this module (conference-profiles.md §3/§7/§15).
 */
export interface ConferenceProfileListParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface ConferenceProfileListResponse {
  data: ConferenceProfile[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** One row of `conference_profile_params[]` (conference-profiles.md §8). Semantics are backend-defined (§1). */
export interface ConferenceProfileParam {
  profile_param_name: string
  profile_param_value: string
  profile_param_description?: string
  profile_param_enabled: boolean
}

/**
 * What the shared Add/Edit form collects. `conference_profile_params` is only rendered — and so
 * only submitted — in Edit mode (the two-step creation flow, §3/§26).
 */
export interface ConferenceProfileFormValues {
  profile_name: string
  profile_description?: string
  profile_enabled: boolean
  conference_profile_params?: ConferenceProfileParam[]
}

/** The normalized stored record — form model plus its uuid, with params always present. */
export interface ConferenceProfileDetails extends ConferenceProfileFormValues {
  conference_profile_uuid: string
  conference_profile_params: ConferenceProfileParam[]
}

/** A param row as the backend may return it. */
export interface ConferenceProfileParamRecord extends Omit<ConferenceProfileParam, 'profile_param_enabled'> {
  profile_param_enabled: WireBoolean
}

/** The record as the backend may return it — normalized by the service before anything else sees it. */
export interface ConferenceProfileRecord {
  conference_profile_uuid: string
  profile_name: string
  profile_description?: string
  profile_enabled: WireBoolean
  conference_profile_params?: ConferenceProfileParamRecord[]
}

/** GET /api/conference/profile/details/{uuid} — `{ data: {...record} }` (§12/§13). */
export interface ConferenceProfileDetailsResponse {
  data: ConferenceProfileRecord
}

/** POST /create and PATCH /update/{uuid} — `{ data: [{ conference_profile_uuid }] }` (§12/§13). */
export interface ConferenceProfileMutationResponse {
  data: { conference_profile_uuid: string }[]
}

/** PATCH /api/conference/profile/toggle body (§11/§12). */
export interface ConferenceProfileTogglePayload {
  conference_profile_uuids: string[]
}
