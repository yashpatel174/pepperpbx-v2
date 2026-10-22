import { defaultPageSize, searchableIVRMenuFields } from './ivr-menu.constants'
import {
  mockDestinationOptionsByDomain,
  mockExitActionOptionsByDomain,
  mockGreetOptionsByDomain,
  mockIVRMenuHiveDetails,
  mockIVRMenus as seedIVRMenus,
  mockRingbackOptionsByDomain,
  mockSoundOptionsByDomain,
} from './ivr-menu.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  IVRMenu,
  IVRMenuCopyPayload,
  IVRMenuDetails,
  IVRMenuFormValues,
  IVRMenuHiveDetails,
  IVRMenuListParams,
  IVRMenuListResponse,
  IVRMenuOption,
  IVRMenuParentOption,
  IVRMenuPayload,
  IVRMenuSelectOptions,
  IVRMenuUpdatePayload,
  IVRMenuUuidsPayload,
} from './ivr-menu.types'

/**
 * Mock implementation of the IVR Menus API boundary. Each function mirrors one Axion endpoint
 * (`ivrMenuEndpoints` in ivr-menu.constants.ts) with a Promise-based signature, so connecting the
 * real backend means replacing these bodies with `request.*` calls through
 * services/api/apiClient.ts — no page or component changes.
 *
 * TODO: backend contract confirmation required — none of these request/response shapes are
 * confirmed for PepperPBX; they follow the Axion audit (ivr-menus.md §11/§12).
 *
 * The working copy is private to this service and resets on a full page reload.
 */
let ivrMenus: IVRMenuDetails[] = seedIVRMenus.map((record) => ({ ...record, options: record.options.map((row) => ({ ...row })) }))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const notFoundError = (uuid: string): ApiError => ({ status: 404, message: `IVR menu ${uuid} not found.` })

const trimOrUndefined = (value?: string) => value?.trim() || undefined

/** A text field as sent: `''` when blank or cleared (a cleared Select gives `undefined`). Never dropped. */
const text = (value?: string | null): string => value ?? ''
/** An optional numeric field as sent: `null` when blank — not `0`, not omitted. */
const numberOrNull = (value?: string | null): number | null => (value?.trim() ? Number(value) : null)

const cloneDetails = (record: IVRMenuDetails): IVRMenuDetails => ({
  ...record,
  // Axion trims the description on load in Edit (§3/§27).
  ivr_menu_description: trimOrUndefined(record.ivr_menu_description),
  options: record.options.map((row) => ({ ...row })),
})

const toListItem = (record: IVRMenuDetails): IVRMenu => ({
  ivr_menu_uuid: record.ivr_menu_uuid,
  domain_name: record.domain_name,
  ivr_menu_name: record.ivr_menu_name,
  ivr_menu_extension: record.ivr_menu_extension,
  ivr_menu_enabled: record.ivr_menu_enabled,
  ivr_menu_description: trimOrUndefined(record.ivr_menu_description),
})

/**
 * Options rows → wire rows (§27): `order` coerced to Number, missing fields defaulted to `''`/0.
 * Rows with every field blank are dropped — PepperPBX's answer to §28/§33's "blank menu entries"
 * concern (e.g. the untouched starter row on Add). Partially filled rows are kept as Axion does.
 */
const toWireOptions = (rows: IVRMenuFormValues['options']): IVRMenuOption[] =>
  (rows ?? [])
    .filter((row) => row.option_digits?.trim() || row.destination?.trim() || row.description?.trim())
    .map((row) => ({
      option_digits: row.option_digits ?? '',
      destination: row.destination ?? '',
      order: Number(row.order ?? 0) || 0,
      description: row.description ?? '',
    }))

