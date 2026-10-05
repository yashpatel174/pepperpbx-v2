import { defaultPageSize, searchableTimeConditionFields } from './time-condition.constants'
import {
  mockTimeConditionHiveDetails,
  mockTimeConditions as seedTimeConditions,
  mockTimeGroupPresetsByDomain,
} from './time-condition.mock'
import { getActionOptions } from '../dialplans/destinations/destination.service'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  TimeCondition,
  TimeConditionDestinationOption,
  TimeConditionDetails,
  TimeConditionDetailsRecord,
  TimeConditionFormValues,
  TimeConditionHiveDetails,
  TimeConditionListParams,
  TimeConditionListResponse,
  TimeGroupOption,
} from './time-condition.types'

/**
 * Mock implementation of the Time Conditions API boundary. Each function mirrors one Axion endpoint
 * (`timeConditionEndpoints` in time-condition.constants.ts) with a Promise-based signature, so
 * connecting the real backend means replacing these bodies with `request.*` calls through
 * services/api/apiClient.ts — no page or component changes. BACKEND CONTRACT REQUIRED: none of
 * these shapes are confirmed for PepperPBX.
 *
 * The working copy is private to this service and resets on a full page reload.
 */
let timeConditions: TimeConditionDetailsRecord[] = seedTimeConditions.map((record) => ({ ...record }))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Time condition ${uuid} not found.` })

const fallbackDomain = () => Object.keys(mockTimeConditionHiveDetails)[0]

/** Emulates the server-side join behind the list's Time Group (`dialplan_name`) and Preset (`name`) columns (§26). */
const findPreset = (record: TimeConditionDetailsRecord) =>
  mockTimeGroupPresetsByDomain[record.domain_name]?.find((preset) => preset.uuid === record.time_condition_time_group_uuid)

const toListItem = (record: TimeConditionDetailsRecord): TimeCondition => {
  const preset = findPreset(record)
  return {
    time_condition_uuid: record.time_condition_uuid,
    domain_name: record.domain_name,
    time_condition_name: record.time_condition_name,
    time_condition_extension: record.time_condition_extension,
    dialplan_name: preset?.timeGroup ?? '',
    name: preset?.preset ?? '',
    time_condition_enabled: record.enabled,
    timeMatchAction: record.time_match_action,
    timeNotMatchAction: record.time_not_match_action,
    default: record.default,
  }
}

/**
 * Detail payload → form-shaped details. The one place the API's `time_condition_time_group_uuid`
 * becomes the form's `time_condition_time_group_preset_uuid` (§27/§33).
 */
const toDetails = ({ time_condition_time_group_uuid, ...record }: TimeConditionDetailsRecord): TimeConditionDetails => ({
  ...record,
  time_condition_time_group_preset_uuid: time_condition_time_group_uuid,
})

/**
 * Create/update payload → the stored detail record. The payload keeps Axion's
 * `time_condition_time_group_preset_uuid` key; the mock "backend" stores it under the detail key.
 */
const toRecord = (
  values: TimeConditionFormValues,
  uuid: string,
  existing?: TimeConditionDetailsRecord
): TimeConditionDetailsRecord => ({
  time_condition_uuid: uuid,
  domain_name: values.domain_name,
  time_condition_name: values.time_condition_name,
  time_condition_extension: values.time_condition_extension,
  time_condition_time_group_uuid: values.time_condition_time_group_preset_uuid,
  time_match_action: values.time_match_action,
  time_not_match_action: values.time_not_match_action,
  enabled: values.enabled,
  default: existing?.default ?? false,
})

/**
 * The list's default domain scope: the shared current-domain store, else the mock default. The store
 * is shared and persisted, so it can hold a domain this mock has no data for — scope to the mock
 * default then, rather than returning an empty list.
 */
const getCurrentDomainName = (): string => {
  const storedDomain = useDomainStore.getState().currentDomain?.name
  return storedDomain && storedDomain in mockTimeConditionHiveDetails
    ? storedDomain
    : mockTimeConditionHiveDetails[fallbackDomain()].defaultDomain
}

/**
 * GET /api/timeCondition/list?pageSize=&pageNumber=&search=&showAll= (§3/§12). Domain-scoped unless
 * `showAll`; the mock emulates server-side search and paging, and clamps an out-of-range page (Axion
 * resets to page 1 when a page comes back empty, §3).
 * TODO (backend): how the real list is scoped to the current domain is unconfirmed.
 */
export const getTimeConditions = async (params: TimeConditionListParams = {}): Promise<TimeConditionListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params
  const needle = search.trim().toLowerCase()
  const currentDomain = getCurrentDomainName()

  const filtered = timeConditions
    .map(toListItem)
    .filter((item) => showAll || item.domain_name === currentDomain)
    .filter(
      (item) =>
        !needle ||
        searchableTimeConditionFields.some((field) => {
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
    wildCardDomains: [...(mockTimeConditionHiveDetails[currentDomain]?.domainOptions ?? Object.keys(mockTimeConditionHiveDetails))],
  }
}

/** GET /api/timeCondition/details?time_condition_uuid= — `data.data` (§12/§13). Unknown id → 404 ApiError. */
export const getTimeConditionById = async (uuid: string): Promise<TimeConditionDetails> => {
  await delay(300)
  const record = timeConditions.find((item) => item.time_condition_uuid === uuid)
  if (!record) throw notFoundError(uuid)
  return toDetails({ ...record })
}

/**
 * GET /api/hiveuser/details?module=TimeCondition&domain_name= (§3/§12) — domain options, `autoExt`
 * and extension range for one domain. Also seeds the shared domain store (available domains;
 * current domain only if none is set yet), as every sibling module's mock does.
 */
export const getHiveTimeConditionDetails = async (domainName?: string): Promise<TimeConditionHiveDetails> => {
  await delay(300)
  const hive = mockTimeConditionHiveDetails[domainName ?? ''] ?? mockTimeConditionHiveDetails[fallbackDomain()]

  const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
  setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
  if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })

  return {
    ...hive,
    domainOptions: [...hive.domainOptions],
    excludeExt: [...hive.excludeExt],
    additionalExtExclude: [...hive.additionalExtExclude],
  }
}

/** GET /api/timeCondition/timeGroup/dropdown?domain_name= (§12) — this module's own preset dropdown (§30). */
export const getTimeGroupOptions = async (domainName: string): Promise<TimeGroupOption[]> => {
  await delay(250)
  return (mockTimeGroupPresetsByDomain[domainName] ?? []).map((preset) => ({
    label: `${preset.timeGroup} - ${preset.preset}`,
    value: preset.uuid,
  }))
}

/**
 * GET api/destinations/list/actions?domain_name= — delegated to the Destinations module's service,
 * exactly as Axion imports `getActionOptions` from its destinations module (§12/§30).
 */
export const getDestinationActionOptions = (domainName: string): Promise<TimeConditionDestinationOption[]> =>
  getActionOptions(domainName)

/** POST /api/timeCondition/create — resolves to the new `time_condition_uuid` (§11/§12). */
export const createTimeCondition = async (values: TimeConditionFormValues): Promise<string> => {
  await delay(300)
  const uuid = `tc-${Date.now()}`
  timeConditions = [...timeConditions, toRecord(values, uuid)]
  return uuid
}

/**
 * PATCH /api/timeCondition/update — form payload + `time_condition_uuid` (§3/§11). The domain can't
 * change after creation (§15), so the stored domain always wins.
 */
export const updateTimeCondition = async (uuid: string, values: TimeConditionFormValues): Promise<void> => {
  await delay(300)
  const existing = timeConditions.find((item) => item.time_condition_uuid === uuid)
  if (!existing) throw notFoundError(uuid)
  const updated = toRecord({ ...values, domain_name: existing.domain_name }, uuid, existing)
  timeConditions = timeConditions.map((item) => (item.time_condition_uuid === uuid ? updated : item))
}

/** DELETE /api/timeCondition/delete — body `{ time_condition_uuids }` (§11/§12). Single-row and bulk. */
export const deleteTimeConditions = async (uuids: string[]): Promise<void> => {
  await delay(300)
  const payload = { time_condition_uuids: uuids }
  timeConditions = timeConditions.filter((item) => !payload.time_condition_uuids.includes(item.time_condition_uuid))
}

/**
 * PATCH /api/timeCondition/toggle — `{ time_condition_uuids }` (§11/§12). Flips each record's
 * enabled flag. Only the row Status pill calls it, always with one uuid — there is no bulk toggle (§3).
 */
export const toggleTimeConditions = async (uuids: string[]): Promise<void> => {
  await delay(200)
  const payload = { time_condition_uuids: uuids }
  timeConditions = timeConditions.map((item) =>
    payload.time_condition_uuids.includes(item.time_condition_uuid) ? { ...item, enabled: !item.enabled } : item
  )
}
