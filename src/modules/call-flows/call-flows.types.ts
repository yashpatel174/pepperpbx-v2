import type { ToggleSelectOptions } from '../../components/common/ToggleSelectInput'

/**
 * A flag as the backend may send it. Axion sends `'true'`/`'false'` on create/update, compares the
 * list against `'true'`, and coerces on Edit (call-flows.md §13/§28) — the real wire type is
 * unconfirmed. Only the service ever sees this type; everything else uses plain booleans.
 */
export type WireBoolean = boolean | 'true' | 'false'

/** The two independently toggled flags (call-flows.md §11/§12 `toggleKey`). */
export type CallFlowToggleKey = 'call_flow_status' | 'call_flow_enabled'

/** Lean list/table entity (call-flows.md §5). Flags are real booleans. */
export interface CallFlow {
  call_flow_uuid: string
  domain_name: string
  call_flow_name: string
  call_flow_extension: string
  call_flow_feature_code: string
  call_flow_context: string
  /** "Enable Feature Code". */
  call_flow_status: boolean
  /** "Status" column / "Enabled" switch. */
  call_flow_enabled: boolean
  call_flow_description?: string
}

/** GET /api/callFlows/list — query: pageSize, pageNumber, showAll, search (call-flows.md §12). */
export interface CallFlowListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface CallFlowListResponse {
  data: CallFlow[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
  /** Axion reads `wildCardDomains` from the list response to gate Show All (§3/§7/§15). */
  wildCardDomains: string[]
}

/**
 * What the shared Add/Edit form collects (call-flows.md §8). `call_flow_context` is deliberately
 * absent: it is never a user input — the service derives it from `domain_name` (§15/§26).
 */
export interface CallFlowFormValues {
  domain_name: string
  call_flow_name: string
  /** Free text, not `type="number"` — the value may carry Axion's `**` prefix. */
  call_flow_extension: string
  /** Generated from the extension (`flow+*<ext>`), never typed by the user. */
  call_flow_feature_code: string
  call_flow_pin_number?: string
  call_flow_data: string
  call_flow_label: string
  call_flow_sound?: string
  call_flow_alternate_data: string
  call_flow_alternate_label: string
  call_flow_alternate_sound?: string
  call_flow_description?: string
  call_flow_enabled: boolean
  call_flow_status: boolean
}

/** The normalized stored record — form model plus server-owned fields. */
export interface CallFlowDetails extends CallFlowFormValues {
  call_flow_uuid: string
  call_flow_context: string
  /** Sent back on update by Axion; whether the backend still needs them is unconfirmed (§28). */
  dialplan_uuid?: string
  domain_uuid?: string
}

/** The record as the backend may return it — normalized by the service before anything else sees it. */
export interface CallFlowRecord extends Omit<CallFlowDetails, 'call_flow_enabled' | 'call_flow_status'> {
  call_flow_enabled: WireBoolean
  call_flow_status: WireBoolean
}

/** GET /api/callFlows/details?call_flow_uuid= — `data.data` is an array; `[0]` is the record (§12/§13). */
export interface CallFlowDetailsResponse {
  data: CallFlowRecord[]
}

/** PATCH /api/callFlows/copy body (§11/§12). */
export interface CallFlowCopyPayload {
  copyCallFlowsData: { uuid: string; name: string; extension: string; featureCode: string }[]
}

/** PATCH /api/callFlows/toggle body (§11/§12). */
export interface CallFlowTogglePayload {
  toggleArray: string[]
  toggleKey: CallFlowToggleKey
}

/**
 * GET /api/callFlows/destinationDropdown and /soundDropDown — grouped `{label, options:[{value,label}]}`
 * lists (§12/§27), the exact shape `ToggleSelectInput` already accepts. Option value format is
 * backend-owned (§28).
 */
export type CallFlowDestinationOption = ToggleSelectOptions[number]
export type CallFlowSoundOption = ToggleSelectOptions[number]

/**
 * GET /api/hiveuser/details?module=CallFlows&domain_name= — Add/Edit/Copy bootstrap (§3/§12).
 * Field names are Axion's. The extension range comes from here, never from Axion's static
 * 100–999999 table (§26/§30).
 */
export interface CallFlowHiveDetails {
  defaultDomain: string
  domainOptions: string[]
  /** Suggested next extension for the domain. */
  autoExt: string
  /** Returned by Axion's bootstrap; the audit documents no use for it in this module's validation. */
  excludeExt: string[]
  /** Lower bound; Axion falls back to 100 when absent (§10). */
  additionalExtStart?: number
  /** Upper bound; Axion has no fallback here (§28) — PepperPBX skips the check when absent. */
  additionalExtEnd?: number
  additionalExtExclude: string[]
}
