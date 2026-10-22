import { defaultPageSize, searchableConferenceRoomFields } from './conference-room.constants'
import {
  mockConferenceCenterOptionsByDomain,
  mockConferenceProfileOptions,
  mockConferenceRooms as seedConferenceRooms,
  mockHiveUserDetails,
} from './conference-room.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  ConferenceCenterOption,
  ConferenceProfileOption,
  ConferenceRoom,
  ConferenceRoomDeletePayload,
  ConferenceRoomDetails,
  ConferenceRoomDetailsResponse,
  ConferenceRoomFormValues,
  ConferenceRoomListParams,
  ConferenceRoomListResponse,
  ConferenceRoomMutationResponse,
  ConferenceRoomRecord,
  ConferenceRoomTogglePayload,
  HiveUserDetails,
  WireBoolean,
} from './conference-room.types'

/**
 * Mock implementation of the Conference Rooms API boundary. Every function mirrors one Axion
 * endpoint (see `conferenceRoomEndpoints` in conference-room.constants.ts) with a Promise-based
 * signature, so swapping to real `request.*` calls through services/api/apiClient.ts only touches
 * this file. BACKEND CONTRACT REQUIRED — none of these shapes are confirmed for PepperPBX yet.
 *
 * The working copy below is private to this service: pages, components and the hook never import
 * the mock or mutate records themselves. Resets on a full page reload.
 */
let conferenceRooms: ConferenceRoomRecord[] = seedConferenceRooms.map((record) => ({ ...record }))

/** Axion compares flags with `=== 'true'` (conference-rooms.md §27); accept both wire forms. */
const toBoolean = (value: WireBoolean): boolean => value === true || value === 'true'

const trimOrUndefined = (value?: string) => value?.trim() || undefined

/** Wire record → normalized details (real booleans, numeric max members, trimmed description — §3 Edit). */
const toDetails = (record: ConferenceRoomRecord): ConferenceRoomDetails => ({
  ...record,
  record: toBoolean(record.record),
  announce_name: toBoolean(record.announce_name),
  announce_count: toBoolean(record.announce_count),
  announce_recording: toBoolean(record.announce_recording),
  mute: toBoolean(record.mute),
  sounds: toBoolean(record.sounds),
  enabled: toBoolean(record.enabled),
  wait_mod: toBoolean(record.wait_mod),
  moderator_endconf: toBoolean(record.moderator_endconf),
  max_members: Number(record.max_members),
  description: trimOrUndefined(record.description),
})

const toListItem = (details: ConferenceRoomDetails): ConferenceRoom => ({
  conference_room_uuid: details.conference_room_uuid,
  domain_name: details.domain_name,
  conference_room_name: details.conference_room_name,
  moderator_pin: details.moderator_pin,
  participant_pin: details.participant_pin,
  record: details.record,
  announce_name: details.announce_name,
  announce_count: details.announce_count,
  announce_recording: details.announce_recording,
  mute: details.mute,
  sounds: details.sounds,
  enabled: details.enabled,
  description: details.description,
})

/** Form values → create/update body. `max_members` is sent as `Number(...)`, matching Axion (§11/§27). */
const toRecord = (values: ConferenceRoomFormValues, uuid: string, existing?: ConferenceRoomRecord): ConferenceRoomRecord => ({
  ...values,
  conference_room_uuid: uuid,
  // Both are locked on Edit — never trust a submitted value over the stored one.
  conference_center_uuid: existing ? existing.conference_center_uuid : values.conference_center_uuid || undefined,
  domain_name: existing?.domain_name ?? values.domain_name,
  // Account Code is read-only/server-derived.
  account_code: existing?.account_code ?? values.account_code,
  moderator_pin: values.moderator_pin || undefined,
  participant_pin: values.participant_pin || undefined,
  profile: values.profile || undefined,
  start_datetime: values.start_datetime || undefined,
  stop_datetime: values.stop_datetime || undefined,
  max_members: Number(values.max_members),
  description: trimOrUndefined(values.description),
})

const firstMockDomain = Object.keys(mockHiveUserDetails)[0]

/** The domain the list is scoped to when Show All is off — the shared current-domain store, else the mock default. */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? firstMockDomain

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * GET /api/conference/room/list?pageSize=&pageNumber=&search=&showAll= — the mock emulates
 * server-side search, domain scope and paging; the backend owns all three for real. Search
 * matching semantics on the real backend are unknown (§6); the mock uses a case-insensitive substring.
 */
