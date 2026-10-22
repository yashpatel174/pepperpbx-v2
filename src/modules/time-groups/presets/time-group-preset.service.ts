import { defaultPageSize, fullDayTimeFrom, fullDayTimeTo } from '../time-group.constants'
import { mockTimeGroupHiveDetails } from '../time-group.mock'
import { getCurrentDomainName } from '../time-group.service'
import { festivalFlags, searchablePresetFields } from './time-group-preset.constants'
import { mockTimeGroupPresets as seedPresets } from './time-group-preset.mock'
import type { ApiError } from '../../../services/api/apiError'
import type {
  PresetFestival,
  TimeGroupPreset,
  TimeGroupPresetDetails,
  TimeGroupPresetFormValues,
  TimeGroupPresetListParams,
  TimeGroupPresetListResponse,
  TimeGroupPresetRecord,
} from './time-group-preset.types'

/**
 * Mock implementation of the Time Group Presets API boundary (`PRESET.*`, time-groups.md §12). Each
 * function mirrors one Axion endpoint (`presetEndpoints`) with a Promise-based signature, so
 * connecting the real backend means replacing these bodies with `request.*` calls — no page or
 * component changes. Domain scoping and the Add/Edit bootstrap are the Time Groups ones
 * (`getCurrentDomainName`, `getHiveTimeGroupDetails`), as in Axion. BACKEND CONTRACT REQUIRED.
 *
 * The working copy is private to this service and resets on a full page reload.
 */
const cloneRecord = (record: TimeGroupPresetRecord): TimeGroupPresetRecord => ({
  ...record,
  festivals: record.festivals.map((item) => ({ ...item })),
})

let presets: TimeGroupPresetRecord[] = seedPresets.map(cloneRecord)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Preset ${uuid} not found.` })

const toListItem = (record: TimeGroupPresetRecord): TimeGroupPreset => ({
  preset_uuid: record.preset_uuid,
  domain_name: record.domain_name,
  name: record.name,
  enable: record.enable,
  description: record.description,
})

/** Full-day festivals always carry 12:00 AM – 11:59 PM (Axion's `onSubmit`). */
const normalizeFestival = (item: PresetFestival): PresetFestival => ({
  ...item,
  time_from: item.full_day ? fullDayTimeFrom : item.time_from,
  time_to: item.full_day ? fullDayTimeTo : item.time_to,
})

const toDetails = (record: TimeGroupPresetRecord): TimeGroupPresetDetails => ({
  preset_uuid: record.preset_uuid,
  name: record.name,
  domain_name: record.domain_name,
  description: record.description || undefined,
  enable: record.enable,
  festivals: record.festivals.map(normalizeFestival),
})

/**
 * Create/update payload → stored record: festivals normalized and the per-holiday flags derived.
 * Unlike Axion's Edit, `false` values aren't stripped from the payload — that dropped e.g.
 * `full_day: false`.
 */
const toRecord = (values: TimeGroupPresetFormValues, uuid: string, enable: boolean): TimeGroupPresetRecord => {
  const festivals = (values.festivals ?? []).map(normalizeFestival)
  return {
    ...festivalFlags(festivals),
    preset_uuid: uuid,
    name: values.name,
    domain_name: values.domain_name,
    description: values.description ?? '',
    enable,
    festivals,
  }
}

/**
 * GET /api/presets/list?pageSize=&pageNumber=&showAll=&search= (§12). Domain-scoped unless
 * `showAll`; the mock emulates server-side search and paging, and clamps an out-of-range page.
 * TODO (backend): how the real list is scoped to the current domain is unconfirmed.
 */
export const getTimeGroupPresets = async (params: TimeGroupPresetListParams = {}): Promise<TimeGroupPresetListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params
  const needle = search.trim().toLowerCase()
  const currentDomain = getCurrentDomainName()

  const filtered = presets
    .map(toListItem)
    .filter((item) => showAll || item.domain_name === currentDomain)
    .filter(
      (item) =>
        !needle ||
        searchablePresetFields.some((field) => {
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

/**
 * GET /api/presets/details/:uuid?domain_name= (§12). Axion passes the current domain; the mock looks
 * the record up by uuid alone. Unknown id → 404 ApiError.
 */
export const getTimeGroupPresetById = async (uuid: string): Promise<TimeGroupPresetDetails> => {
  await delay(300)
  const found = presets.find((item) => item.preset_uuid === uuid)
  if (!found) throw notFoundError(uuid)
  return toDetails(cloneRecord(found))
}

/**
 * POST /api/presets/create — resolves to the new `preset_uuid` (§12). Axion's Add seeds
 * `enabled: true`.
 * TODO (backend): Axion seeds `enabled` while the list/details read `enable`; which key the backend
 * honours is unconfirmed. The mock creates presets enabled.
 */
export const createTimeGroupPreset = async (values: TimeGroupPresetFormValues): Promise<string> => {
  await delay(300)
  const uuid = `tgp-${Date.now()}`
  presets = [...presets, toRecord(values, uuid, true)]
  return uuid
}

/** PATCH /api/presets/update/:id (§12). The domain can't change after creation, so the stored one wins. */
export const updateTimeGroupPreset = async (uuid: string, values: TimeGroupPresetFormValues): Promise<void> => {
  await delay(300)
  const existing = presets.find((item) => item.preset_uuid === uuid)
  if (!existing) throw notFoundError(uuid)
  const updated = toRecord({ ...values, domain_name: existing.domain_name }, uuid, existing.enable)
  presets = presets.map((item) => (item.preset_uuid === uuid ? updated : item))
}

/** DELETE /api/presets/delete — body `{ preset_uuids }` (§12). Single-row and bulk. */
export const deleteTimeGroupPresets = async (uuids: string[]): Promise<void> => {
  await delay(300)
  const payload = { preset_uuids: uuids }
  presets = presets.filter((item) => !payload.preset_uuids.includes(item.preset_uuid))
}

/** PATCH /api/presets/toggle — `{ preset_uuids }` (§12). Flips each preset's `enable`. Row pill and bulk. */
export const toggleTimeGroupPresets = async (uuids: string[]): Promise<void> => {
  await delay(200)
  const payload = { preset_uuids: uuids }
  presets = presets.map((item) => (payload.preset_uuids.includes(item.preset_uuid) ? { ...item, enable: !item.enable } : item))
}

/**
 * PATCH /api/presets/copy — `{ preset_copy: [{ preset_uuids, name }] }` (§12). Axion also sends
 * `extension: undefined` (its field is commented out); PepperPBX omits it. The copy keeps the
 * source's domain, status and holidays.
 */
export const copyTimeGroupPreset = async (sourceUuid: string, name: string): Promise<string> => {
  await delay(300)
  const payload = { preset_copy: [{ preset_uuids: sourceUuid, name }] }
  const source = presets.find((item) => item.preset_uuid === payload.preset_copy[0].preset_uuids)
  if (!source) throw notFoundError(sourceUuid)
  const uuid = `tgp-${Date.now()}`
  presets = [...presets, { ...cloneRecord(source), preset_uuid: uuid, name: payload.preset_copy[0].name }]
  return uuid
}