/**
 * Form values → request body, the single place blank values are decided (§27):
 * - text fields: always sent, `''` when blank — so clearing a field on Edit reaches the backend
 *   instead of PATCH leaving the old value in place;
 * - required numbers: `Number(...)`; the optional Inter-Digit Timeout: `null` when blank;
 * - booleans and `options` (possibly `[]`) as-is;
 * - context: always the domain (§26);
 * - Parent Menu: omitted on create when none (Axion deletes it, §3 step 6) — see `toIVRMenuUpdatePayload`.
 * Axion's `select_dialplan_expression` deletion has no counterpart — the form never collects it.
 */
export const toIVRMenuPayload = (values: IVRMenuFormValues): IVRMenuPayload => {
  const parentUuid = values.ivr_menu_parent_uuid?.trim()
  return {
    domain_name: values.domain_name,
    ivr_menu_context: values.domain_name,
    ivr_menu_name: values.ivr_menu_name,
    ivr_menu_extension: values.ivr_menu_extension,
    ...(parentUuid ? { ivr_menu_parent_uuid: parentUuid } : {}),
    ivr_menu_language: text(values.ivr_menu_language),
    ivr_menu_greet_long: text(values.ivr_menu_greet_long),
    ivr_menu_greet_short: text(values.ivr_menu_greet_short),
    ivr_menu_timeout: Number(values.ivr_menu_timeout),
    exit_action: text(values.exit_action),
    ivr_menu_ringback: text(values.ivr_menu_ringback),
    ivr_menu_cid_prefix: text(values.ivr_menu_cid_prefix),
    ivr_menu_direct_dial: values.ivr_menu_direct_dial,
    ivr_menu_enabled: values.ivr_menu_enabled,
    ivr_menu_description: text(values.ivr_menu_description).trim(),
    options: toWireOptions(values.options),
    ivr_menu_invalid_sound: text(values.ivr_menu_invalid_sound),
    ivr_menu_exit_sound: text(values.ivr_menu_exit_sound),
    ivr_menu_pin_number: text(values.ivr_menu_pin_number),
    ivr_menu_confirm_macro: text(values.ivr_menu_confirm_macro),
    ivr_menu_confirm_key: text(values.ivr_menu_confirm_key),
    ivr_menu_tts_engine: text(values.ivr_menu_tts_engine),
    ivr_menu_tts_voice: text(values.ivr_menu_tts_voice),
    ivr_menu_confirm_attempts: Number(values.ivr_menu_confirm_attempts),
    ivr_menu_inter_digit_timeout: numberOrNull(values.ivr_menu_inter_digit_timeout),
    ivr_menu_max_failures: Number(values.ivr_menu_max_failures),
    ivr_menu_max_timeouts: Number(values.ivr_menu_max_timeouts),
    ivr_menu_digit_len: Number(values.ivr_menu_digit_len),
  }
}

/**
 * Update body: the full create body plus `ivr_menu_uuid` (§11). Parent Menu is always sent here —
 * `null` when cleared — because omitting it would leave a stored parent unchanged under PATCH.
 * TODO: backend contract confirmation required — Axion omits an empty parent on update too.
 */
export const toIVRMenuUpdatePayload = (uuid: string, values: IVRMenuFormValues): IVRMenuUpdatePayload => ({
  ...toIVRMenuPayload(values),
  ivr_menu_uuid: uuid,
  ivr_menu_parent_uuid: values.ivr_menu_parent_uuid?.trim() || null,
})

/** Mock-only: a stored record from a create body. `null`s become absent, as the stored type has them. */
const recordFromPayload = (payload: IVRMenuPayload, uuid: string): IVRMenuDetails => ({
  ...payload,
  ivr_menu_uuid: uuid,
  ivr_menu_parent_uuid: payload.ivr_menu_parent_uuid ?? undefined,
  ivr_menu_inter_digit_timeout: payload.ivr_menu_inter_digit_timeout ?? undefined,
})

/**
 * Mock-only PATCH: fields present in the body replace the stored ones (`''`/`null` clear them),
 * fields absent from it are left unchanged. The domain can't change after creation (§15).
 */
