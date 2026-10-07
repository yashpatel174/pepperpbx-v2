import { defaultPageSize, searchableConferenceCenterFields } from './conference-center.constants'
import {
  mockConferenceCenters as seedConferenceCenters,
  mockGreetingOptionsByDomain,
  mockHiveConferenceCenterDetails,
} from './conference-center.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  ConferenceCenter,
  ConferenceCenterActionPayload,
  ConferenceCenterDetails,
  ConferenceCenterDetailsResponse,
  ConferenceCenterFormValues,
  ConferenceCenterListParams,
  ConferenceCenterListResponse,
  ConferenceCenterRecord,
  GreetingOption,
  HiveUserConferenceDetails,
} from './conference-center.types'

/**
 * Mock implementation of the Conference Centers API boundary. Every function mirrors one Axion
 * endpoint (see `conferenceCenterEndpoints` in conference-center.constants.ts) with a Promise-based
 * signature, so swapping to real `request.*` calls through services/api/apiClient.ts only touches
 * this file. BACKEND CONTRACT REQUIRED — none of these shapes are confirmed for PepperPBX yet.
 *
 * The working copy below is private to this service: pages, components and the hook never import
 * the mock or mutate records themselves. Resets on a full page reload.
 */
let conferenceCenters: ConferenceCenterRecord[] = seedConferenceCenters.map((record) => ({ ...record }))

/**
 * The audit can't confirm whether the backend returns `conference_center_enabled` as a boolean or
 * as the string `'true'`/`'false'` (conference-centers.md §28). Axion compares with `=== 'true'`,
 * which reads every boolean `true` as Disabled. This accepts both, so the rest of the module only
 * ever sees a boolean.
 */
const normalizeEnabled = (value: ConferenceCenterRecord['conference_center_enabled']): boolean => value === true || value === 'true'

/** Wire record → normalized details (boolean status, numeric PIN length, trimmed description). */
const toDetails = (record: ConferenceCenterRecord): ConferenceCenterDetails => ({
  ...record,
  conference_center_enabled: normalizeEnabled(record.conference_center_enabled),
  conference_center_pin_length: Number(record.conference_center_pin_length),
  conference_center_description: record.conference_center_description?.trim() || undefined,
})

const toListItem = (details: ConferenceCenterDetails): ConferenceCenter => ({
  id: details.conference_center_uuid,
  domain: details.domain_name,
  name: details.conference_center_name,
  extension: details.conference_center_extension,
  greeting: details.conference_center_greeting,
  pinLength: details.conference_center_pin_length,
  enabled: details.conference_center_enabled,
  description: details.conference_center_description,
})

/** Form values → create/update body. PIN length is sent as `Number(...)`, matching Axion (conference-centers.md §11/§27). */
const toRecord = (values: ConferenceCenterFormValues, uuid: string, existing?: ConferenceCenterRecord): ConferenceCenterRecord => ({
  conference_center_uuid: uuid,
  conference_center_name: values.conference_center_name,
  conference_center_extension: values.conference_center_extension,
  conference_center_greeting: values.conference_center_greeting || undefined,
  conference_center_pin_length: Number(values.conference_center_pin_length),
  // Account Code is read-only/server-derived — never trust a submitted value over the stored one.
  conference_center_account_code: existing?.conference_center_account_code ?? values.conference_center_account_code,
  // Domain is locked after creation (conference-centers.md §15/§26).
  domain_name: existing?.domain_name ?? values.domain_name,
  conference_center_description: values.conference_center_description?.trim() || undefined,
  conference_center_enabled: values.conference_center_enabled,
})

const firstMockDomain = Object.keys(mockHiveConferenceCenterDetails)[0]

/** The domain the list is scoped to when Show All is off — the shared current-domain store, else the mock default. */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? firstMockDomain

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * GET /api/conference/center/list?pageSize=&pageNumber=&search=&showAll= — the mock emulates
 * server-side search, domain scope and paging; the backend owns all three for real.
 */
