import { defaultPageSize, normalizeForwardCidMode, searchableRingGroupFields } from './ring-group.constants'
import {
  mockAlertInfoGroups,
  mockDestinationOptionsByDomain,
  mockGreetingOptionsByDomain,
  mockRingBackOptionsByDomain,
  mockRingGroupHiveDetails,
  mockRingGroups as seedRingGroups,
  mockTimeoutDestinationOptionsByDomain,
} from './ring-group.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  AlertInfoGroup,
  RingGroup,
  RingGroupCopyPayload,
  RingGroupDetails,
  RingGroupFormValues,
  RingGroupHiveDetails,
  RingGroupListParams,
  RingGroupListResponse,
  RingGroupOption,
  RingGroupOptionSets,
  RingGroupRecord,
  WireBoolean,
} from './ring-group.types'

/**
 * Mock implementation of the Ring Groups API boundary. Each function mirrors one Axion endpoint
 * (`ringGroupEndpoints` in ring-group.constants.ts) with a Promise-based signature, so connecting
 * the real backend means replacing these bodies with `request.*` calls through
 * services/api/apiClient.ts — no page or component changes. BACKEND CONTRACT REQUIRED: none of
 * these shapes are confirmed for PepperPBX.
 *
 * Booleans: everything outside this file uses real booleans. Axion compares the enabled/forward
 * flags against the string `'true'` (§26/§28); the records below may hold either form and are
 * normalized on every read.
 *
 * The working copy is private to this service and resets on a full page reload.
 */
let ringGroups: RingGroupRecord[] = seedRingGroups.map((record) => ({
  ...record,
  ring_group_destinations: record.ring_group_destinations.map((row) => ({ ...row })),
}))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `Ring group ${uuid} not found.` })

const fromWireBoolean = (value: WireBoolean): boolean => value === true || value === 'true'

const trimOrUndefined = (value?: string) => value?.trim() || undefined
const blankToUndefined = (value?: string) => value || undefined

/**
 * Wire record → normalized details (§3 Edit step 3 / §27): boolean flags, trimmed description, CID
 * mode kept only if `dialed`/`fixed` (else `default`), the three newer switches `?? false`.
 */
const toDetails = (record: RingGroupRecord): RingGroupDetails => ({
  ...record,
  ring_group_description: trimOrUndefined(record.ring_group_description),
  ring_group_enabled: fromWireBoolean(record.ring_group_enabled),
  ring_group_forward_enabled: fromWireBoolean(record.ring_group_forward_enabled),
  ring_group_call_forward_enabled: fromWireBoolean(record.ring_group_call_forward_enabled),
  ring_group_follow_me_enabled: fromWireBoolean(record.ring_group_follow_me_enabled),
  ring_group_forward_cid_mode: normalizeForwardCidMode(record.ring_group_forward_cid_mode),
  // Wire `null` → no value in the form model.
  ring_group_forward_cid_value: record.ring_group_forward_cid_value ?? undefined,
  ring_group_remote_announce: record.ring_group_remote_announce ?? undefined,
  ring_group_too_late_announce: record.ring_group_too_late_announce ?? undefined,
  skip_busy_agent: record.skip_busy_agent ?? false,
  enable_call_pickup: record.enable_call_pickup ?? false,
  call_recording_enabled: record.call_recording_enabled ?? false,
  ring_group_destinations: record.ring_group_destinations.map((row) => ({ ...row })),
})

const toListItem = (details: RingGroupDetails): RingGroup => ({
  ring_group_uuid: details.ring_group_uuid,
  domain_name: details.domain_name,
  ring_group_name: details.ring_group_name,
  ring_group_extension: details.ring_group_extension,
  ring_group_strategy: details.ring_group_strategy,
  ring_group_forward_enabled: details.ring_group_forward_enabled,
  ring_group_forward_destination: details.ring_group_forward_destination,
  ring_group_enabled: details.ring_group_enabled,
  ring_group_description: details.ring_group_description,
})

