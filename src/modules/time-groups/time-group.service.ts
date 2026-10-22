import {
  allWeekdays,
  allYearsSentinel,
  defaultPageSize,
  fullDayTimeFrom,
  fullDayTimeTo,
  monthDayOptions,
  monthOptions,
  searchableTimeGroupFields,
  workWeekdays,
} from './time-group.constants'
import { mockTimeGroupHiveDetails, mockTimeGroups as seedTimeGroups } from './time-group.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  MonthDayKey,
  TimeGroup,
  TimeGroupDetails,
  TimeGroupFormValues,
  TimeGroupHiveDetails,
  TimeGroupListParams,
  TimeGroupListResponse,
  TimeGroupRangeFormValues,
  TimeGroupRangeRecord,
  TimeGroupRecord,
} from './time-group.types'

/**
 * Mock implementation of the Time Groups API boundary. Each function mirrors one Axion endpoint
 * (`timeGroupEndpoints` in time-group.constants.ts) with a Promise-based signature, so connecting
 * the real backend means replacing these bodies with `request.*` calls through
 * services/api/apiClient.ts — no page or component changes. BACKEND CONTRACT REQUIRED: none of
 * these shapes are confirmed for PepperPBX.
 *
 * The working copy is private to this service and resets on a full page reload.
 */
const cloneRecord = (record: TimeGroupRecord): TimeGroupRecord => ({
  ...record,
  groups: record.groups.map((group) => ({ ...group })),
})

