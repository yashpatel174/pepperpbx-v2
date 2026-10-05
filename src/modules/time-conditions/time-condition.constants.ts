import type { TimeCondition, TimeConditionFormValues, TimeConditionHiveDetails } from './time-condition.types'

/** Axion's Reset returns to page size 10 (time-conditions.md §3/§6). */
export const defaultPageSize = 10

/** Axion's `dataPerPage` choices (§5). */
export const pageSizeOptions = [10, 25, 50, 100, 200]

export const timeConditionPaths = {
  list: '/time-conditions',
  add: '/time-conditions/add',
  edit: (uuid: string) => `/time-conditions/${encodeURIComponent(uuid)}/edit`,
}

/** Fields the mock list search matches. Real matching semantics are backend-owned (§6/§28). */
export const searchableTimeConditionFields: (keyof TimeCondition)[] = [
  'time_condition_name',
  'time_condition_extension',
  'dialplan_name',
  'name',
  'timeMatchAction',
  'timeNotMatchAction',
]

/**
 * The Axion endpoints the service stands in for (time-conditions.md §12). Not a confirmed PepperPBX
 * backend contract — the service is mock-only until it is. Destination options come from the
 * Destinations module's own `getActionOptions` (`/destinations/list/actions`, §30).
 */
export const timeConditionEndpoints = {
  list: '/timeCondition/list',
  create: '/timeCondition/create',
  update: '/timeCondition/update',
  details: '/timeCondition/details',
  delete: '/timeCondition/delete',
  toggle: '/timeCondition/toggle',
  timeGroupOptions: '/timeCondition/timeGroup/dropdown',
  hiveUserDetails: '/hiveuser/details?module=TimeCondition',
} as const

/**
 * Placeholder permission strings (`<module>.<action>`), standing in for Axion's four
 * `pbx_timeconditions_*` keys (time-conditions.md §14): view → `pbx_timeconditions_view`, add →
 * `pbx_timeconditions_add`, edit → `pbx_timeconditions_edit`, all → `pbx_timeconditions_all`
 * (module admin). Axion exports these as `TIMEGROUP_PERMISSION` and shares them with Time Group and
 * Time Group Presets (§30) — keep that coupling in mind when the real contract lands. Not a backend
 * contract; RBAC is foundation-only.
 */
export const timeConditionPermissions = {
  view: 'timecondition.view',
  add: 'timecondition.add',
  edit: 'timecondition.edit',
  all: 'timecondition.manage',
}

/** Add-mode defaults (§3): Enabled on, extension from the domain's `autoExt`. */
export const getDefaultTimeConditionFormValues = (
  hive: TimeConditionHiveDetails,
  domainName: string
): Partial<TimeConditionFormValues> => ({
  domain_name: domainName,
  time_condition_name: '',
  time_condition_extension: hive.autoExt,
  enabled: true,
})

/** Axion's shared delete warning (`deleteMessage('time condition')`, §3/§20). */
export const timeConditionDeleteWarning =
  'Note: Please ensure that this time condition is not linked to any other records before proceeding, as deleting it may affect related data.'

/** Axion's `CommonExtInput` note under the extension field (§8). */
export { extensionReuseNote } from '../../components/common/extensionReuseNote'
