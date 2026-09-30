import { defaultPageSize, searchableConferenceProfileFields } from './conference-profile.constants'
import { mockConferenceProfiles as seedConferenceProfiles } from './conference-profile.mock'
import type { ApiError } from '../../services/api/apiError'
import type {
  ConferenceProfile,
  ConferenceProfileDetails,
  ConferenceProfileDetailsResponse,
  ConferenceProfileFormValues,
  ConferenceProfileListParams,
  ConferenceProfileListResponse,
  ConferenceProfileMutationResponse,
  ConferenceProfileParam,
  ConferenceProfileParamRecord,
  ConferenceProfileRecord,
  ConferenceProfileTogglePayload,
  WireBoolean,
} from './conference-profile.types'

/**
 * Mock implementation of the Conference Profiles API boundary. Every function mirrors one Axion
 * endpoint (see `conferenceProfileEndpoints` in conference-profile.constants.ts) with a
 * Promise-based signature, so swapping to real `request.*` calls through services/api/apiClient.ts
 * only touches this file. BACKEND CONTRACT REQUIRED — none of these shapes are confirmed yet.
 *
 * There is intentionally no delete or copy function: Axion has neither endpoint (§11). Axion's
 * `getHiveUserDetails?module=Conference` bootstrap is also not mirrored — for this module it only
 * returns privileges (§3/§12), and PepperPBX reads permissions from its own store. That also
 * sidesteps Axion's `domain_name=undefined` query bug (§28).
 *
 * The working copy below is private to this service. Resets on a full page reload.
 */
let conferenceProfiles: ConferenceProfileRecord[] = seedConferenceProfiles.map((record) => ({
  ...record,
  conference_profile_params: record.conference_profile_params?.map((param) => ({ ...param })),
}))

/** Axion compares with `=== 'true'` (§28), reading every boolean `true` as Disabled; accept both wire forms. */
const toBoolean = (value: WireBoolean): boolean => value === true || value === 'true'

const trimOrUndefined = (value?: string) => value?.trim() || undefined

const toParam = (record: ConferenceProfileParamRecord): ConferenceProfileParam => ({
  profile_param_name: record.profile_param_name,
  profile_param_value: record.profile_param_value,
  profile_param_description: record.profile_param_description || undefined,
  profile_param_enabled: toBoolean(record.profile_param_enabled),
})

/** Wire record → normalized details (boolean flags, trimmed description — §3 Edit / §27). */
const toDetails = (record: ConferenceProfileRecord): ConferenceProfileDetails => ({
  conference_profile_uuid: record.conference_profile_uuid,
  profile_name: record.profile_name,
  profile_description: trimOrUndefined(record.profile_description),
  profile_enabled: toBoolean(record.profile_enabled),
  conference_profile_params: (record.conference_profile_params ?? []).map(toParam),
})

const toListItem = (details: ConferenceProfileDetails): ConferenceProfile => ({
  conference_profile_uuid: details.conference_profile_uuid,
  profile_name: details.profile_name,
  profile_enabled: details.profile_enabled,
  profile_description: details.profile_description,
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Conference profile ${uuid} not found.` })

/**
 * GET /api/conference/profile/list?pageSize=&pageNumber=&search= — the mock emulates server-side
 * search and paging. No `showAll` / domain scope exists for this module (§6/§15).
 */
export const getConferenceProfiles = async (params: ConferenceProfileListParams = {}): Promise<ConferenceProfileListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, search = '' } = params
  const needle = search.trim().toLowerCase()

  const filtered = conferenceProfiles
    .map((record) => toListItem(toDetails(record)))
    .filter(
      (profile) =>
        !needle ||
        searchableConferenceProfileFields.some((field) => {
          const value = profile[field]
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
 * GET /api/conference/profile/details/{uuid}. An unknown id rejects with the same `ApiError` shape
 * (status 404) the real apiClient produces, so the Edit page branches on status, not message text.
 */
export const getConferenceProfileById = async (uuid: string): Promise<ConferenceProfileDetails> => {
  await delay(300)
  const record = conferenceProfiles.find((item) => item.conference_profile_uuid === uuid)
  if (!record) throw notFoundError(uuid)
  // The documented `{ data: {...record} }` wrapper (§12/§13) — a real call unwraps it here and nowhere else.
  const response: ConferenceProfileDetailsResponse = { data: { ...record } }
  return toDetails(response.data)
}

/**
 * POST /api/conference/profile/create — body `{ profile_name, profile_description, profile_enabled }`
 * only (§11). Resolves to the new uuid (`data[0].conference_profile_uuid`, §12).
 */
export const createConferenceProfile = async (values: ConferenceProfileFormValues): Promise<string> => {
  await delay(300)
  const created: ConferenceProfileRecord = {
    conference_profile_uuid: `prf-${Date.now()}`,
    profile_name: values.profile_name,
    profile_description: trimOrUndefined(values.profile_description),
    profile_enabled: values.profile_enabled,
    conference_profile_params: [],
  }
  conferenceProfiles = [...conferenceProfiles, created]
  const response: ConferenceProfileMutationResponse = { data: [{ conference_profile_uuid: created.conference_profile_uuid }] }
  return response.data[0].conference_profile_uuid
}

/**
 * PATCH /api/conference/profile/update/{uuid} — the full form payload including the
 * `conference_profile_params` array, plus `conference_profile_uuid` (§3/§11).
 */
export const updateConferenceProfile = async (uuid: string, values: ConferenceProfileFormValues): Promise<void> => {
  await delay(300)
  const index = conferenceProfiles.findIndex((item) => item.conference_profile_uuid === uuid)
  if (index === -1) throw notFoundError(uuid)

  const updated: ConferenceProfileRecord = {
    conference_profile_uuid: uuid,
    profile_name: values.profile_name,
    profile_description: trimOrUndefined(values.profile_description),
    profile_enabled: values.profile_enabled,
    conference_profile_params: (values.conference_profile_params ?? []).map((param) => ({
      profile_param_name: param.profile_param_name,
      profile_param_value: param.profile_param_value,
      profile_param_description: param.profile_param_description || undefined,
      profile_param_enabled: param.profile_param_enabled ?? true,
    })),
  }
  conferenceProfiles = conferenceProfiles.map((item, itemIndex) => (itemIndex === index ? updated : item))
}

/**
 * PATCH /api/conference/profile/toggle — `{ conference_profile_uuids }`. Flips each record's own
 * status. Backs both the inline Status click (one uuid, no confirmation) and bulk Toggle (§3).
 */
export const toggleConferenceProfiles = async ({ conference_profile_uuids }: ConferenceProfileTogglePayload): Promise<void> => {
  await delay(200)
  conferenceProfiles = conferenceProfiles.map((item) =>
    conference_profile_uuids.includes(item.conference_profile_uuid) ? { ...item, profile_enabled: !toBoolean(item.profile_enabled) } : item
  )
}
