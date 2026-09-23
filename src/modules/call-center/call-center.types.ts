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
  /** Drives the read-only "Tier Rules Apply" badge (call-center.md §5) — not a clickable status;
   * Call Center queues have no list-level enabled/disabled concept, see call-center.md §5's table
   * column set (no Status column) and §33's explicit warning against inventing one. */
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
 * NOT reproduced: Axion's `ToggleSelectInputCallCenter` custom select-or-type-your-own control for
 * `queue_greeting`/`queue_timeout_action`/`queue_announce_sound` — PepperPBX has no equivalent
 * component in any existing module, and CLAUDE.md's "don't build abstractions ahead of real
 * repetition" rule argues against inventing one for a single module. Ant Design's own
 * `AutoComplete` (a stock component, not a new dependency) provides the same "pick from a fetched
 * list or type a custom value" behavior and is used instead — see CallCenterBasicSection.tsx.
 */
export interface CallCenterFormValues {
  queue_name: string
  queue_extension: string
  queue_greeting?: string
  queue_strategy: QueueStrategy
  queue_moh_sound: string
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

/** The stored/API record shape — the create/update form model as returned by the server. */
export interface CallCenterDetails extends CallCenterFormValues {
  call_center_queue_uuid: string
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
