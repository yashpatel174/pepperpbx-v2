import type {
  RingGroup,
  RingGroupDestination,
  RingGroupForwardCidMode,
  RingGroupFormValues,
  RingGroupHiveDetails,
  RingGroupStrategy,
} from './ring-group.types'

/** Initial page size; Reset returns to it (ring-groups.md §3). */
export const defaultPageSize = 10

/** Axion's page-size choices (ring-groups.md §5). */
export const pageSizeOptions = [10, 25, 50, 100, 200]

export const ringGroupPaths = {
  list: '/ring-groups',
  add: '/ring-groups/add',
  edit: (uuid: string) => `/ring-groups/${encodeURIComponent(uuid)}/edit`,
}

/** `strategyOptions` (ring-groups.md §8). */
export const strategyOptions: { value: RingGroupStrategy; label: string }[] = [
  { value: 'simultaneous', label: 'Simultaneous' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'rollover', label: 'Rollover' },
  { value: 'random', label: 'Random' },
]

/** Axion's `titleCaseString()` display of the strategy in the list (§5/§27). */
export const formatStrategy = (strategy?: string): string =>
  strategy ? strategy.charAt(0).toUpperCase() + strategy.slice(1).toLowerCase() : ''

/** The Destinations table's third column reads "Order" for these strategies, "Delay" otherwise (§9). */
export const isOrderStrategy = (strategy?: string) => strategy === 'sequence' || strategy === 'rollover'

const range = (start: number, end: number, step: number) =>
  Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => start + index * step)

/** `delayOptions`: 0–100 in steps of 5 (§8). */
export const delayOptions = range(0, 100, 5).map((value) => ({ value, label: String(value) }))

/** `timeoutOptions`: 5–100 in steps of 5 (§8). */
export const timeoutOptions = range(5, 100, 5).map((value) => ({ value, label: String(value) }))

/**
 * `promptOptions` (§8): "Select prompt" (the default, `0`) and "Confirm". TODO (backend): the audit
 * doesn't give Confirm's wire value — `1` is a placeholder.
 */
export const promptOptions = [
  { value: 0, label: 'Select prompt' },
  { value: 1, label: 'Confirm' },
]

/** `ringGroupForwardCidModeOptions` — "Change External CID Configuration" (§8/§34.3). */
export const forwardCidModeOptions: { value: RingGroupForwardCidMode; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'dialed', label: 'Dialed Number' },
  { value: 'fixed', label: 'Fixed ID' },
]

export const DEFAULT_FORWARD_CID_MODE: RingGroupForwardCidMode = 'default'

/** Edit load keeps only `dialed`/`fixed`; anything else (missing, legacy `original`, `default`) loads as Default (§3/§26). */
export const normalizeForwardCidMode = (mode?: string | null): RingGroupForwardCidMode =>
  mode === 'dialed' || mode === 'fixed' ? mode : DEFAULT_FORWARD_CID_MODE

/** Remote / Too Late Announce only offer the greeting options' `Recordings` group (§9/§34.1). */
export const RECORDINGS_GROUP_LABEL = 'Recordings'

/**
 * First choice on the optional Greeting / Remote Announce / Too Late Announce selects. Empty value,
 * so picking it clears the field (the select falls back to its placeholder) and nothing is saved.
 */
export const noneOption = { label: 'None', value: '' }

/** `missedCallSelectOptions` (§8) — Email is the only option. */
export const missedCallOptions: { value: 'email'; label: string }[] = [{ value: 'email', label: 'Email' }]

export const ringGroupStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields the mock list search matches. Real matching is backend-owned and unknown (§6). */
export const searchableRingGroupFields: (keyof RingGroup)[] = [
  'ring_group_name',
  'ring_group_extension',
  'ring_group_strategy',
  'ring_group_description',
]

/**
 * The Axion endpoints the service stands in for (ring-groups.md §12), with the leading slash Axion's
 * greetings/destination/timeoutDestination keys were missing restored (§28/§33). Not a confirmed
 * PepperPBX backend contract — the service is mock-only until it is.
 */
export const ringGroupEndpoints = {
  list: '/ringGroups/list',
  create: '/ringGroups/create',
  update: '/ringGroups/update',
  details: '/ringGroups/details',
  delete: '/ringGroups/delete',
  toggle: '/ringGroups/toggle',
  copy: '/ringGroups/copy',
  destinationOptions: '/ringGroups/destination',
  timeoutDestinationOptions: '/ringGroups/timeoutDestination',
  greetingOptions: '/ringGroups/greetings',
  ringBackOptions: '/ringGroups/ringBack',
  hiveUserDetails: '/hiveuser/details?module=RingGroup',
} as const

/**
 * Axion's shared Alert-Info endpoints behind the Ringtone (Alert Info) select (§12/§34.4). Shared
 * with Follow Me in Axion; PepperPBX has no Follow Me module yet, so Ring Groups owns them for now.
 */
export const alertInfoEndpoints = {
  options: '/alertInfo/options',
  create: '/alertInfo/create',
  delete: '/alertInfo/delete',
} as const

/** `deleteMessage('custom alert info')` (§34.4), same wording as the ring group delete warning. */
export const alertInfoDeleteWarning =
  'Note: Please ensure that this custom alert info is not linked to any other records before proceeding, as deleting it may affect related data.'

/**
 * Placeholder permission strings (`ring-group.<action>`), standing in for Axion's
 * `RINGGROUPS_PERMISSION` keys (ring-groups.md §14): view → `pbx_ringgroups_view`, add →
 * `pbx_ringgroups_add`, edit → `pbx_ringgroups_edit`, all → `pbx_ringgroups_all` (module admin).
 * Not a backend contract; RBAC is foundation-only.
 */
export const ringGroupPermissions = {
  view: 'ring-group.view',
  add: 'ring-group.add',
  edit: 'ring-group.edit',
  all: 'ring-group.manage',
}

/** Defaults for a new Destinations row (§8): no destination yet, delay 0, timeout 30, prompt 0. */
export const newDestinationRow = (): RingGroupDestination => ({
  destination_number: '',
  destination_delay: 0,
  destination_timeout: 30,
  destination_prompt: 0,
})

/** Axion's Add default ring back (§3/§26). */
export const DEFAULT_RINGBACK = 'us-ring'

/**
 * Add-mode defaults (ring-groups.md §3/§26): enabled on, call forward / follow me / skip busy agent /
 * call pickup / call recording off, call timeout 30, ring back `us-ring`, external CID mode Default,
 * one empty destination, extension from `autoExt`. Remote / Too Late Announce have no default.
 */
export const getDefaultRingGroupFormValues = (hive: RingGroupHiveDetails, domainName: string): Partial<RingGroupFormValues> => ({
  ring_group_context: domainName,
  ring_group_extension: hive.autoExt,
  ring_group_call_timeout: '30',
  ring_group_ringback: DEFAULT_RINGBACK,
  ring_group_forward_cid_mode: DEFAULT_FORWARD_CID_MODE,
  ring_group_enabled: true,
  ring_group_forward_enabled: false,
  ring_group_call_forward_enabled: false,
  ring_group_follow_me_enabled: false,
  skip_busy_agent: false,
  enable_call_pickup: false,
  call_recording_enabled: false,
  ring_group_destinations: [newDestinationRow()],
})

/** Axion's shared delete warning (`deleteMessage('ring group')`, §3/§20). */
export const ringGroupDeleteWarning =
  'Note: Please ensure that this ring group is not linked to any other records before proceeding, as deleting it may affect related data.'

/** Axion's `CommonExtInput` note under the extension field. */
export { extensionReuseNote } from '../../components/common/extensionReuseNote'