const applyUpdatePayload = (existing: IVRMenuDetails, payload: IVRMenuUpdatePayload): IVRMenuDetails => ({
  ...existing,
  ...payload,
  domain_name: existing.domain_name,
  ivr_menu_context: existing.domain_name,
  ivr_menu_parent_uuid: payload.ivr_menu_parent_uuid ?? undefined,
  ivr_menu_inter_digit_timeout: payload.ivr_menu_inter_digit_timeout ?? undefined,
})

const fallbackDomain = () => Object.keys(mockIVRMenuHiveDetails)[0]

/**
 * The list's default domain scope. TODO: backend contract confirmation required — how the real list
 * is scoped to the current domain (header, query param, or session) is unknown. Isolated here so
 * only this function changes once it is.
 */
const getCurrentDomainName = (): string =>
  useDomainStore.getState().currentDomain?.name ?? mockIVRMenuHiveDetails[fallbackDomain()].defaultDomain

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

/**
 * Axion's backend rejects an empty list with "No data found" / "No Data Found"; its interceptor
 * recognizes that by message text and the list treats it as an empty result, not a failure
 * (ivr-menus.md §3 List step 4, §13). Matched the same way here — by message, since the status
 * code isn't documented. TODO: backend contract confirmation required.
 */
const isNoDataFoundError = (error: unknown): error is ApiError =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof error.message === 'string' &&
  error.message.trim().replace(/\.$/, '').toLowerCase() === 'no data found'

/** `wildCardDomains` from a rejection body, which Axion still reads on "No data found" (§3 step 4). */
const wildCardDomainsFromError = (error: ApiError): string[] | undefined => {
  const { data } = error
  if (typeof data !== 'object' || data === null || !('wildCardDomains' in data)) return undefined
  return isStringArray(data.wildCardDomains) ? data.wildCardDomains : undefined
}

/**
 * MOCK stand-in for the list endpoint, emulating Axion's backend: zero matching rows rejects with
 * "No data found" (the 404 status is MOCK-ONLY), carrying `wildCardDomains` like a normal response.
 */
const requestIVRMenuList = async (params: IVRMenuListParams): Promise<IVRMenuListResponse> => {
  await delay(300)
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = params
  const needle = search.trim().toLowerCase()
  const currentDomain = getCurrentDomainName()
  const wildCardDomains = [...(mockIVRMenuHiveDetails[currentDomain]?.domainOptions ?? Object.keys(mockIVRMenuHiveDetails))]

  const filtered = ivrMenus
    .map(toListItem)
    .filter((menu) => showAll || menu.domain_name === currentDomain)
    .filter(
      (menu) =>
        !needle ||
        searchableIVRMenuFields.some((field) => {
          const value = menu[field]
          return typeof value === 'string' && value.toLowerCase().includes(needle)
        })
    )

  const total_records = filtered.length
  if (total_records === 0) {
    const noData: ApiError = { status: 404, message: 'No data found', data: { wildCardDomains } }
    throw noData
  }
  const total_pages = Math.ceil(total_records / pageSize)
  const safePage = Math.min(Math.max(1, page), total_pages)

  return {
    data: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageSize,
    total_records,
    total_pages,
    wildCardDomains,
  }
}

/**
 * GET /ivrMenus/list?pageSize=&pageNumber=&showAll=&search= (§12). Domain-scoped unless `showAll`
 * (which widens the request scope — it is not a paging option, §7/§15); Axion sends no domain
 * param, the scope is the session's. The mock emulates server-side search and paging and clamps an
 * out-of-range page.
 *
 * "No data found" resolves as an empty page 1 (Axion resets the page, §3 step 4) with whatever
 * `wildCardDomains` the rejection carried. Every other failure still rejects.
 */
