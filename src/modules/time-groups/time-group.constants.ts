import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { MonthKey, TimeGroup, TimeGroupFormValues, TimeGroupRangeFormValues, WeekdayKey } from './time-group.types'

/** Axion's Reset returns to page size 10 (time-groups.md §3/§6). */
export const defaultPageSize = 10

/** Axion's `dataPerPage` choices (§5). */
export const pageSizeOptions = [10, 25, 50, 100, 200]

export const timeGroupPaths = {
  list: '/time-groups',
  add: '/time-groups/add',
  edit: (uuid: string) => `/time-groups/${encodeURIComponent(uuid)}/edit`,
}

/** Fields the mock list search matches. Real matching semantics are backend-owned (§6/§28). */
export const searchableTimeGroupFields: (keyof TimeGroup)[] = ['dialplan_name', 'dialplan_context', 'dialplan_description']

/**
 * The Axion endpoints the service stands in for (time-groups.md §12). Not a confirmed PepperPBX
 * backend contract — the service is mock-only until it is.
 */
export const timeGroupEndpoints = {
  list: '/timeGroups/list',
  create: '/timeGroups/create',
  update: '/timeGroups/update',
  details: '/timeGroups/details',
  delete: '/timeGroups/delete',
  copy: '/timeGroups/copy',
  hiveUserDetails: '/hiveuser/details?module=TimeGroup',
} as const

/**
 * Placeholder permission strings (`<module>.<action>`), standing in for Axion's
 * `TIMEGROUP_PERMISSION` object (time-groups.md §14). Axion's keys are the `pbx_timeconditions_*`
 * ones — the same object gates Time Conditions, Time Groups and Presets (§1/§30), so when the real
 * contract lands these may collapse into `timeConditionPermissions`. Not a backend contract; RBAC
 * is foundation-only.
 */
export const timeGroupPermissions = {
  view: 'timegroup.view',
  add: 'timegroup.add',
  edit: 'timegroup.edit',
  all: 'timegroup.manage',
}

/** Axion's shared delete warning (`deleteMessage('time group')`, §3/§20). */
export const timeGroupDeleteWarning =
  'Note: Please ensure that this time group is not linked to any other records before proceeding, as deleting it may affect related data.'

/** Times are stored as `hh:mm A` strings (§26). */
export const timeFormat = 'hh:mm A'
/** Axion's pickers step in 10-minute intervals (§8). */
export const timeMinuteStep = 10
/** Full Day forces these values (§8/§9). */
export const fullDayTimeFrom = '12:00 AM'
export const fullDayTimeTo = '11:59 PM'

const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i

/** `hh:mm A` → minutes since midnight, or `null` when the string isn't a valid 12-hour time. */
export const timeToMinutes = (value?: string): number | null => {
  const match = value ? TIME_PATTERN.exec(value.trim()) : null
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 1 || hour > 12 || minute > 59) return null
  const isPm = match[3].toUpperCase() === 'PM'
  return ((hour % 12) + (isPm ? 12 : 0)) * 60 + minute
}

/**
 * `Form.Item` props for a TimePicker whose form value is an `hh:mm A` string (§26): the picker holds
 * Dayjs, the form model keeps the string. Shared by the Time Group and Preset forms.
 */
export const timePickerItemProps = {
  getValueProps: (value?: string) => {
    const minutes = timeToMinutes(value)
    return { value: minutes === null ? undefined : dayjs().startOf('day').add(minutes, 'minute') }
  },
  normalize: (value: Dayjs | null) => (value ? value.format(timeFormat) : ''),
}

/**
 * `disabledTime` for a Time To picker: greys out every time at or before Time From, matching the
 * "Time To must be after Time From" rule (same time not allowed). No Time From → no restriction.
 * Hours are 0–23 as the picker reports them, whatever the 12-hour display.
 */
export const disabledTimeAfter = (timeFrom?: string) => {
  const fromMinutes = timeToMinutes(timeFrom)
  if (fromMinutes === null) return undefined
  return () => ({
    disabledHours: () => Array.from({ length: 24 }, (_, hour) => hour).filter((hour) => hour * 60 + 59 <= fromMinutes),
    disabledMinutes: (hour: number) =>
      Array.from({ length: 60 }, (_, minute) => minute).filter((minute) => hour * 60 + minute <= fromMinutes),
  })
}

/** True when the stored `hh:mm A` Time To is at or before the newly picked Time From. */
export const isTimeAtOrBefore = (timeTo: string | undefined, timeFrom: Dayjs) => {
  const toMinutes = timeToMinutes(timeTo)
  return toMinutes !== null && toMinutes <= timeFrom.hour() * 60 + timeFrom.minute()
}

