/**
 * BACKEND CONTRACT REQUIRED. Every shape below comes from the Axion functional audit only
 * (active-conferences.md §5/§13/§23) — i.e. the fields Axion actually renders or reads — not
 * from a confirmed PepperPBX backend contract. Don't add fields here speculatively.
 */

/** Per-member flags. Only `has_floor` is read by the UI (Has Floor column). */
export interface ActiveConferenceMemberFlags {
  has_floor?: boolean
}

/**
 * One participant of an active conference.
 *
 * `join_time` / `last_talking` are ASSUMED to be elapsed SECONDS — Axion formats them as HH:MM:SS
 * via /3600 and /60 math, but the backend unit is unconfirmed (active-conferences.md §5/§28).
 *
 * No hand-raised field is typed here on purpose: Axion's "Hand Raised" column is a hardcoded
 * `'false'` that never reads data (§5/§26), so there is no documented field name to rely on.
 */
export interface ActiveConferenceMember {
  caller_id_name: string
  caller_id_number: string
  join_time: number
  last_talking: number
  flags?: ActiveConferenceMemberFlags
}

/** One active conference room, as delivered by the REST list. */
export interface ActiveConference {
  conference_name: string
  participant_pin?: string
  member_count: number
  domain: string
  members: ActiveConferenceMember[]
}

/** Query for GET /api/activeConferences/list — `showAll` is the only param Axion sends (§12). */
export interface ActiveConferenceListParams {
  showAll: boolean
}

/**
 * Body of GET /api/activeConferences/list after apiClient unwraps the Axios response. Axion also
 * reads a `privileges` object here; it's deliberately not typed/used because PepperPBX's RBAC is
 * populated elsewhere (store/permissions.ts), not per-module response.
 */
export interface ActiveConferenceListResponse {
  data: ActiveConference[]
  wildCardDomains?: string[]
}

export interface ActiveConferenceListResult {
  data: ActiveConference[]
  wildCardDomains: string[]
}

/** Router state handed from the list's View action to the detail route. */
export interface ActiveConferenceDetailState {
  conference: ActiveConference
}

/** Detail-table row: a member plus a render-only row key (members carry no documented stable id). */
export interface ActiveConferenceMemberRow extends ActiveConferenceMember {
  key: string
}
