import { defaultPageSize, searchableConferenceControlFields } from './conference-control.constants'
import { mockConferenceControls as seedConferenceControls } from './conference-control.mock'
import type { ApiError } from '../../services/api/apiError'
import type {
  ConferenceControl,
  ConferenceControlDetail,
  ConferenceControlDetailRecord,
  ConferenceControlDetails,
  ConferenceControlDetailsResponse,
  ConferenceControlFormValues,
  ConferenceControlListParams,
  ConferenceControlListResponse,
  ConferenceControlMutationResponse,
  ConferenceControlRecord,
  ConferenceControlTogglePayload,
  WireBoolean,
} from './conference-control.types'

/**
 * Mock implementation of the Conference Controls API boundary. Every function mirrors one Axion
 * endpoint (see `conferenceControlEndpoints` in conference-control.constants.ts) with a
 * Promise-based signature, so swapping to real `request.*` calls through services/api/apiClient.ts
 * only touches this file. BACKEND CONTRACT REQUIRED — none of these shapes are confirmed yet.
 *
 * There is intentionally no delete function: Axion has no delete endpoint for this module (§11).
 * Axion's `getHiveUserDetails?module=Conference` bootstrap is also not mirrored — for this module
 * it only returns privileges (§9/§12), and PepperPBX reads permissions from its own store.
 *
 * The working copy below is private to this service. Resets on a full page reload.
 */
let conferenceControls: ConferenceControlRecord[] = seedConferenceControls.map((record) => ({
  ...record,
  conference_control_details: record.conference_control_details?.map((detail) => ({ ...detail })),
}))

/** Axion compares with `=== 'true'` (§28), reading every boolean `true` as Disabled; accept both wire forms. */
const toBoolean = (value: WireBoolean): boolean => value === true || value === 'true'

const trimOrUndefined = (value?: string) => value?.trim() || undefined

const toDetail = (record: ConferenceControlDetailRecord): ConferenceControlDetail => ({
  control_digits: Number(record.control_digits),
  control_action: record.control_action,
  control_data: record.control_data || undefined,
  control_detail_enabled: toBoolean(record.control_detail_enabled),
})

/** Wire record → normalized details (boolean flags, numeric digits, trimmed description — §3 Edit / §27). */
const toDetails = (record: ConferenceControlRecord): ConferenceControlDetails => ({
  conference_control_uuid: record.conference_control_uuid,
  control_name: record.control_name,
  control_description: trimOrUndefined(record.control_description),
  control_enabled: toBoolean(record.control_enabled),
  conference_control_details: (record.conference_control_details ?? []).map(toDetail),
})

const toListItem = (details: ConferenceControlDetails): ConferenceControl => ({
  conference_control_uuid: details.conference_control_uuid,
  control_name: details.control_name,
  control_enabled: details.control_enabled,
  control_description: details.control_description,
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Conference control ${uuid} not found.` })

/**
 * GET /api/conference/control/list?pageSize=&pageNumber=&search= — the mock emulates server-side
 * search and paging. No `showAll` / domain scope exists for this module (§6/§15).
 */
export const getConferenceControls = async (params: ConferenceControlListParams = {}): Promise<ConferenceControlListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, search = '' } = params
  const needle = search.trim().toLowerCase()

  const filtered = conferenceControls
    .map((record) => toListItem(toDetails(record)))
    .filter(
      (control) =>
        !needle ||
        searchableConferenceControlFields.some((field) => {
          const value = control[field]
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

/**
 * GET /api/conference/control/details/{uuid}. An unknown id rejects with the same `ApiError` shape
 * (status 404) the real apiClient produces, so the Edit page branches on status, not message text.
 */
export const getConferenceControlById = async (uuid: string): Promise<ConferenceControlDetails> => {
  await delay(300)
  const record = conferenceControls.find((item) => item.conference_control_uuid === uuid)
  if (!record) throw notFoundError(uuid)
  // The documented `{ data: {...record} }` wrapper (§12/§13) — a real call unwraps it here and nowhere else.
  const response: ConferenceControlDetailsResponse = { data: { ...record } }
  return toDetails(response.data)
}

/**
 * POST /api/conference/control/create — body `{ control_name, control_description, control_enabled }`
 * only (§11). Resolves to the new uuid (`data[0].conference_control_uuid`, §12).
 */
export const createConferenceControl = async (values: ConferenceControlFormValues): Promise<string> => {
  await delay(300)
  const created: ConferenceControlRecord = {
    conference_control_uuid: `ctl-${Date.now()}`,
    control_name: values.control_name,
    control_description: trimOrUndefined(values.control_description),
    control_enabled: values.control_enabled,
    conference_control_details: [],
  }
  conferenceControls = [...conferenceControls, created]
  const response: ConferenceControlMutationResponse = { data: [{ conference_control_uuid: created.conference_control_uuid }] }
  return response.data[0].conference_control_uuid
}

/**
 * PATCH /api/conference/control/update/{uuid} — the full form payload including the
 * `conference_control_details` array, plus `conference_control_uuid` (§3/§11).
 */
export const updateConferenceControl = async (uuid: string, values: ConferenceControlFormValues): Promise<void> => {
  await delay(300)
  const index = conferenceControls.findIndex((item) => item.conference_control_uuid === uuid)
  if (index === -1) throw notFoundError(uuid)

  const updated: ConferenceControlRecord = {
    conference_control_uuid: uuid,
    control_name: values.control_name,
    control_description: trimOrUndefined(values.control_description),
    control_enabled: values.control_enabled,
    conference_control_details: (values.conference_control_details ?? []).map((detail) => ({
      control_digits: Number(detail.control_digits),
      control_action: detail.control_action,
      control_data: detail.control_data || undefined,
      control_detail_enabled: detail.control_detail_enabled ?? true,
    })),
  }
  conferenceControls = conferenceControls.map((item, itemIndex) => (itemIndex === index ? updated : item))
}

/**
 * PATCH /api/conference/control/toggle — `{ conference_control_uuids }`. Flips each record's own
 * status. Backs both the inline Status click (one uuid, no confirmation) and bulk Toggle (§3).
 */
export const toggleConferenceControls = async ({ conference_control_uuids }: ConferenceControlTogglePayload): Promise<void> => {
  await delay(200)
  conferenceControls = conferenceControls.map((item) =>
    conference_control_uuids.includes(item.conference_control_uuid) ? { ...item, control_enabled: !toBoolean(item.control_enabled) } : item
  )
}