/**
 * Form values → stored record. `ring_group_call_timeout` is coerced to a number (§3/§27); the
 * missed-call email is dropped when Missed Call isn't Email; the CID mode falls back to `default`.
 * Fields Axion always sends with an explicit empty value (§27) are never omitted: the Fixed CID
 * Value is the entered value in `fixed` mode and `null` otherwise (§34.3), Remote / Too Late
 * Announce are `null` when empty, and the Ringtone (Alert Info) is `''` when empty. Other optional
 * blanks are omitted.
 */
const toRecord = (values: RingGroupFormValues, uuid: string): RingGroupRecord => ({
  ring_group_uuid: uuid,
  domain_name: values.ring_group_context,
  ring_group_context: values.ring_group_context,
  ring_group_name: values.ring_group_name,
  ring_group_extension: values.ring_group_extension,
  ring_group_greeting: blankToUndefined(values.ring_group_greeting),
  ring_group_strategy: values.ring_group_strategy,
  ring_group_call_timeout: Number(values.ring_group_call_timeout),
  caller_id_name: blankToUndefined(values.caller_id_name),
  ring_group_caller_id_number: blankToUndefined(values.ring_group_caller_id_number),
  ring_group_distinctive_ring: values.ring_group_distinctive_ring || '',
  ring_group_cid_prefix: blankToUndefined(values.ring_group_cid_prefix),
  ring_group_forward_cid_mode: values.ring_group_forward_cid_mode || 'default',
  ring_group_forward_cid_value:
    values.ring_group_forward_cid_mode === 'fixed' ? values.ring_group_forward_cid_value ?? null : null,
  ring_group_ringback: blankToUndefined(values.ring_group_ringback),
  ring_group_remote_announce: values.ring_group_remote_announce || null,
  ring_group_too_late_announce: values.ring_group_too_late_announce || null,
  ring_group_missed_call_app: values.ring_group_missed_call_app || undefined,
  ring_group_missed_call_data: values.ring_group_missed_call_app === 'email' ? values.ring_group_missed_call_data : undefined,
  ring_group_forward_destination: blankToUndefined(values.ring_group_forward_destination),
  ring_group_forward_enabled: values.ring_group_forward_enabled,
  ring_group_forward_toll_allow: blankToUndefined(values.ring_group_forward_toll_allow),
  ring_group_enabled: values.ring_group_enabled,
  ring_group_call_forward_enabled: values.ring_group_call_forward_enabled,
  ring_group_follow_me_enabled: values.ring_group_follow_me_enabled,
  skip_busy_agent: values.skip_busy_agent ?? false,
  enable_call_pickup: values.enable_call_pickup ?? false,
  call_recording_enabled: values.call_recording_enabled ?? false,
  ring_group_description: trimOrUndefined(values.ring_group_description),
  ring_group_timeout_action: blankToUndefined(values.ring_group_timeout_action),
  ring_group_destinations: (values.ring_group_destinations ?? []).map((row) => ({
    destination_number: row.destination_number,
    destination_delay: row.destination_delay ?? 0,
    destination_timeout: row.destination_timeout ?? 30,
    destination_prompt: row.destination_prompt ?? 0,
  })),
})

const fallbackDomain = () => Object.keys(mockRingGroupHiveDetails)[0]

/** The list's default domain scope: the shared current-domain store, else the mock default. */
const getCurrentDomainName = (): string =>
  useDomainStore.getState().currentDomain?.name ?? mockRingGroupHiveDetails[fallbackDomain()].defaultDomain

/**
 * GET /api/ringGroups/list?pageSize=&pageNumber=&showAll=&search= (§12). Domain-scoped unless
 * `showAll`; the mock emulates server-side search and paging. Returns Axion's shape
 * (`data: { data, total_pages, total_records }`, §12/§13) — no page field, so an out-of-range page
 * simply comes back empty and the caller corrects it from `total_pages`.
 * TODO (backend): how the real list is scoped to the current domain is unconfirmed.
 */
