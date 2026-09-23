export interface SelectOption {
  label: string
  value: string
}

/**
 * call-center.md §17's 4 confirmed statuses. Also the same field the Agent list's "Status" column
 * and the separate Agent Status bulk-edit page both read/write (`agent_status`) — Axion has no
 * second, distinct "live status" field; the Status page is just a dedicated bulk-editing UI for
 * this one field, not a different data model. See CallCenterAgentDetails.agent_status.
 */
export type AgentStatus = 'logged-out' | 'available' | 'available-on-demand' | 'on-break'

/**
 * Lean list/table entity — deliberately NOT the full Add/Edit shape (see
 * CallCenterAgentFormValues/CallCenterAgentDetails below), matching the entity-vs-form-values
 * separation convention established by every sibling module.
 */
export interface CallCenterAgent {
  id: string
  domain: string
  name: string
  agentId?: string
  type?: string
  callTimeout?: string
  contact?: string
  maxNoAnswer?: string
  status?: AgentStatus
}

export interface CallCenterAgentListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface CallCenterAgentListResponse {
  data: CallCenterAgent[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** GET /api/hiveuser/details?module=CallCenterAgent&domain_name=... — Add/Edit bootstrap (call-center.md §3/§13/§15). */
export interface HiveCallCenterAgentDetails {
  defaultDomain: string
  domainOptions: string[]
}

/**
 * What the Add/Edit form actually collects — ONE shared shape for both modes, matching every
 * sibling module's `Add<Feature>Page`/`Edit<Feature>Page` sharing one `<Feature>Form`. Numeric
 * fields are kept as validated strings here (converted to `number` only at the service boundary
 * in call-center-agents.service.ts's `toDetails`) — same convention as Gateways'/Extensions'/the
 * Call Center Queue module's own `*FormValues`.
 */
export interface CallCenterAgentFormValues {
  agent_name: string
  /** Free text input in Axion, not a select (call-center.md §8). */
  agent_type?: string
  agent_call_timeout?: string
  agent_id?: string
  agent_password?: string
  agent_status?: AgentStatus
  agent_no_answer_delay_time?: string
  agent_max_no_answer?: string
  agent_wrap_up_time?: string
  agent_reject_delay_time?: string
  agent_busy_delay_time?: string
  domain_name: string
  agent_contact: string
  agent_record: boolean
}

/**
 * The stored/API record shape. `call_flow_enabled`/`call_flow_status`/`call_flow_context` are
 * confirmed present in Axion's Agent Details response (call-center.md §27: normalized from string
 * 'true'/'false' to boolean on load) but the audit documents NO Add/Edit form control for them —
 * carried through here for response-shape parity only, never rendered as form fields. Do not
 * invent a UI for them.
 */
export interface CallCenterAgentDetails extends CallCenterAgentFormValues {
  call_center_agent_uuid: string
  call_flow_enabled?: boolean
  call_flow_status?: boolean
  call_flow_context?: string
}

/** PATCH /api/callCentersAgents/setStatus payload entry (call-center.md §17). */
export interface AgentStatusUpdate {
  call_center_agent_uuid: string
  status: AgentStatus
}

/** One row of the Agent Status page's bootstrap list (call-center.md §16/§17). */
export interface AgentStatusEntry {
  call_center_agent_uuid: string
  agent_name: string
  domain: string
  status: AgentStatus
}
