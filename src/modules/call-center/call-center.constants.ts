import type { CallCenter, CallCenterFormValues, HiveCallCenterDetails, QueueStrategy, TimeBaseScore } from './call-center.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

/** Fields matched by fetchCallCenters' search filter (see call-center.service.ts). */
export const searchableCallCenterFields: (keyof CallCenter)[] = ['name', 'extension', 'strategy', 'description', 'domain']

/** 9 queue strategies, call-center.md §8/§26/§33 — order matches the audit's documented list. */
export const queueStrategyOptions: { label: string; value: QueueStrategy }[] = [
  { label: 'Ring All', value: 'ring-all' },
  { label: 'Longest Idle Agent', value: 'longest-idle-agent' },
  { label: 'Round Robin', value: 'round-robin' },
  { label: 'Top Down', value: 'top-down' },
  { label: 'Agent With Least Talk Time', value: 'agent-with-least-talk-time' },
  { label: 'Agent With Fewest Calls', value: 'agent-with-fewest-calls' },
  { label: 'Sequentially By Agent Order', value: 'sequentially-by-agent-order' },
  { label: 'Sequentially By Next Agent Order', value: 'sequentially-by-next-agent-order' },
  { label: 'Random', value: 'random' },
]

const queueStrategyLabelByValue: Record<QueueStrategy, string> = Object.fromEntries(
  queueStrategyOptions.map((option) => [option.value, option.label])
) as Record<QueueStrategy, string>

/** Resolves a raw strategy value to its human label for table display — falls back to the raw value. */
export const queueStrategyLabel = (strategy: QueueStrategy): string => queueStrategyLabelByValue[strategy] ?? strategy

/** call-center.md §8's `timeBaseScoreOptions` — System or Queue. */
export const timeBaseScoreOptions: { label: string; value: TimeBaseScore }[] = [
  { label: 'System', value: 'system' },
  { label: 'Queue', value: 'queue' },
]

/** call-center.md §8/§26/§33's `tierLevelAndPositionOptions` — integer range 0–9. */
export const tierLevelAndPositionOptions: { label: string; value: number }[] = Array.from({ length: 10 }, (_, level) => ({
  label: String(level),
  value: level,
}))

/**
 * Four-key granular permission module (call-center.md §14/§33: "Preserve both permission
 * modules... the two-module split is an intentional design choice"). This module implements only
 * the `CALLCENTER_PERMISSION` half (queue CRUD) — the separate `AGENT_PERMISSION`-gated Agent
 * entity CRUD/Agent Status sub-screens are out of scope for this module (see call-center.router.tsx's
 * top comment). Deliberately module-local placeholder strings per CLAUDE.md's `<module>.<action>`
 * naming rule — not a reproduction of Axion's literal `pbx_callcenter_*` names.
 *
 * NOT reproduced: the audit's row-level permission flags read from each list row's own embedded
 * `original[perm]` properties (call-center.md §14/§25) — PepperPBX's `CallCenter` list entity
 * carries no per-record permission data and no confirmed backend contract exists for one; row
 * actions fall back to these module-level booleans only, matching Call Block's/Announcements'
 * identical, already-established precedent.
 */
export const callCenterPermissions = {
  view: 'callCenter.view',
  add: 'callCenter.add',
  edit: 'callCenter.edit',
  all: 'callCenter.manage',
}

/**
 * Add-mode form defaults. Confirmed Axion defaults (call-center.md §3/§26): `queue_strategy`
 * 'longest-idle-agent', `queue_time_base_score` 'system', `queue_max_wait_time` 0,
 * `queue_max_wait_time_with_no_agent` 90, `queue_max_wait_time_with_no_agent_time_reached` 30,
 * `queue_tier_rule_wait_second` 30, `queue_discard_abandoned_after` 900. Switch defaults
 * (call-center.md §8's SwitchForm table): record/tier-rules-apply/abandoned-resume false;
 * announce-position/tier-rule-wait-multiply-level/tier-rule-no-agent-no-wait true. Tier array
 * seeds one empty row (`{tier_level:0, tier_position:0}`), matching the audit exactly.
 */
export const getDefaultCallCenterFormValues = (hive: HiveCallCenterDetails): CallCenterFormValues => ({
  queue_name: '',
  queue_extension: hive.autoExtension,
  queue_strategy: 'longest-idle-agent',
  queue_moh_sound: '',
  queue_time_base_score: 'system',
  queue_max_wait_time: '0',
  queue_tier_rule_wait_second: '30',
  queue_discard_abandoned_after: '900',
  queue_max_wait_time_with_no_agent: '90',
  queue_max_wait_time_with_no_agent_time_reached: '30',
  domain_name: hive.defaultDomain,
  queue_record_template: false,
  queue_tier_rules_apply: false,
  queue_abandoned_resume_allowed: false,
  queue_announce_position: true,
  queue_tier_rule_wait_multiply_level: true,
  queue_tier_rule_no_agent_no_wait: true,
  callcenter_tier: [{ tier_level: 0, tier_position: 0 }],
})