export const getRingGroups = async (params: RingGroupListParams = {}): Promise<RingGroupListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params
  const needle = search.trim().toLowerCase()
  const currentDomain = getCurrentDomainName()

  const filtered = ringGroups
    .map((record) => toListItem(toDetails(record)))
    .filter((group) => showAll || group.domain_name === currentDomain)
    .filter(
      (group) =>
        !needle ||
        searchableRingGroupFields.some((field) => {
          const value = group[field]
          return typeof value === 'string' && value.toLowerCase().includes(needle)
        })
    )

  const total_records = filtered.length
  const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
  const pageNumber = Math.max(1, page)

  return {
    data: {
      data: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
      total_pages,
      total_records,
    },
    wildCardDomains: [...(mockRingGroupHiveDetails[currentDomain]?.domainOptions ?? Object.keys(mockRingGroupHiveDetails))],
  }
}

/** GET /api/ringGroups/details/{id} (§12). Unknown id → 404 ApiError. */
export const getRingGroupById = async (uuid: string): Promise<RingGroupDetails> => {
  await delay(300)
  const record = ringGroups.find((item) => item.ring_group_uuid === uuid)
  if (!record) throw notFoundError(uuid)
  return toDetails(record)
}

/**
 * GET /api/hiveuser/details?module=RingGroup&domain_name= (§3/§12) — domain options, `autoExt` and
 * extension range for one domain. Also seeds the shared domain store (available domains; current
 * domain only if none is set yet), as every sibling module's mock does.
 */
export const getHiveRingGroupDetails = async (domainName?: string): Promise<RingGroupHiveDetails> => {
  await delay(300)
  const hive = mockRingGroupHiveDetails[domainName ?? ''] ?? mockRingGroupHiveDetails[fallbackDomain()]

  const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
  setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
  if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })

  return {
    ...hive,
    domainOptions: [...hive.domainOptions],
    additionalExtExclude: [...hive.additionalExtExclude],
  }
}

const domainScoped = (byDomain: Record<string, RingGroupOption[]>, domainName: string): RingGroupOption[] => [...(byDomain[domainName] ?? [])]

/** GET /api/ringGroups/destination?domain_name= (§12). */
export const getDestinationOptions = async (domainName: string): Promise<RingGroupOption[]> => {
  await delay(250)
  return domainScoped(mockDestinationOptionsByDomain, domainName)
}

/** GET /api/ringGroups/timeoutDestination?domain_name= (§12). */
export const getTimeoutDestinationOptions = async (domainName: string): Promise<RingGroupOption[]> => {
  await delay(250)
  return domainScoped(mockTimeoutDestinationOptionsByDomain, domainName)
}

/** GET /api/ringGroups/greetings?domain_name= (§12). */
export const getGreetingOptions = async (domainName: string): Promise<RingGroupOption[]> => {
  await delay(250)
  return domainScoped(mockGreetingOptionsByDomain, domainName)
}

/** GET /api/ringGroups/ringBack?domain_name= (§12). */
export const getRingBackOptions = async (domainName: string): Promise<RingGroupOption[]> => {
  await delay(250)
  return domainScoped(mockRingBackOptionsByDomain, domainName)
}

/** The four option lists the form needs, fetched in parallel as Axion does (§3). */
export const getRingGroupOptionSets = async (domainName: string): Promise<RingGroupOptionSets> => {
  const [destinationOptions, timeoutDestinationOptions, greetingOptions, ringBackOptions] = await Promise.all([
    getDestinationOptions(domainName),
    getTimeoutDestinationOptions(domainName),
    getGreetingOptions(domainName),
    getRingBackOptions(domainName),
  ])
  return { destinationOptions, timeoutDestinationOptions, greetingOptions, ringBackOptions }
}

/** Private working copy of the Alert-Info options, mutated only by the two functions below. */
let alertInfoGroups: AlertInfoGroup[] = mockAlertInfoGroups.map((group) => ({
  ...group,
  options: group.options.map((option) => ({ ...option })),
}))

const CUSTOM_ALERT_INFO_CATEGORY = 'Custom'

/** GET /api/alertInfo/options — grouped Ringtone (Alert Info) options (§12/§34.4). */
export const getAlertInfoOptions = async (): Promise<AlertInfoGroup[]> => {
  await delay(250)
  return alertInfoGroups
    .filter((group) => group.options.length > 0)
    .map((group) => ({ ...group, options: group.options.map((option) => ({ ...option })) }))
}

