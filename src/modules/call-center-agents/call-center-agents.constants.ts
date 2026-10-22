import type { AgentStatus, CallCenterAgent, CallCenterAgentFormValues, HiveCallCenterAgentDetails } from './call-center-agents.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

/** Fields matched by fetchCallCenterAgents' search filter (see call-center-agents.service.ts). */
export const searchableAgentFields: (keyof CallCenterAgent)[] = ['name', 'agentId', 'type', 'contact', 'domain']

/** call-center.md §17/§26 — 4 confirmed statuses, shared by the Add/Edit form's Status field, the
 * list's Status column, and the separate Agent Status bulk-edit page (same `agent_status` field,
 * not a different model). */
export const agentStatusOptions: { label: string; value: AgentStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Available (On Demand)', value: 'available-on-demand' },
  { label: 'On Break', value: 'on-break' },
  { label: 'Logged Out', value: 'logged-out' },
]

const agentStatusLabelByValue: Record<AgentStatus, string> = Object.fromEntries(
  agentStatusOptions.map((option) => [option.value, option.label])
) as Record<AgentStatus, string>

/** Resolves a raw status value to its human label — falls back to a placeholder for an unset status. */
export const agentStatusLabel = (status?: AgentStatus): string => (status ? (agentStatusLabelByValue[status] ?? status) : '—')

/**
 * Single coarse permission gate — matches Axion's own documented `AGENT_PERMISSION` shape
 * (call-center.md §14: "single key `pbx_callcenter_admin`, **no** `module_admin`") rather than
 * the Call Center Queue module's separate four-key `CALLCENTER_PERMISSION` model. The audit
 * itself documents these as two intentionally distinct permission modules (call-center.md §33:
 * "Preserve both permission modules... the two-module split is an intentional design choice") —
 * this module implements only its own, internally consistent single-key model rather than
 * reproducing Axion's confirmed inconsistency where the Queue list's "Agents" button is gated by
 * Queue permissions while the Agent screens themselves check a completely different permission
 * (call-center.md §28's documented mismatch). Deliberately module-local placeholder string per
 * CLAUDE.md's `<module>.<action>` naming rule — not a reproduction of Axion's literal
 * `pbx_callcenter_admin` name, and not yet backed by a confirmed backend contract.
 */
export const callCenterAgentPermission = 'callCenterAgent.manage'

/**
 * Add-mode form defaults. Confirmed Axion defaults (call-center.md §3/§26): `agent_type`
 * 'callback', `agent_call_timeout` 20, `agent_no_answer_delay_time` 30, `agent_max_no_answer` 0,
 * `agent_wrap_up_time` 10, `agent_reject_delay_time` 90, `agent_busy_delay_time` 90,
 * `agent_record` false.
 *
 * NOT included: `agent_status` has no confirmed default value (the audit's own Form Audit table,
 * §8, leaves its Default column "—" despite a Behavior note saying "default status on agent
 * creation" — the value itself is never specified, so nothing is invented here) and
 * `call_flow_enabled`/`call_flow_context` are NOT documented anywhere as Add-mode defaults (only
 * as Edit-load response fields, call-center.md §27) — do not invent them as defaults.
 */
export const getDefaultCallCenterAgentFormValues = (hive: HiveCallCenterAgentDetails): CallCenterAgentFormValues => ({
  agent_name: '',
  agent_type: 'callback',
  agent_call_timeout: '20',
  agent_no_answer_delay_time: '30',
  agent_max_no_answer: '0',
  agent_wrap_up_time: '10',
  agent_reject_delay_time: '90',
  agent_busy_delay_time: '90',
  domain_name: hive.defaultDomain,
  agent_contact: '',
  agent_record: false,
})