export const getIVRMenus = async (params: IVRMenuListParams = {}): Promise<IVRMenuListResponse> => {
  try {
    return await requestIVRMenuList(params)
  } catch (error) {
    if (!isNoDataFoundError(error)) throw error
    return {
      data: [],
      page: 1,
      pageSize: params.pageSize ?? defaultPageSize,
      total_records: 0,
      total_pages: 0,
      wildCardDomains: wildCardDomainsFromError(error),
    }
  }
}

/** GET /ivrMenus/details/<uuid> (§12). Unknown uuid → 404 ApiError. */
export const getIVRMenuById = async (uuid: string): Promise<IVRMenuDetails> => {
  await delay(300)
  const record = ivrMenus.find((item) => item.ivr_menu_uuid === uuid)
  if (!record) throw notFoundError(uuid)
  return cloneDetails(record)
}

/**
 * GET /hiveuser/details?module=IVR&domain_name= (§3/§12) — domain options, `autoExt` and extension
 * range for one domain. Also seeds the shared domain store (available domains; current domain only
 * if none is set yet), as every sibling module's mock does.
 *
 * Axion's Edit calls this without `domain_name` (§28/§33); PepperPBX always passes the record's own
 * domain so the extension range matches the record. TODO: backend contract confirmation required.
 */
export const getHiveUserDetails = async (domainName?: string): Promise<IVRMenuHiveDetails> => {
  await delay(300)
  const hive = mockIVRMenuHiveDetails[domainName ?? ''] ?? mockIVRMenuHiveDetails[fallbackDomain()]

  const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
  setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
  if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })

  return { ...hive, domainOptions: [...hive.domainOptions], additionalExtExclude: [...hive.additionalExtExclude] }
}

const domainScoped = (byDomain: Record<string, IVRMenuSelectOptions>, domainName: string): IVRMenuSelectOptions =>
  (byDomain[domainName] ?? []).map((entry) => ('options' in entry ? { ...entry, options: [...entry.options] } : { ...entry }))

/** GET /ivrMenus/destinationDropdown?domain_name= (§12) — Options-row Destination. */
export const getDestinationOptions = async (domainName: string): Promise<IVRMenuSelectOptions> => {
  await delay(250)
  return domainScoped(mockDestinationOptionsByDomain, domainName)
}

/**
 * GET /timeGroups/destinationDropdown?domain_name= (§12/§30). Axion borrows the Time Groups
 * module's endpoint for Exit Action; kept as-is rather than inventing an IVR endpoint.
 * TODO: backend contract confirmation required.
 */
export const getExitActionOptions = async (domainName: string): Promise<IVRMenuSelectOptions> => {
  await delay(250)
  return domainScoped(mockExitActionOptionsByDomain, domainName)
}

/** GET /ivrMenus/optionGreet?domain_name= (§12) — Greet Long / Greet Short. */
export const getGreetOptions = async (domainName: string): Promise<IVRMenuSelectOptions> => {
  await delay(250)
  return domainScoped(mockGreetOptionsByDomain, domainName)
}

/**
 * GET /ivrMenus/parentMenuDropdown?domain_name= (§12) — one `{label, value: uuid}` per IVR in the
 * domain. The mock derives it from the working copy so new/copied IVRs appear. Self-exclusion for
 * Edit is the caller's job (§9). TODO: backend contract confirmation required — `value` assumed to be
 * the IVR uuid (§28 "POTENTIAL").
 */
export const getParentMenuOptions = async (domainName: string): Promise<IVRMenuParentOption[]> => {
  await delay(250)
  return ivrMenus
    .filter((menu) => menu.domain_name === domainName)
    .map((menu) => ({ label: `${menu.ivr_menu_name} (${menu.ivr_menu_extension})`, value: menu.ivr_menu_uuid }))
}

/** GET /ivrMenus/soundDropdown?domain_name= (§12) — Invalid Sound / Exit Sound. */
export const getSoundOptions = async (domainName: string): Promise<IVRMenuSelectOptions> => {
  await delay(250)
  return domainScoped(mockSoundOptionsByDomain, domainName)
}

