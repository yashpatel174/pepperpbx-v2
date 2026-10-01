import type { ToggleSelectOptions } from '../../components/common/ToggleSelectInput'

/**
 * A flag as the backend may send it. Axion compares `ring_group_enabled` and
 * `ring_group_forward_enabled` against the string `'true'` (ring-groups.md §26/§27/§28) — the real
 * wire type is unconfirmed. Only the service ever sees this type; everything else uses booleans.
 */
export type WireBoolean = boolean | 'true' | 'false'

/** `strategyOptions` (ring-groups.md §8). */
export type RingGroupStrategy = 'simultaneous' | 'sequence' | 'enterprise' | 'rollover' | 'random'

/** `ringGroupForwardCidModeOptions` — "Change External CID Configuration" (ring-groups.md §8/§34.3). */
export type RingGroupForwardCidMode = 'default' | 'dialed' | 'fixed'

/** Lean list/table entity (ring-groups.md §5). Flags are real booleans. */
export interface RingGroup {
  ring_group_uuid: string
  domain_name: string
  ring_group_name: string
  ring_group_extension: string
  ring_group_strategy: RingGroupStrategy
  ring_group_forward_enabled: boolean
  ring_group_forward_destination?: string
  ring_group_enabled: boolean
  ring_group_description?: string
}

/** GET /api/ringGroups/list — query: pageSize, pageNumber, showAll, search (ring-groups.md §12). */
export interface RingGroupListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

/**
 * Axion's list response (ring-groups.md §12/§13): `{ data: { data, total_pages, total_records },
 * privileges, wildCardDomains }`. There is no page field — the requested page is the caller's own
 * state. `privileges` isn't read yet (RBAC is foundation-only), so it isn't modelled.
 */
export interface RingGroupListResponse {
  data: {
    data: RingGroup[]
    total_pages: number
    total_records: number
  }
  /** Axion reads `wildCardDomains` from the list response to gate Show All (§3/§15). */
  wildCardDomains: string[]
}

/** One row of the Destinations table (`ring_group_destinations`, ring-groups.md §8). */
export interface RingGroupDestination {
  destination_number: string
  /** "Delay" or "Order", depending on the strategy (§9) — same field either way. */
  destination_delay: number
  destination_timeout: number
  destination_prompt: number
}

/**
 * What the shared Add/Edit form collects (ring-groups.md §8). `ring_group_context` is the Domain
 * field — Axion names it that way; PepperPBX keeps the name so the payload matches.
 */
export interface RingGroupFormValues {
  ring_group_context: string
  ring_group_name: string
  /** Free text, not `type="number"` — the value may carry Axion's `**` prefix. */
  ring_group_extension: string
  ring_group_greeting?: string
  ring_group_strategy: RingGroupStrategy
  /** Text in the form; coerced to a number on submit (§3/§27). */
  ring_group_call_timeout: string
  caller_id_name?: string
  ring_group_caller_id_number?: string
  /** "Ringtone (Alert Info)" — an Alert-Info option value (§34.4). Key kept from the old Distinctive Ring field. */
  ring_group_distinctive_ring?: string
  ring_group_cid_prefix?: string
  ring_group_forward_cid_mode: RingGroupForwardCidMode
  /** Only meaningful (and only sent) while the CID mode is `fixed` (§9/§34.3). */
  ring_group_forward_cid_value?: string
  ring_group_ringback?: string
  /** Recordings-group greeting option (§34.1). */
  ring_group_remote_announce?: string
  /** Recordings-group greeting option (§34.2). */
  ring_group_too_late_announce?: string
  ring_group_missed_call_app?: 'email'
  ring_group_missed_call_data?: string
  ring_group_forward_destination?: string
  ring_group_forward_enabled: boolean
  ring_group_forward_toll_allow?: string
  ring_group_enabled: boolean
  ring_group_call_forward_enabled: boolean
  ring_group_follow_me_enabled: boolean
  skip_busy_agent: boolean
  enable_call_pickup: boolean
  call_recording_enabled: boolean
  ring_group_description?: string
  ring_group_timeout_action?: string
  ring_group_destinations: RingGroupDestination[]
}

/** The normalized stored record — form model plus server-owned fields. */
export interface RingGroupDetails extends Omit<RingGroupFormValues, 'ring_group_call_timeout'> {
  ring_group_uuid: string
  domain_name: string
  ring_group_call_timeout: number
}

/**
 * The record as the backend may return it — normalized by the service before anything else sees it.
 * The CID mode may be missing or a legacy value (`original`), and the three newer switches may be
 * absent (§3 Edit step 3, §34.7). Axion's payload carries explicit empties (§27): `null` for the
 * announces and the Fixed CID Value, `''` for the Ringtone (Alert Info).
 */
export interface RingGroupRecord
  extends Omit<
    RingGroupDetails,
    | 'ring_group_enabled'
    | 'ring_group_forward_enabled'
    | 'ring_group_call_forward_enabled'
    | 'ring_group_follow_me_enabled'
    | 'ring_group_forward_cid_mode'
    | 'ring_group_forward_cid_value'
    | 'ring_group_remote_announce'
    | 'ring_group_too_late_announce'
    | 'skip_busy_agent'
    | 'enable_call_pickup'
    | 'call_recording_enabled'
  > {
  ring_group_forward_cid_value?: string | null
  ring_group_remote_announce?: string | null
  ring_group_too_late_announce?: string | null
  ring_group_enabled: WireBoolean
  ring_group_forward_enabled: WireBoolean
  ring_group_call_forward_enabled: WireBoolean
  ring_group_follow_me_enabled: WireBoolean
  ring_group_forward_cid_mode?: string | null
  skip_busy_agent?: boolean | null
  enable_call_pickup?: boolean | null
  call_recording_enabled?: boolean | null
}

/** One Alert-Info option (GET /api/alertInfo/options, ring-groups.md §12/§34.4). Shape inferred by the audit. */
export interface AlertInfoOption {
  label: string
  value: string
  alert_info_uuid: string
  /** Built-in options can't be deleted; custom ones (`false`) can. */
  alert_info_is_default: boolean
}

export interface AlertInfoGroup {
  label: string
  options: AlertInfoOption[]
}

/** PATCH /api/ringGroups/copy body (§11/§12). */
export interface RingGroupCopyPayload {
  ring_group_name: string
  ring_group_extension: string
  ring_group_uuid: string
}

/**
 * Domain-scoped option lists (§12): destination, timeout destination, greeting and ring back.
 * Grouped `{label, options:[{value,label}]}` lists — the shape `ToggleSelectInput` accepts. Option
 * value format is backend-owned.
 */
export type RingGroupOption = ToggleSelectOptions[number]

export interface RingGroupOptionSets {
  destinationOptions: RingGroupOption[]
  timeoutDestinationOptions: RingGroupOption[]
  greetingOptions: RingGroupOption[]
  ringBackOptions: RingGroupOption[]
}

/**
 * GET /api/hiveuser/details?module=RingGroup&domain_name= — Add/Edit/Copy bootstrap (§3/§12).
 * Field names are Axion's. The extension range comes from here, never from Axion's static
 * `extensionConfig.ringGroup` table (§26/§33).
 */
export interface RingGroupHiveDetails {
  defaultDomain: string
  domainOptions: string[]
  /** Suggested next extension for the domain. */
  autoExt: string
  additionalExtStart?: number
  /** Upper bound — PepperPBX skips the check when absent rather than failing every value. */
  additionalExtEnd?: number
  additionalExtExclude: string[]
}
