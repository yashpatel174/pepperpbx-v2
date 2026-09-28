export interface SelectOption {
  label: string
  value: string
}

/**
 * The seven boolean columns that toggle inline from the list and from the bulk Toggle modal —
 * sent as `toggleKey` on PATCH /api/conference/room/toggle (conference-rooms.md §3/§5/§20).
 */
export type ConferenceRoomToggleKey = 'record' | 'announce_name' | 'announce_count' | 'announce_recording' | 'mute' | 'sounds' | 'enabled'

/** Every boolean the Add/Edit form carries: the seven toggle columns plus the two form-only flags. */
export type ConferenceRoomBooleanKey = ConferenceRoomToggleKey | 'wait_mod' | 'moderator_endconf'

export type ConferenceRoomFlags = Record<ConferenceRoomToggleKey, boolean>

/**
 * Lean list/table entity — the list columns only (conference-rooms.md §5). Flags are always real
 * booleans here; the audit notes Axion compares them as the string `'true'` (§27), so the wire
 * value is normalized inside the service, never in the table.
 */
export interface ConferenceRoom extends ConferenceRoomFlags {
  conference_room_uuid: string
  domain_name: string
  conference_room_name: string
  moderator_pin?: string
  participant_pin?: string
  description?: string
}

/** GET /api/conference/room/list — query: pageSize, pageNumber, search, showAll (conference-rooms.md §11/§12). */
export interface ConferenceRoomListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

/**
 * The list body after apiClient unwraps it. Axion's response also carries `privileges` and
 * `wildCardDomains` (§12) — not mapped here because PepperPBX has no permission/wildcard-domain
 * contract yet (see useConferenceRoomPermissions.ts).
 */
export interface ConferenceRoomListResponse {
  data: ConferenceRoom[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** GET /api/conference/room/list/conferenceCenterNames?domain_name= — value is the center's uuid. */
export type ConferenceCenterOption = SelectOption

/** GET /api/conferences/profileOptions?domain_name= — shared with the Conferences module (§12/§30). */
export type ConferenceProfileOption = SelectOption

/**
 * GET /api/hiveuser/details?module=ConferenceCenter&domain_name=... — Add/Edit bootstrap
 * (conference-rooms.md §3/§12). PepperPBX's typed mapping of Axion's `domainOptions`/
 * `defaultDomain`/`autoExt`/`additionalExtStart`/`additionalExtEnd`/`additionalExtExclude`/
 * `accountNumber`. Rooms have no extension field (§26), so only the domain and account-code parts
 * are consumed by the form; the extension-range parts are still typed because the endpoint returns
 * them. The real response shape is NOT confirmed.
 */
export interface HiveUserDetails {
  defaultDomain: string
  domainOptions: string[]
  autoExtension: string
  extensionRangeStart: number
  extensionRangeEnd: number
  extensionExclude: string[]
  accountCode: string
}

/** What the shared Add/Edit form collects — exactly the documented fields (conference-rooms.md §8). */
export interface ConferenceRoomFormValues extends ConferenceRoomFlags {
  /** The parent Conference Center. Optional, as in Axion (§10/§28). Locked on Edit. */
  conference_center_uuid?: string
  conference_room_name: string
  moderator_pin?: string
  participant_pin?: string
  profile?: string
  /** 0–999; sent as a number. */
  max_members: number
  /** `YYYY-MM-DD HH:mm` strings (§27). */
  start_datetime?: string
  stop_datetime?: string
  /** Editable on Add, locked on Edit (§15). */
  domain_name: string
  wait_mod: boolean
  moderator_endconf: boolean
  /** Always read-only — hive-derived. */
  account_code?: string
  description?: string
}

/** The normalized stored record — form model plus its uuid. */
export interface ConferenceRoomDetails extends ConferenceRoomFormValues {
  conference_room_uuid: string
}

/** Booleans may arrive as `'true'`/`'false'` strings (§27); `max_members` is `Number()`-coerced on submit, so it may too. */
export type WireBoolean = boolean | 'true' | 'false'

/** The record as the backend may return it. Normalized by the service before anything else sees it. */
export type ConferenceRoomRecord = Omit<ConferenceRoomDetails, ConferenceRoomBooleanKey | 'max_members'> &
  Record<ConferenceRoomBooleanKey, WireBoolean> & {
    max_members: number | string
  }

/** GET /api/conference/room/details/{uuid} — `{ data: {...record} }` (§13). */
export interface ConferenceRoomDetailsResponse {
  data: ConferenceRoomRecord
}

/** POST /create and PATCH /update/{uuid} — `{ data: [{ conference_room_uuid }] }` (§12/§13). */
export interface ConferenceRoomMutationResponse {
  data: { conference_room_uuid: string }[]
}

/** DELETE /api/conference/room/delete body (§11/§12). */
export interface ConferenceRoomDeletePayload {
  conference_room_uuids: string[]
}

/** PATCH /api/conference/room/toggle body — the generic toggle (§12/§26). */
export interface ConferenceRoomTogglePayload {
  toggleArray: string[]
  toggleKey: ConferenceRoomToggleKey
}
