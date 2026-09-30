import { defaultPageSize, searchableCallFlowFields } from './call-flows.constants'
import {
  mockCallFlowHiveDetails,
  mockCallFlows as seedCallFlows,
  mockDestinationOptionsByDomain,
  mockSoundOptionsByDomain,
} from './call-flows.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  CallFlow,
  CallFlowCopyPayload,
  CallFlowDestinationOption,
  CallFlowDetails,
  CallFlowDetailsResponse,
  CallFlowFormValues,
  CallFlowHiveDetails,
  CallFlowListParams,
  CallFlowListResponse,
  CallFlowRecord,
  CallFlowSoundOption,
  CallFlowToggleKey,
  CallFlowTogglePayload,
  WireBoolean,
} from './call-flows.types'

/**
 * Mock implementation of the Call Flows API boundary. Each function mirrors one Axion endpoint
 * (`callFlowEndpoints` in call-flows.constants.ts) with a Promise-based signature, so connecting
 * the real backend means replacing these bodies with `request.*` calls through
 * services/api/apiClient.ts — no page or component changes. BACKEND CONTRACT REQUIRED: none of
 * these shapes are confirmed for PepperPBX.
 *
 * Booleans: everything outside this file uses real booleans. The records below are stored in
 * Axion's wire form (`'true'`/`'false'` on write, §11/§27) and normalized on every read.
 *
 * The working copy is private to this service and resets on a full page reload.
 */