let timeGroups: TimeGroupRecord[] = seedTimeGroups.map(cloneRecord)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Time group ${uuid} not found.` })

const fallbackDomain = () => Object.keys(mockTimeGroupHiveDetails)[0]

const monthDayKey = (day: number): MonthDayKey => `day_${day}`

const toListItem = (record: TimeGroupRecord): TimeGroup => ({
  dialplan_uuid: record.dialplan_uuid,
  domain_name: record.domain_name,
  dialplan_name: record.name,
  dialplan_context: record.context,
  dialplan_order: record.order,
  dialplan_description: record.description,
})

/**
 * Year string → form years (§27). Accepts a single year or a comma-joined list; anything else is
 * dropped. Axion's picker assumed a `"start - end"` string the rest of its code never produced
 * (§28) — PepperPBX parses what is actually stored.
 */
const parseYears = (year: string): number[] =>
  year
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isInteger(value) && value > 0)

/**
 * API range → form range. The saved `apply_on_all_years` is respected — Axion force-set it to true
 * on every load (§28/§33).
 */
const toRangeFormValues = (range: TimeGroupRangeRecord): TimeGroupRangeFormValues => ({
  order: range.order,
  full_day: range.full_day,
  time_from: range.full_day ? fullDayTimeFrom : range.time_from,
  time_to: range.full_day ? fullDayTimeTo : range.time_to,
  time_zone: range.time_zone,
  weekdays: allWeekdays.filter((day) => range[day]),
  advance_settings: range.advance_settings,
  apply_on_all_years: range.apply_on_all_years,
  year: parseYears(range.year),
  months: monthOptions.map((option) => option.value).filter((month) => range[month]),
  month_days: monthDayOptions.map((option) => option.value).filter((day) => range[monthDayKey(day)]),
})

/**
 * Form range → API range (Axion's `TimeGroupForm.onSubmit`, §3 Create step 4 / §27): full-day times
 * forced, year comma-joined (`[currentYear, 2099]` when Apply on All Years), the derived All Days /
 * Weekdays flags computed from the individual days.
 */
const toRangeRecord = (values: TimeGroupRangeFormValues): TimeGroupRangeRecord => {
  const weekdays = values.weekdays ?? []
  const months = values.months ?? []
  const monthDays = values.month_days ?? []
  const currentYear = new Date().getFullYear()
  const selectedYears = values.year ?? []
  // No year chosen → the current year, as Axion's submit falls back to it (time-groups.md §27).
  const years = values.apply_on_all_years
    ? [currentYear, allYearsSentinel]
    : selectedYears.length > 0
      ? selectedYears
      : [currentYear]
  const range = {
    order: Number(values.order),
    full_day: values.full_day,
    time_from: values.full_day ? fullDayTimeFrom : values.time_from,
    time_to: values.full_day ? fullDayTimeTo : values.time_to,
    time_zone: values.time_zone,
    enabled_all_days: allWeekdays.every((day) => weekdays.includes(day)),
    enabled_week_days: weekdays.length === workWeekdays.length && workWeekdays.every((day) => weekdays.includes(day)),
    advance_settings: values.advance_settings,
    apply_on_all_years: values.apply_on_all_years,
    year: [...years].sort((a, b) => a - b).join(','),
    ...Object.fromEntries(allWeekdays.map((day) => [day, weekdays.includes(day)])),
    ...Object.fromEntries(monthOptions.map(({ value }) => [value, months.includes(value)])),
    ...Object.fromEntries(monthDayOptions.map(({ value }) => [monthDayKey(value), monthDays.includes(value)])),
  }
  return range as TimeGroupRangeRecord
}

const toDetails = (record: TimeGroupRecord): TimeGroupDetails => ({
  dialplan_uuid: record.dialplan_uuid,
  name: record.name,
  domain_name: record.domain_name,
  order: record.order ?? undefined,
  context: record.context,
  description: record.description || undefined,
  enabled: record.enabled,
  groups: record.groups.map(toRangeFormValues),
})

/** Create/update payload → stored record. `context` always mirrors the domain (§9/§26). */
const toRecord = (values: TimeGroupFormValues, uuid: string, existing?: TimeGroupRecord): TimeGroupRecord => ({
  dialplan_uuid: uuid,
  name: values.name,
  domain_name: values.domain_name,
  order: values.order === undefined || values.order === null ? null : Number(values.order),
  context: values.domain_name,
  description: values.description ?? '',
  // New time groups are created disabled; no UI edits the flag (§26).
  enabled: existing?.enabled ?? false,
  groups: (values.groups ?? []).map(toRangeRecord),
})

/**
 * The list's default domain scope: the shared current-domain store, else the mock default. The
 * store is shared and persisted, so it can hold a domain this mock has no data for — scope to the
 * mock default then, rather than returning an empty list. Also used by the Presets service, which
 * shares this domain model.
 */
export const getCurrentDomainName = (): string => {
  const storedDomain = useDomainStore.getState().currentDomain?.name
  return storedDomain && storedDomain in mockTimeGroupHiveDetails
    ? storedDomain
    : mockTimeGroupHiveDetails[fallbackDomain()].defaultDomain
}

/**
 * GET /api/timeGroups/list?pageSize=&pageNumber=&showAll=&search= (§3/§12). Domain-scoped unless
 * `showAll`; the mock emulates server-side search and paging, and clamps an out-of-range page
 * (Axion resets to page 1 when a page comes back empty, §3).
 * TODO (backend): how the real list is scoped to the current domain is unconfirmed.
 */
export const getTimeGroups = async (params: TimeGroupListParams = {}): Promise<TimeGroupListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params
  const needle = search.trim().toLowerCase()
  const currentDomain = getCurrentDomainName()

  const filtered = timeGroups
    .map(toListItem)
    .filter((item) => showAll || item.domain_name === currentDomain)
    .filter(
      (item) =>
        !needle ||
        searchableTimeGroupFields.some((field) => {
          const value = item[field]
          return typeof value === 'string' && value.toLowerCase().includes(needle)
        })
    )

  const total_records = filtered.length
  const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
  const safePage = Math.min(Math.max(1, page), total_pages)

  return {
    data: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageSize,
    total_records,
    total_pages,
    wildCardDomains: [...(mockTimeGroupHiveDetails[currentDomain]?.domainOptions ?? Object.keys(mockTimeGroupHiveDetails))],
  }
}

/** GET /api/timeGroups/details/:uuid (§12). Unknown id → 404 ApiError. */
export const getTimeGroupById = async (uuid: string): Promise<TimeGroupDetails> => {
  await delay(300)
  const found = timeGroups.find((item) => item.dialplan_uuid === uuid)
  if (!found) throw notFoundError(uuid)
  return toDetails(cloneRecord(found))
}

/**
 * GET /api/hiveuser/details?module=TimeGroup&domain_name= (§3/§12) — domain options and default.
 * Also seeds the shared domain store (available domains; current domain only if none is set yet),
 * as every sibling module's mock does.
 */
export const getHiveTimeGroupDetails = async (domainName?: string): Promise<TimeGroupHiveDetails> => {
  await delay(300)
  const hive = mockTimeGroupHiveDetails[domainName ?? ''] ?? mockTimeGroupHiveDetails[fallbackDomain()]

  const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
  setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
  if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })

  return { ...hive, domainOptions: [...hive.domainOptions] }
}

/** POST /api/timeGroups/create — resolves to the new `dialplan_uuid` (§11/§12). */
export const createTimeGroup = async (values: TimeGroupFormValues): Promise<string> => {
  await delay(300)
  const uuid = `tg-${Date.now()}`
  timeGroups = [...timeGroups, toRecord(values, uuid)]
  return uuid
}

/**
 * PATCH /api/timeGroups/update/:id (§3/§11). The domain can't change after creation (§15), so the
 * stored domain always wins.
 */
export const updateTimeGroup = async (uuid: string, values: TimeGroupFormValues): Promise<void> => {
  await delay(300)
  const existing = timeGroups.find((item) => item.dialplan_uuid === uuid)
  if (!existing) throw notFoundError(uuid)
  const updated = toRecord({ ...values, domain_name: existing.domain_name }, uuid, existing)
  timeGroups = timeGroups.map((item) => (item.dialplan_uuid === uuid ? updated : item))
}

/** DELETE /api/timeGroups/delete — body `{ dialplan_uuids }` (§11/§12). Single-row and bulk. */
export const deleteTimeGroups = async (uuids: string[]): Promise<void> => {
  await delay(300)
  const payload = { dialplan_uuids: uuids }
  timeGroups = timeGroups.filter((item) => !payload.dialplan_uuids.includes(item.dialplan_uuid))
}

/**
 * PATCH /api/timeGroups/copy — `{ dialplan_copy: [{ dialplan_uuids, name }] }` (§3 Copy/§11). Axion
 * also sends `extension: undefined` because its extension field is commented out (§28); PepperPBX
 * omits it. The copy keeps the source's domain, order and every time range.
 */
export const copyTimeGroup = async (sourceUuid: string, name: string): Promise<string> => {
  await delay(300)
  const payload = { dialplan_copy: [{ dialplan_uuids: sourceUuid, name }] }
  const source = timeGroups.find((item) => item.dialplan_uuid === payload.dialplan_copy[0].dialplan_uuids)
  if (!source) throw notFoundError(sourceUuid)
  const uuid = `tg-${Date.now()}`
  timeGroups = [...timeGroups, { ...cloneRecord(source), dialplan_uuid: uuid, name: payload.dialplan_copy[0].name }]
  return uuid
}