/**
 * POST /api/alertInfo/create — `{alert_info_category:'Custom', alert_info_name, alert_info_value}`,
 * name and value both the trimmed typed text (§12/§34.4).
 */
export const createAlertInfo = async (text: string): Promise<void> => {
  await delay(250)
  const value = text.trim()
  const option = { label: value, value, alert_info_uuid: `ai-${Date.now()}`, alert_info_is_default: false }
  const hasCustomGroup = alertInfoGroups.some((group) => group.label === CUSTOM_ALERT_INFO_CATEGORY)
  alertInfoGroups = hasCustomGroup
    ? alertInfoGroups.map((group) =>
        group.label === CUSTOM_ALERT_INFO_CATEGORY ? { ...group, options: [...group.options, option] } : group
      )
    : [...alertInfoGroups, { label: CUSTOM_ALERT_INFO_CATEGORY, options: [option] }]
}

/**
 * DELETE /api/alertInfo/delete — body `{alert_info_uuids:[uuid]}` (§12/§34.4). Custom entries only.
 * A ring group that already references the value keeps it (§34.4).
 */
export const deleteAlertInfo = async (uuid: string): Promise<void> => {
  await delay(250)
  alertInfoGroups = alertInfoGroups.map((group) => ({
    ...group,
    options: group.options.filter((option) => option.alert_info_is_default || option.alert_info_uuid !== uuid),
  }))
}

/** POST /api/ringGroups/create — resolves to the new `ring_group_uuid` (§12). */
export const createRingGroup = async (values: RingGroupFormValues): Promise<string> => {
  await delay(300)
  const uuid = `rg-${Date.now()}`
  ringGroups = [...ringGroups, toRecord(values, uuid)]
  return uuid
}

/** PATCH /api/ringGroups/update (§11). The domain can't change after creation (§15), so the stored domain wins. */
export const updateRingGroup = async (uuid: string, values: RingGroupFormValues): Promise<void> => {
  await delay(300)
  const existing = ringGroups.find((item) => item.ring_group_uuid === uuid)
  if (!existing) throw notFoundError(uuid)
  const updated = toRecord({ ...values, ring_group_context: existing.domain_name }, uuid)
  ringGroups = ringGroups.map((item) => (item.ring_group_uuid === uuid ? updated : item))
}

/** DELETE /api/ringGroups/delete — body `{ ring_group_uuid: [...] }` (§11/§12). Single-row and bulk. */
export const deleteRingGroups = async (uuids: string[]): Promise<void> => {
  await delay(300)
  ringGroups = ringGroups.filter((item) => !uuids.includes(item.ring_group_uuid))
}

/**
 * PATCH /api/ringGroups/toggle — `{ ring_group_uuid: [...] }` (§11/§12). Flips `ring_group_enabled`
 * on each record; backs both the row Status pill (one uuid, no confirmation) and bulk Toggle.
 */
export const toggleRingGroups = async (uuids: string[]): Promise<void> => {
  await delay(200)
  ringGroups = ringGroups.map((item) =>
    uuids.includes(item.ring_group_uuid) ? { ...item, ring_group_enabled: !fromWireBoolean(item.ring_group_enabled) } : item
  )
}

/**
 * PATCH /api/ringGroups/copy — `{ ring_group_name, ring_group_extension, ring_group_uuid }`
 * (§11/§12). The copy stays in the source record's domain (§15).
 */
export const copyRingGroup = async (sourceUuid: string, values: { name: string; extension: string }): Promise<void> => {
  await delay(300)
  const payload: RingGroupCopyPayload = {
    ring_group_name: values.name,
    ring_group_extension: values.extension,
    ring_group_uuid: sourceUuid,
  }
  const source = ringGroups.find((item) => item.ring_group_uuid === payload.ring_group_uuid)
  if (!source) throw notFoundError(payload.ring_group_uuid)
  ringGroups = [
    ...ringGroups,
    {
      ...source,
      ring_group_uuid: `rg-copy-${Date.now()}`,
      ring_group_name: payload.ring_group_name,
      ring_group_extension: payload.ring_group_extension,
      ring_group_destinations: source.ring_group_destinations.map((row) => ({ ...row })),
    },
  ]
}