export const fetchConferenceRooms = async (params: ConferenceRoomListParams = {}): Promise<ConferenceRoomListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params

  const currentDomain = getCurrentDomainName()
  const needle = search.trim().toLowerCase()

  const filtered = conferenceRooms
    .map((record) => toListItem(toDetails(record)))
    .filter((room) => showAll || room.domain_name === currentDomain)
    .filter(
      (room) =>
        !needle ||
        searchableConferenceRoomFields.some((field) => {
          const value = room[field]
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
 * GET /api/conference/room/details/{uuid}. An unknown id rejects with the same `ApiError` shape
 * (status 404) the real apiClient produces, so the Edit page branches on status, not message text.
 */
export const getConferenceRoomById = async (uuid: string): Promise<ConferenceRoomDetails> => {
  await delay(300)
  const record = conferenceRooms.find((item) => item.conference_room_uuid === uuid)
  if (!record) {
    const notFound: ApiError = { status: 404, message: `Conference room ${uuid} not found.` }
    throw notFound
  }
  // The documented `{ data: {...record} }` wrapper (§13) — a real call unwraps it here and nowhere else.
  const response: ConferenceRoomDetailsResponse = { data: { ...record } }
  return toDetails(response.data)
}

/** POST /api/conference/room/create — resolves to the new room's uuid (`data[0].conference_room_uuid`, §12). */
export const createConferenceRoom = async (values: ConferenceRoomFormValues): Promise<string> => {
  await delay(300)
  const created = toRecord(values, `cr-${Date.now()}`)
  conferenceRooms = [...conferenceRooms, created]
  const response: ConferenceRoomMutationResponse = { data: [{ conference_room_uuid: created.conference_room_uuid }] }
  return response.data[0].conference_room_uuid
}

/** PATCH /api/conference/room/update/{uuid} — uuid in the path, not the body (§11). */
export const updateConferenceRoom = async (uuid: string, values: ConferenceRoomFormValues): Promise<void> => {
  await delay(300)
  const index = conferenceRooms.findIndex((item) => item.conference_room_uuid === uuid)
  if (index === -1) throw new Error(`Conference room ${uuid} not found.`)

  const updated = toRecord(values, uuid, conferenceRooms[index])
  conferenceRooms = conferenceRooms.map((item, itemIndex) => (itemIndex === index ? updated : item))
}

/** DELETE /api/conference/room/delete — body `{ conference_room_uuids }`. Single-row and bulk. */
export const deleteConferenceRooms = async ({ conference_room_uuids }: ConferenceRoomDeletePayload): Promise<void> => {
  await delay(300)
  conferenceRooms = conferenceRooms.filter((item) => !conference_room_uuids.includes(item.conference_room_uuid))
}

/**
 * PATCH /api/conference/room/toggle — `{ toggleArray, toggleKey }`. Flips `toggleKey` on each
 * listed room independently. Backs both the inline column click (one uuid, no confirmation) and
 * the bulk Toggle modal (§3/§26).
 */
export const toggleConferenceRooms = async ({ toggleArray, toggleKey }: ConferenceRoomTogglePayload): Promise<void> => {
  await delay(200)
  conferenceRooms = conferenceRooms.map((item) =>
    toggleArray.includes(item.conference_room_uuid) ? { ...item, [toggleKey]: !toBoolean(item[toggleKey]) } : item
  )
}

/** GET /api/conference/room/list/conferenceCenterNames?domain_name=... — the Rooms → Centers link (§9/§30). */
export const getConferenceCenterOptions = async (domainName: string): Promise<ConferenceCenterOption[]> => {
  await delay(250)
  return [...(mockConferenceCenterOptionsByDomain[domainName] ?? [])]
}

/** GET /api/conferences/profileOptions?domain_name=... — the Conferences API's endpoint (§12/§30). */
export const getProfileOptions = async (domainName: string): Promise<ConferenceProfileOption[]> => {
  await delay(250)
  void domainName // sent as `?domain_name=` on the real call; the mock list isn't domain-scoped
  return [...mockConferenceProfileOptions]
}

/**
 * GET /api/hiveuser/details?module=ConferenceCenter&domain_name=... (see `hiveUserModule`) —
 * Add/Edit bootstrap. Always pass the relevant domain (the chosen domain on Add, the record's own
 * domain on Edit). Also feeds the shared domain store, matching every sibling module's hive call.
 */
export const getHiveUserDetails = async (domainName?: string): Promise<HiveUserDetails> => {
  await delay(300)
  const hive = mockHiveUserDetails[domainName ?? ''] ?? mockHiveUserDetails[firstMockDomain]

  const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
  setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
  if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })

  return { ...hive, domainOptions: [...hive.domainOptions], extensionExclude: [...hive.extensionExclude] }
}