/** Year sentinel Axion stores for "Apply on All Years" / "All Years" (§8/§26). */
export const allYearsSentinel = 2099
/** The year picker allows up to two selections (§2/§8). */
export const maxSelectedYears = 10
/** Axion's form offers 10 years from the current one (§24). */
export const yearOptionCount = 10

/** "All Years" (2099) is only offered while Apply on All Years is on, as in Axion's year picker. */
export const getYearOptions = (includeAllYears: boolean, currentYear = new Date().getFullYear()) => [
  ...Array.from({ length: yearOptionCount }, (_, index) => ({ label: String(currentYear + index), value: currentYear + index })),
  ...(includeAllYears ? [{ label: 'All Years', value: allYearsSentinel }] : []),
]

/**
 * Order select options, shared by the main Order and every group's Order (§8): "1" → 501, then
 * 5…95 in steps of 5 → 505…595, and "99" → 599. The stored value is the dialplan order.
 */
export const orderOptions = [
  { label: '1', value: 501 },
  ...Array.from({ length: 19 }, (_, index) => ({ label: String((index + 1) * 5), value: 500 + (index + 1) * 5 })),
  { label: '99', value: 599 },
]

export const weekdayOptions: { label: string; value: WeekdayKey }[] = [
  { label: 'Mo', value: 'week_monday' },
  { label: 'Tu', value: 'week_tuesday' },
  { label: 'We', value: 'week_wednesday' },
  { label: 'Th', value: 'week_thursday' },
  { label: 'Fr', value: 'week_friday' },
  { label: 'Sa', value: 'week_saturday' },
  { label: 'Su', value: 'week_sunday' },
]

export const allWeekdays: WeekdayKey[] = weekdayOptions.map((option) => option.value)
/** The "Weekdays" shortcut: Mo–Fr (§8). */
export const workWeekdays: WeekdayKey[] = allWeekdays.slice(0, 5)

export const monthOptions: { label: string; value: MonthKey }[] = [
  { label: 'January', value: 'month_january' },
  { label: 'February', value: 'month_february' },
  { label: 'March', value: 'month_march' },
  { label: 'April', value: 'month_april' },
  { label: 'May', value: 'month_may' },
  { label: 'June', value: 'month_june' },
  { label: 'July', value: 'month_july' },
  { label: 'August', value: 'month_august' },
  { label: 'September', value: 'month_september' },
  { label: 'October', value: 'month_october' },
  { label: 'November', value: 'month_november' },
  { label: 'December', value: 'month_december' },
]

export const monthDayOptions = Array.from({ length: 31 }, (_, index) => ({ label: String(index + 1), value: index + 1 }))

/** The browser's IANA time zone — Axion's per-group default (§8). */
export const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

/** `Intl.supportedValuesOf` is ES2022; the app's lib is ES2020, so it's feature-detected. */
const intlWithSupportedValues = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }

/**
 * The full IANA time-zone list (Axion's `timeZoneOptions`, §2/§8), from the runtime. The browser's
 * own zone is always included — some engines report an alias (e.g. `Asia/Calcutta`) the list omits.
 */
export const getTimeZoneOptions = () => {
  const zones = intlWithSupportedValues.supportedValuesOf?.('timeZone') ?? ['UTC']
  const browserZone = getBrowserTimeZone()
  const all = zones.includes(browserZone) ? zones : [browserZone, ...zones]
  return all.map((zone) => ({ label: zone, value: zone }))
}

/** The first order value not already used by the main order or another group (Axion's `newGroupOrder`, §8). */
export const nextGroupOrder = (usedOrders: (number | undefined)[]) =>
  orderOptions.find((option) => !usedOrders.includes(option.value))?.value ?? orderOptions[0].value

/** A new time range with Axion's defaults (§8): Full Day on, browser time zone, current year. */
export const newTimeGroupRange = (order: number): TimeGroupRangeFormValues => ({
  order,
  full_day: true,
  time_from: fullDayTimeFrom,
  time_to: fullDayTimeTo,
  time_zone: getBrowserTimeZone(),
  weekdays: [],
  advance_settings: false,
  apply_on_all_years: false,
  year: [new Date().getFullYear()],
  months: [],
  month_days: [],
})

/**
 * Add-mode defaults (§3 Create): the domain, context mirroring it, and — a PepperPBX convenience —
 * one time range so the form is never empty (Axion starts with none).
 */
export const getDefaultTimeGroupFormValues = (domainName: string): TimeGroupFormValues => ({
  name: '',
  domain_name: domainName,
  order: undefined,
  context: domainName,
  description: undefined,
  groups: [newTimeGroupRange(nextGroupOrder([]))],
})