/** GET /ivrMenus/ringBack?domain_name= (§12). */
export const getRingbackOptions = async (domainName: string): Promise<IVRMenuSelectOptions> => {
  await delay(250)
  return domainScoped(mockRingbackOptionsByDomain, domainName)
}

/** POST /ivrMenus/create — resolves to the new `ivr_menu_uuid` (§11/§12). */
export const createIVRMenu = async (values: IVRMenuFormValues): Promise<string> => {
  await delay(300)
  const payload = toIVRMenuPayload(values)
  const uuid = `ivr-${Date.now()}`
  ivrMenus = [...ivrMenus, recordFromPayload(payload, uuid)]
  return uuid
}

/**
 * PATCH /ivrMenus/update/<uuid> (§11/§12) with the full body, so cleared fields are sent as `''` /
 * `null` rather than omitted. The domain can't change after creation (§15) — the stored one wins.
 */
export const updateIVRMenu = async (uuid: string, values: IVRMenuFormValues): Promise<void> => {
  const payload = toIVRMenuUpdatePayload(uuid, values)
  await delay(300)
  const existing = ivrMenus.find((item) => item.ivr_menu_uuid === uuid)
  if (!existing) throw notFoundError(uuid)
  const updated = applyUpdatePayload(existing, payload)
  ivrMenus = ivrMenus.map((item) => (item.ivr_menu_uuid === uuid ? updated : item))
}

/** DELETE /ivrMenus/delete — body `{ ivr_menu_uuids }` (§11/§12). Single-row and bulk. */
export const deleteIVRMenus = async (uuids: string[]): Promise<void> => {
  await delay(300)
  const payload: IVRMenuUuidsPayload = { ivr_menu_uuids: uuids }
  ivrMenus = ivrMenus
    .filter((item) => !payload.ivr_menu_uuids.includes(item.ivr_menu_uuid))
    // Mock-only: a deleted parent can't stay referenced. Real cascade behavior is backend-owned.
    .map((item) =>
      item.ivr_menu_parent_uuid && payload.ivr_menu_uuids.includes(item.ivr_menu_parent_uuid) ? { ...item, ivr_menu_parent_uuid: undefined } : item
    )
}

/** PATCH /ivrMenus/toggle — body `{ ivr_menu_uuids }` (§11/§12). Backs both the inline Status pill and bulk Toggle. */
export const toggleIVRMenus = async (uuids: string[]): Promise<void> => {
  await delay(200)
  const payload: IVRMenuUuidsPayload = { ivr_menu_uuids: uuids }
  ivrMenus = ivrMenus.map((item) =>
    payload.ivr_menu_uuids.includes(item.ivr_menu_uuid) ? { ...item, ivr_menu_enabled: !item.ivr_menu_enabled } : item
  )
}

/** PATCH /ivrMenus/copy — `{ ivr_menu_copy: [{ extension, name, ivr_menu_uuids }] }` (§11/§27). Stays in the source domain (§15). */
export const copyIVRMenu = async (sourceUuid: string, values: { name: string; extension: string }): Promise<void> => {
  await delay(300)
  const payload: IVRMenuCopyPayload = { ivr_menu_copy: [{ extension: values.extension, name: values.name, ivr_menu_uuids: sourceUuid }] }
  const [entry] = payload.ivr_menu_copy
  const source = ivrMenus.find((item) => item.ivr_menu_uuid === entry.ivr_menu_uuids)
  if (!source) throw notFoundError(entry.ivr_menu_uuids)
  ivrMenus = [
    ...ivrMenus,
    {
      ...cloneDetails(source),
      ivr_menu_uuid: `ivr-copy-${Date.now()}`,
      ivr_menu_name: entry.name,
      ivr_menu_extension: entry.extension,
    },
  ]
}
