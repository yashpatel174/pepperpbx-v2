import type { ToggleSelectOptions } from '../../components/common/ToggleSelectInput'

/**
 * Lean list/table entity (time-conditions.md §5). `dialplan_name` (Time Group) and `name` (Preset)
 * are the server-joined display names Axion reads off each row; the camelCase destination keys are
 * the list payload's own names (§5/§26). Only the service builds these.
 */
export interface TimeCondition {
  time_condition_uuid: string
  domain_name: string
  time_condition_name: string
  time_condition_extension: string
  /** "Time Group" column. */
  dialplan_name: string
  /** "Preset" column — the bound Time Group preset's name. */
  name: string
  /** "Status" column pill. */
  time_condition_enabled: boolean
  /** "Destination if time does match". */
  timeMatchAction: string
  /** "Destination if time does not match". */
  timeNotMatchAction: string
  /** System-created rows: no Edit/Delete, not selectable (§5/§25/§26). */
  default: boolean
}

/** GET /api/timeCondition/list — query: pageSize, pageNumber, search, showAll (§3/§12). */
export interface TimeConditionListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface TimeConditionListResponse {
  data: TimeCondition[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
  /** Axion reads `wildCardDomains` from the list response to gate Show All (§3/§15). */
  wildCardDomains: string[]
}

/**
 * What the shared Add/Edit form collects and what create/update submit (§8). The Time Group field
 * submits as `time_condition_time_group_preset_uuid` — see TimeConditionDetailsRecord for the
 * detail payload's different key (§27).
 */
export interface TimeConditionFormValues {
  domain_name: string
  time_condition_name: string
  /** Free text, not `type="number"` — the value may carry Axion's `**` prefix (§10). */
  time_condition_extension: string
  time_condition_time_group_preset_uuid: string
  time_match_action: string
  time_not_match_action: string
  enabled: boolean
}

/** The normalized record the Edit page works with — form model plus server-owned fields. */
export interface TimeConditionDetails extends TimeConditionFormValues {
  time_condition_uuid: string
  default: boolean
}

/**
 * GET /api/timeCondition/details?time_condition_uuid= — `data.data` (§12/§13). Axion's detail payload
 * names the bound preset `time_condition_time_group_uuid`, while the form/create/update payload uses
 * `time_condition_time_group_preset_uuid` (§27/§33). The service maps between the two; nothing
 * outside it sees this key. BACKEND CONTRACT REQUIRED: keep the divergence until the backend
 * confirms either key is accepted.
 */
export interface TimeConditionDetailsRecord extends Omit<TimeConditionDetails, 'time_condition_time_group_preset_uuid'> {
  time_condition_time_group_uuid: string
}

/**
 * GET /api/timeCondition/timeGroup/dropdown?domain_name= — the time-condition-side Time Group preset
 * dropdown (§12/§30). The real option keys are unconfirmed (§28 POTENTIAL); `value` is what the form
 * stores as `time_condition_time_group_preset_uuid`.
 */
export interface TimeGroupOption {
  label: string
  value: string
}

/**
 * GET api/destinations/list/actions?domain_name= — the Destinations module's grouped action options,
 * used for both destination fields (§12/§30). Same shape `ToggleSelectInput` accepts.
 */
export type TimeConditionDestinationOption = ToggleSelectOptions[number]

/**
 * GET /api/hiveuser/details?module=TimeCondition&domain_name= — Add/Edit bootstrap (§3/§12). Field
 * names are Axion's. The extension range comes from here, never from Axion's static
 * `extensionConfig.timeCondition` table (§26/§33).
 */
export interface TimeConditionHiveDetails {
  defaultDomain: string
  domainOptions: string[]
  /** Suggested next extension for the domain (Add only — Axion never seeds it on Edit, §28). */
  autoExt: string
  /** Returned by Axion's bootstrap; the audit documents no use for it in this module's validation. */
  excludeExt: string[]
  /** Lower bound; Axion falls back to 100 when absent (§10). */
  additionalExtStart?: number
  /** Upper bound; Axion has no fallback here (§28) — PepperPBX skips the check when absent. */
  additionalExtEnd?: number
  additionalExtExclude: string[]
}