let callFlows: CallFlowRecord[] = seedCallFlows.map((record) => ({ ...record }))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Call flow ${uuid} not found.` })

const fromWireBoolean = (value: WireBoolean): boolean => value === true || value === 'true'
/** Axion stringifies both flags on create/update (§3/§27). TODO: drop if the backend takes real booleans. */
const toWireBoolean = (value: boolean): WireBoolean => (value ? 'true' : 'false')

const trimOrUndefined = (value?: string) => value?.trim() || undefined

/** Wire record → normalized details (boolean flags, trimmed description — §3 Edit / §27). */
const toDetails = (record: CallFlowRecord): CallFlowDetails => ({
  ...record,
  call_flow_description: trimOrUndefined(record.call_flow_description),
  call_flow_enabled: fromWireBoolean(record.call_flow_enabled),
  call_flow_status: fromWireBoolean(record.call_flow_status),
})

const toListItem = (details: CallFlowDetails): CallFlow => ({
  call_flow_uuid: details.call_flow_uuid,
  domain_name: details.domain_name,
  call_flow_name: details.call_flow_name,
  call_flow_extension: details.call_flow_extension,
  call_flow_feature_code: details.call_flow_feature_code,
  call_flow_context: details.call_flow_context,
  call_flow_status: details.call_flow_status,
  call_flow_enabled: details.call_flow_enabled,
  call_flow_description: details.call_flow_description,
})

/**
 * Form values → wire record. `call_flow_context` is always the record's domain (§15/§26/§27);
 * optional fields left blank are omitted.
 */
const toRecord = (values: CallFlowFormValues, uuid: string, existing?: CallFlowRecord): CallFlowRecord => ({
  call_flow_uuid: uuid,
  domain_name: values.domain_name,
  call_flow_context: values.domain_name,
  call_flow_name: values.call_flow_name,
  call_flow_extension: values.call_flow_extension,
  call_flow_feature_code: values.call_flow_feature_code,
  call_flow_pin_number: values.call_flow_pin_number || undefined,
  call_flow_data: values.call_flow_data,
  call_flow_label: values.call_flow_label,
  call_flow_sound: values.call_flow_sound || undefined,
  call_flow_alternate_data: values.call_flow_alternate_data,
  call_flow_alternate_label: values.call_flow_alternate_label,
  call_flow_alternate_sound: values.call_flow_alternate_sound || undefined,
  call_flow_description: trimOrUndefined(values.call_flow_description),
  call_flow_enabled: toWireBoolean(values.call_flow_enabled),
  call_flow_status: toWireBoolean(values.call_flow_status),
  // Axion echoes these back on update (§11); they are server-owned.
  dialplan_uuid: existing?.dialplan_uuid,
  domain_uuid: existing?.domain_uuid,
})

/** The list's default domain scope: the shared current-domain store, else the mock default. */
const getCurrentDomainName = (): string =>
  useDomainStore.getState().currentDomain?.name ?? mockCallFlowHiveDetails[Object.keys(mockCallFlowHiveDetails)[0]].defaultDomain

/**
 * GET /api/callFlows/list?pageSize=&pageNumber=&showAll=&search= (§12). Domain-scoped unless
 * `showAll`; the mock emulates server-side search and paging, and clamps an out-of-range page.
 * TODO (backend): how the real list is scoped to the current domain is unconfirmed.
 */
export const getCallFlows = async (params: CallFlowListParams = {}): Promise<CallFlowListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params
  const needle = search.trim().toLowerCase()
  const currentDomain = getCurrentDomainName()

  const filtered = callFlows
    .map((record) => toListItem(toDetails(record)))
    .filter((flow) => showAll || flow.domain_name === currentDomain)
    .filter(
      (flow) =>
        !needle ||
        searchableCallFlowFields.some((field) => {
          const value = flow[field]
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
    wildCardDomains: [...mockCallFlowHiveDetails[currentDomain]?.domainOptions ?? Object.keys(mockCallFlowHiveDetails)],
  }
}

/** GET /api/callFlows/details?call_flow_uuid= — `data.data[0]` is the record (§12/§13). Unknown id → 404 ApiError. */
export const getCallFlowById = async (uuid: string): Promise<CallFlowDetails> => {
  await delay(300)
  const record = callFlows.find((item) => item.call_flow_uuid === uuid)
  if (!record) throw notFoundError(uuid)
  const response: CallFlowDetailsResponse = { data: [{ ...record }] }
  return toDetails(response.data[0])
}

/**
 * GET /api/hiveuser/details?module=CallFlows&domain_name= (§3/§12) — domain options, `autoExt` and
 * extension range for one domain. Always called with an explicit domain once one is known. Also
 * seeds the shared domain store (available domains; current domain only if none is set yet), as
 * every sibling module's mock does.
 */
export const getHiveCallFlowDetails = async (domainName?: string): Promise<CallFlowHiveDetails> => {
  await delay(300)
  const fallbackKey = Object.keys(mockCallFlowHiveDetails)[0]
  const hive = mockCallFlowHiveDetails[domainName ?? ''] ?? mockCallFlowHiveDetails[fallbackKey]

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

const domainScoped = <T>(byDomain: Record<string, T[]>, domainName: string): T[] => [...(byDomain[domainName] ?? [])]

/** GET /api/callFlows/destinationDropdown?domain_name= (§12) — grouped options. */
export const getDestinationOptions = async (domainName: string): Promise<CallFlowDestinationOption[]> => {
  await delay(250)
  return domainScoped(mockDestinationOptionsByDomain, domainName)
}

/** GET /api/callFlows/soundDropDown?domain_name= (§12) — grouped options. */
export const getSoundOptions = async (domainName: string): Promise<CallFlowSoundOption[]> => {
  await delay(250)
  return domainScoped(mockSoundOptionsByDomain, domainName)
}

/** POST /api/callFlows/create — resolves to the new uuid (`data[0].call_flow_uuid`, §12). */
export const createCallFlow = async (values: CallFlowFormValues): Promise<string> => {
  await delay(300)
  const uuid = `cf-${Date.now()}`
  callFlows = [...callFlows, toRecord(values, uuid)]
  return uuid
}

/**
 * PATCH /api/callFlows/update — form payload + `call_flow_uuid`, `dialplan_uuid`, `domain_uuid`
 * (§3/§11). The domain can't change after creation (§15), so the stored domain always wins.
 */
export const updateCallFlow = async (uuid: string, values: CallFlowFormValues): Promise<void> => {
  await delay(300)
  const existing = callFlows.find((item) => item.call_flow_uuid === uuid)
  if (!existing) throw notFoundError(uuid)
  const updated = toRecord({ ...values, domain_name: existing.domain_name }, uuid, existing)
  callFlows = callFlows.map((item) => (item.call_flow_uuid === uuid ? updated : item))
}

/** DELETE /api/callFlows/delete — body `{ uuids }` (§11/§12). Single-row and bulk. */
export const deleteCallFlows = async (uuids: string[]): Promise<void> => {
  await delay(300)
  callFlows = callFlows.filter((item) => !uuids.includes(item.call_flow_uuid))
}

/**
 * PATCH /api/callFlows/copy — `{ copyCallFlowsData: [{ uuid, name, extension, featureCode }] }`
 * (§11/§12). The copy stays in the source record's domain (§15).
 */
export const copyCallFlow = async (sourceUuid: string, values: { name: string; extension: string; featureCode: string }): Promise<void> => {
  await delay(300)
  const payload: CallFlowCopyPayload = { copyCallFlowsData: [{ uuid: sourceUuid, ...values }] }
  const [entry] = payload.copyCallFlowsData
  const source = callFlows.find((item) => item.call_flow_uuid === entry.uuid)
  if (!source) throw notFoundError(entry.uuid)
  const uuid = `cf-copy-${Date.now()}`
  callFlows = [
    ...callFlows,
    {
      ...source,
      call_flow_uuid: uuid,
      call_flow_name: entry.name,
      call_flow_extension: entry.extension,
      call_flow_feature_code: entry.featureCode,
      dialplan_uuid: `dp-${uuid}`,
    },
  ]
}

/**
 * PATCH /api/callFlows/toggle — `{ toggleArray, toggleKey }` (§11/§12). Flips the named flag on
 * each record; backs both the row badges (one uuid, no confirmation) and bulk Toggle.
 */
export const toggleCallFlows = async (uuids: string[], toggleKey: CallFlowToggleKey): Promise<void> => {
  await delay(200)
  const payload: CallFlowTogglePayload = { toggleArray: uuids, toggleKey }
  callFlows = callFlows.map((item) =>
    payload.toggleArray.includes(item.call_flow_uuid)
      ? { ...item, [payload.toggleKey]: toWireBoolean(!fromWireBoolean(item[payload.toggleKey])) }
      : item
  )
}
