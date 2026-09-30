import type { CallFlow, CallFlowFormValues, CallFlowHiveDetails, CallFlowToggleKey } from './call-flows.types'

/** Axion's search commit and Reset both return to page size 10 (call-flows.md §3/§6). */
export const defaultPageSize = 10

/** Axion's `dataPerPage` choices (call-flows.md §5). */
export const pageSizeOptions = [10, 25, 50, 100, 200]

export const callFlowPaths = {
  list: '/call-flows',
  add: '/call-flows/add',
  edit: (uuid: string) => `/call-flows/${encodeURIComponent(uuid)}/edit`,
}

export const callFlowStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/**
 * Labels for the two toggle keys, as the list columns name them (§5). Axion's bulk Toggle popup
 * names them differently ("Status" / "Enabled", §3) — PepperPBX uses one set of names everywhere.
 */
export const callFlowToggleKeyLabels: Record<CallFlowToggleKey, string> = {
  call_flow_status: 'Enable Feature Code',
  call_flow_enabled: 'Status',
}

/** Identifies one in-flight row toggle (a row has two independently toggled badges). */
export const pendingToggleKey = (uuid: string, toggleKey: CallFlowToggleKey) => `${uuid}:${toggleKey}`

/** Fields the mock list search matches — the columns Axion marks server-searchable (§5). Real matching is backend-owned. */
export const searchableCallFlowFields: (keyof CallFlow)[] = [
  'call_flow_name',
  'call_flow_extension',
  'call_flow_feature_code',
  'call_flow_context',
  'call_flow_description',
]

/**
 * The Axion endpoints the service stands in for (call-flows.md §12). Not a confirmed PepperPBX
 * backend contract — the service is mock-only until it is.
 */
export const callFlowEndpoints = {
  list: '/callFlows/list',
  create: '/callFlows/create',
  update: '/callFlows/update',
  details: '/callFlows/details',
  delete: '/callFlows/delete',
  copy: '/callFlows/copy',
  toggle: '/callFlows/toggle',
  destinationOptions: '/callFlows/destinationDropdown',
  soundOptions: '/callFlows/soundDropDown',
  hiveUserDetails: '/hiveuser/details?module=CallFlows',
} as const

/**
 * Placeholder permission strings (`<module>.<action>`), standing in for Axion's
 * `CALLFLOWS_PERMISSION` keys (call-flows.md §14): view → `pbx_callflow_view`, add →
 * `pbx_callflow_add`, edit → `pbx_callflow_edit`, all → `pbx_callflow_all` (module admin). Not a
 * backend contract; RBAC is foundation-only.
 */
export const callFlowPermissions = {
  view: 'callflow.view',
  add: 'callflow.add',
  edit: 'callflow.edit',
  all: 'callflow.manage',
}

/**
 * Axion's feature-code rule (call-flows.md §3/§26): `flow+` + the extension with a leading `**`
 * collapsed to `*` — `**1505` → `flow+*1505`. Empty extension → empty feature code.
 */
export const toFeatureCode = (extension?: string): string => {
  const trimmed = extension?.trim() ?? ''
  return trimmed ? `flow+${trimmed.replace(/^\*\*/, '*')}` : ''
}

/** Add-mode defaults (call-flows.md §3): both flags on, extension from `autoExt`, feature code derived from it. */
export const getDefaultCallFlowFormValues = (hive: CallFlowHiveDetails, domainName: string): Partial<CallFlowFormValues> => ({
  domain_name: domainName,
  call_flow_name: '',
  call_flow_extension: hive.autoExt,
  call_flow_feature_code: toFeatureCode(hive.autoExt),
  call_flow_enabled: true,
  call_flow_status: true,
})

/** Axion's shared delete warning (`deleteMessage('call flow')`, §3/§20). */
export const callFlowDeleteWarning =
  'Note: Please ensure that this call flow is not linked to any other records before proceeding, as deleting it may affect related data.'

/** Axion's `CommonExtInput` note under the extension field (§26). */
export const extensionReuseNote = 'If you modify the extension, make sure it is not used in any other application.'