export const getConferenceCenters = async (params: ConferenceCenterListParams = {}): Promise<ConferenceCenterListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params

  const currentDomain = getCurrentDomainName()
  const needle = search.trim().toLowerCase()

  const filtered = conferenceCenters
    .map((record) => toListItem(toDetails(record)))
    .filter((center) => showAll || center.domain === currentDomain)
    .filter(
      (center) =>
        !needle ||
        searchableConferenceCenterFields.some((field) => {
          const value = center[field]
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
  }
}

/** GET /api/conference/center/details/{uuid}. Rejects with a "not found" error for an unknown id. */
export const getConferenceCenterById = async (uuid: string): Promise<ConferenceCenterDetails> => {
  await delay(300)
  const record = conferenceCenters.find((item) => item.conference_center_uuid === uuid)
  if (!record) {
    const notFound: ApiError = { status: 404, message: `Conference center ${uuid} not found.` }
    throw notFound
  }
  // The documented `{ data: {...record} }` wrapper (conference-centers.md §13) — a real call
  // unwraps it here and nowhere else.
  const response: ConferenceCenterDetailsResponse = { data: { ...record } }
  return toDetails(response.data)
}

/** POST /api/conference/center/create */
export const createConferenceCenter = async (values: ConferenceCenterFormValues): Promise<ConferenceCenterDetails> => {
  await delay(300)
  const created = toRecord(values, `cc-${Date.now()}`)
  conferenceCenters = [...conferenceCenters, created]
  return toDetails(created)
}

/** PATCH /api/conference/center/update/{uuid} */
export const updateConferenceCenter = async (uuid: string, values: ConferenceCenterFormValues): Promise<ConferenceCenterDetails> => {
  await delay(300)
  const index = conferenceCenters.findIndex((item) => item.conference_center_uuid === uuid)
  if (index === -1) throw new Error(`Conference center ${uuid} not found.`)

  const updated = toRecord(values, uuid, conferenceCenters[index])
  conferenceCenters = conferenceCenters.map((item, itemIndex) => (itemIndex === index ? updated : item))
  return toDetails(updated)
}

/** DELETE /api/conference/center/delete — body `{ conference_center_uuids }`. Single-row and bulk. */
export const deleteConferenceCenters = async ({ conference_center_uuids }: ConferenceCenterActionPayload): Promise<void> => {
  await delay(300)
  conferenceCenters = conferenceCenters.filter((item) => !conference_center_uuids.includes(item.conference_center_uuid))
}

/**
 * PATCH /api/conference/center/toggle — `{ conference_center_uuids }`. Flips each record's own
 * status. Backs both the inline Status click (one uuid, no confirmation) and bulk Toggle.
 */
export const toggleConferenceCenters = async ({ conference_center_uuids }: ConferenceCenterActionPayload): Promise<void> => {
  await delay(200)
  conferenceCenters = conferenceCenters.map((item) =>
    conference_center_uuids.includes(item.conference_center_uuid)
      ? { ...item, conference_center_enabled: !normalizeEnabled(item.conference_center_enabled) }
      : item
  )
}

/** GET /api/conference/center/listGreetings?domain_name=... */
export const getGreetingOptions = async (domainName: string): Promise<GreetingOption[]> => {
  await delay(250)
  return [...(mockGreetingOptionsByDomain[domainName] ?? [])]
}

/**
 * GET /api/hiveuser/details?module=Conference&domain_name=... — Add/Edit bootstrap. Always pass
 * the relevant domain (the chosen domain on Add, the record's own domain on Edit). Also feeds the
 * shared domain store (available domains; current domain only if none is set yet), matching every
 * sibling module's hive call.
 */
export const getHiveUserDetails = async (domainName?: string): Promise<HiveUserConferenceDetails> => {
  await delay(300)
  const hive = mockHiveConferenceCenterDetails[domainName ?? ''] ?? mockHiveConferenceCenterDetails[firstMockDomain]

  const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
  setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
  if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })

  return { ...hive, domainOptions: [...hive.domainOptions], extensionExclude: [...hive.extensionExclude] }
}
