export interface SelectOption {
  label: string
  value: string
}

/** 9 strategies (call-center.md §8/§26/§33's `strategyOptions`). */
export type QueueStrategy =
  | 'ring-all'
  | 'longest-idle-agent'
  | 'round-robin'
  | 'top-down'
  | 'agent-with-least-talk-time'
  | 'agent-with-fewest-calls'
  | 'sequentially-by-agent-order'
  | 'sequentially-by-next-agent-order'
  | 'random'

/** call-center.md §8's `timeBaseScoreOptions` — System or Queue. */
export type TimeBaseScore = 'system' | 'queue'

/**
 * Lean list/table entity — deliberately NOT the full Add/Edit shape (see CallCenterFormValues/
 * CallCenterDetails below), matching the entity-vs-form-values separation convention established
 * by every sibling module (Extensions/Gateways/Destinations/Outbound-Routes/Announcements).
 * `strategy` stays the raw value (`queue_strategy`); the table resolves it to a human label via
 * `queueStrategyLabel` (call-center.constants.ts) rather than the entity carrying a duplicate
 * pre-formatted field.
 */
export interface CallCenter {
  id: string
  domain: string
  name: string
  extension: string
  strategy: QueueStrategy
  description?: string
  /** Drives the list's "Tier Rules Apply" pill (call-center.md §5). call-center.md documents it as
   * a read-only badge; the list currently makes it an inline toggle (edit-permission-gated, same
   * pattern as Call Block/Announcements) — see toggleCallCenterTierRules in call-center.service.ts. */
  tierRulesApply: boolean
}

export interface CallCenterListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface CallCenterListResponse {
  data: CallCenter[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/**
 * GET /api/hiveuser/details?module=CallCenter&domain_name=... — Add/Edit/Copy bootstrap
 * (call-center.md §8/§9/§12/§26/§33). `autoExtension`/`extensionRangeStart`/`extensionRangeEnd`/
 * `extensionExclude` drive `queue_extension`'s validation — the audit documents a preserved
 * 2000–2999 range for call center queues (call-center.md §26/§33), sourced from this bootstrap
 * response rather than hardcoded in validation code, matching the server-driven-range pattern the
 * audit itself describes (`additionalExtStart/End/Exclude`).
 */
export interface HiveCallCenterDetails {
  defaultDomain: string
  domainOptions: string[]
  autoExtension: string
  extensionRangeStart: number
  extensionRangeEnd: number
  extensionExclude: string[]
}

/** call-center.md §8's `callcenter_tier` field array — Agent Name/Tier Level/Tier Position rows. */
export interface CallCenterTierFormValue {
  /** Existing tiers carry their own uuid (call-center.md §27); new rows have none until saved. */
  call_center_tier_uuid?: string
  call_center_agent_uuid?: string
  tier_level: number
  tier_position: number
}

/**
 * What the Add/Edit form actually collects — ONE shared shape for both modes, matching every
 * sibling module's `Add<Feature>Page`/`Edit<Feature>Page` sharing one `<Feature>Form`. Numeric
 * fields are kept as validated strings here (converted to `number` only at the service boundary
 * in call-center.service.ts's `toDetails`) — same convention as Gateways'/Extensions'
 * `*FormValues` (see gateway.types.ts's own comment on this).
 *
 * `queue_greeting`/`queue_timeout_action`/`queue_announce_sound` are edited with the shared
 * `ToggleSelectInput` (components/common) — see CallCenterBasicSection.tsx.
 *
 * `queue_moh_sound` is required on submit but `undefined` until picked, so the Select shows its
 * placeholder (an empty string would count as a selected value).
 */
export interface CallCenterFormValues {
  queue_name: string
  queue_extension: string
  queue_greeting?: string
  queue_strategy: QueueStrategy
  queue_moh_sound?: string
  queue_distinctive_ring?: string
  queue_time_base_score: TimeBaseScore
  queue_max_wait_time?: string
  queue_tier_rule_wait_second?: string
  queue_cid_prefix?: string
  queue_discard_abandoned_after?: string
  queue_time_base_score_sec?: string
  queue_max_wait_time_with_no_agent?: string
  queue_max_wait_time_with_no_agent_time_reached?: string
  queue_announce_frequency?: string
  queue_cc_exit_keys?: string
  queue_outbound_caller_id_name?: string
  queue_outbound_caller_id_number?: string
  domain_name: string
  queue_timeout_action?: string
  queue_announce_sound?: string
  queue_description?: string
  // SwitchForm (call-center.md §8's 6 toggles)
  queue_record_template: boolean
  queue_tier_rules_apply: boolean
  queue_abandoned_resume_allowed: boolean
  queue_announce_position: boolean
  queue_tier_rule_wait_multiply_level: boolean
  queue_tier_rule_no_agent_no_wait: boolean
  callcenter_tier: CallCenterTierFormValue[]
}

/** The numeric fields call-center.md §27 documents as `Number()`-coerced on submit. */
export type CallCenterNumericField =
  | 'queue_max_wait_time'
  | 'queue_tier_rule_wait_second'
  | 'queue_discard_abandoned_after'
  | 'queue_time_base_score_sec'
  | 'queue_max_wait_time_with_no_agent'
  | 'queue_max_wait_time_with_no_agent_time_reached'
  | 'queue_announce_frequency'

/**
 * The stored/API record shape — the form model with call-center.md §27's numeric fields as real
 * numbers (`undefined` when left empty). `queue_outbound_caller_id_number` stays a string: it's a
 * phone number, not a quantity, and isn't in §27's coercion list. `queue_moh_sound` is required
 * on the record (the form's required rule guarantees it by submit time).
 */
export type CallCenterDetails = Omit<CallCenterFormValues, CallCenterNumericField | 'queue_moh_sound'> & {
  [Field in CallCenterNumericField]?: number
} & {
  call_center_queue_uuid: string
  queue_moh_sound: string
}

/**
 * PATCH /api/callCenters/toggle — Start/Stop/Restart (call-center.md §11/§12/§26/§33's
 * `flagCommand` mapping: 'load'=start, 'unload'=stop, 'reload'=restart). Preserved verbatim per
 * the audit's explicit instruction to keep this exact mapping.
 */
export type CallCenterFlagCommand = 'load' | 'unload' | 'reload'

/**
 * PATCH /api/callCenters/agentsTier (call-center.md §11/§12/§27/§33) — removes only the Tier
 * (queue-agent membership) relationship; the Agent entity itself is never touched by this call.
 * Payload shape preserved verbatim from the audit. `call_center_tier_uuid` is an array (Axion
 * supports removing several at once), though PepperPBX's UI only ever calls this with one tier
 * uuid at a time (a single row's Delete click) — see CallCenterTierSection.tsx.
 */
export interface RemoveCallCenterTierPayload {
  call_center_queue_uuid: string
  call_center_tier_uuid: string[]
  domain_name: string
  queue_extension: string
}
