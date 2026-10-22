import type { ToggleSelectOption, ToggleSelectOptions } from '../../components/common/ToggleSelectInput'

/** One digit-key → destination mapping, as stored/sent (ivr-menus.md §5/§8/§27). `order` is numeric on the wire. */
export interface IVRMenuOption {
  /** Free text — Axion deliberately allows multi-digit / special-char sequences, not just single 0–9, star or hash keys (§33). */
  option_digits: string
  destination: string
  order: number
  description: string
}

/** Lean list/table entity (ivr-menus.md §5). */
export interface IVRMenu {
  ivr_menu_uuid: string
  domain_name: string
  ivr_menu_name: string
  ivr_menu_extension: string
  ivr_menu_enabled: boolean
  ivr_menu_description?: string
}

/** GET /api/ivrMenus/list — query: pageSize, pageNumber, showAll, search (§12). */
export interface IVRMenuListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface IVRMenuListResponse {
  data: IVRMenu[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
  /**
   * Axion reads `wildCardDomains` from the list response — and from a "No data found" rejection —
   * to gate Show All (§3/§15). Absent when the response didn't carry it; callers keep their last value.
   */
  wildCardDomains?: string[]
}

/**
 * The full stored record (ivr-menus.md §8). Numeric settings are real numbers here — Axion coerces
 * them to `Number` on submit (§27). Optional text fields are absent when blank.
 */
export interface IVRMenuDetails {
  ivr_menu_uuid: string
  domain_name: string
  /** Always mirrors `domain_name` (§26). */
  ivr_menu_context: string
  ivr_menu_name: string
  ivr_menu_extension: string
  ivr_menu_parent_uuid?: string
  ivr_menu_language?: string
  ivr_menu_greet_long: string
  ivr_menu_greet_short?: string
  ivr_menu_timeout: number
  exit_action?: string
  ivr_menu_ringback?: string
  ivr_menu_cid_prefix?: string
  ivr_menu_direct_dial: boolean
  ivr_menu_enabled: boolean
  ivr_menu_description?: string
  options: IVRMenuOption[]
  // Advanced (§8 AdvancedForm)
  ivr_menu_invalid_sound?: string
  ivr_menu_exit_sound?: string
  ivr_menu_pin_number?: string
  ivr_menu_confirm_macro?: string
  ivr_menu_confirm_key?: string
  ivr_menu_tts_engine?: string
  ivr_menu_tts_voice?: string
  ivr_menu_confirm_attempts: number
  ivr_menu_inter_digit_timeout?: number
  ivr_menu_max_failures: number
  ivr_menu_max_timeouts: number
  ivr_menu_digit_len: number
}

/** An Options row as the form edits it — `order` is the Order select's string value (§8). */
export interface IVRMenuOptionFormValues {
  option_digits?: string
  destination?: string
  order?: string
  description?: string
}

/**
 * What the shared Add/Edit form collects. Differs from IVRMenuDetails: numeric settings are text
 * inputs (validated as digit strings, coerced by the service, §27), and Options rows carry a string
 * `order`. `ivr_menu_context` is shown read-only but is always re-derived from the domain.
 */
export interface IVRMenuFormValues {
  domain_name: string
  ivr_menu_context: string
  ivr_menu_name: string
  /** Free text — the value may carry Axion's `**` prefix. */
  ivr_menu_extension: string
  ivr_menu_parent_uuid?: string
  ivr_menu_language?: string
  ivr_menu_greet_long: string
  ivr_menu_greet_short?: string
  ivr_menu_timeout: string
  exit_action?: string
  ivr_menu_ringback?: string
  ivr_menu_cid_prefix?: string
  ivr_menu_direct_dial: boolean
  ivr_menu_enabled: boolean
  ivr_menu_description?: string
  options: IVRMenuOptionFormValues[]
  ivr_menu_invalid_sound?: string
  ivr_menu_exit_sound?: string
  ivr_menu_pin_number?: string
  ivr_menu_confirm_macro?: string
  ivr_menu_confirm_key?: string
  ivr_menu_tts_engine?: string
  ivr_menu_tts_voice?: string
  ivr_menu_confirm_attempts: string
  ivr_menu_inter_digit_timeout?: string
  ivr_menu_max_failures: string
  ivr_menu_max_timeouts: string
  ivr_menu_digit_len: string
}

/**
 * POST /ivrMenus/create body — the form normalized once (§27), see `toIVRMenuPayload`.
 *
 * Every editable text field is always present: `''` means "blank / cleared" and is never dropped,
 * so the same body can clear a stored value on update. Numbers are real numbers; `false` and `0`
 * are kept as-is. Parent Menu follows Axion: omitted on create when none is chosen (§3 step 6).
 */
export interface IVRMenuPayload {
  domain_name: string
  /** Always the domain (§26). */
  ivr_menu_context: string
  ivr_menu_name: string
  ivr_menu_extension: string
  /** Create: omitted when none. Update: `null` when cleared — see IVRMenuUpdatePayload. */
  ivr_menu_parent_uuid?: string | null
  ivr_menu_language: string
  ivr_menu_greet_long: string
  ivr_menu_greet_short: string
  ivr_menu_timeout: number
  exit_action: string
  ivr_menu_ringback: string
  ivr_menu_cid_prefix: string
  ivr_menu_direct_dial: boolean
  ivr_menu_enabled: boolean
  ivr_menu_description: string
  options: IVRMenuOption[]
  ivr_menu_invalid_sound: string
  ivr_menu_exit_sound: string
  ivr_menu_pin_number: string
  ivr_menu_confirm_macro: string
  ivr_menu_confirm_key: string
  ivr_menu_tts_engine: string
  ivr_menu_tts_voice: string
  ivr_menu_confirm_attempts: number
  /** Optional numeric field: `null` when blank (never `0`, which would be a real 0 ms timeout). */
  ivr_menu_inter_digit_timeout: number | null
  ivr_menu_max_failures: number
  ivr_menu_max_timeouts: number
  ivr_menu_digit_len: number
}

/**
 * PATCH /ivrMenus/update/<uuid> body — Axion's full form payload plus `ivr_menu_uuid` (§11). Every
 * field is sent, so nothing the user cleared is silently left unchanged by PATCH semantics.
 * TODO: backend contract confirmation required — `''` / `null` as "clear this field".
 */
export interface IVRMenuUpdatePayload extends IVRMenuPayload {
  ivr_menu_uuid: string
  ivr_menu_parent_uuid: string | null
}

/**
 * PATCH /api/ivrMenus/copy body (§3/§11/§27). Axion's Copy is row-level only (one source record per
 * entry, like every sibling module's copy entry), so `ivr_menu_uuids` carries that one source uuid
 * as a string. TODO: backend contract confirmation required — the audit gives the plural key name
 * but not its runtime type; if the backend wants `string[]`, change it here and in `copyIVRMenu`.
 */
export interface IVRMenuCopyPayload {
  ivr_menu_copy: { extension: string; name: string; ivr_menu_uuids: string }[]
}

/** DELETE /api/ivrMenus/delete and PATCH /api/ivrMenus/toggle body (§11/§12). */
export interface IVRMenuUuidsPayload {
  ivr_menu_uuids: string[]
}

/**
 * Domain-scoped option lists (§12). Grouped `{label, options}` or flat — the shape
 * `ToggleSelectInput` / `Select` already accept. Value formats are backend-owned.
 */
export type IVRMenuSelectOptions = ToggleSelectOptions

/** Parent Menu options: one flat entry per IVR in the domain, `value` = its uuid (§9/§28). */
export type IVRMenuParentOption = ToggleSelectOption

/** The six dropdown lists the Add/Edit form needs for one domain (§3/§24). */
export interface IVRMenuFormOptions {
  destinationOptions: IVRMenuSelectOptions
  exitActionOptions: IVRMenuSelectOptions
  greetOptions: IVRMenuSelectOptions
  parentMenuOptions: IVRMenuParentOption[]
  soundOptions: IVRMenuSelectOptions
  ringbackOptions: IVRMenuSelectOptions
}

/**
 * GET /api/hiveuser/details?module=IVR&domain_name= — Add/Edit/Copy bootstrap (§3/§12/§26).
 * Field names are Axion's. The extension range comes from here, never from Axion's static
 * `extensionConfig.ivr` table (§26/§33).
 */
export interface IVRMenuHiveDetails {
  defaultDomain: string
  domainOptions: string[]
  /** Suggested next extension for the domain. */
  autoExt: string
  additionalExtStart?: number
  /** Upper bound — PepperPBX skips the check when absent rather than failing every value. */
  additionalExtEnd?: number
  additionalExtExclude: string[]
}
