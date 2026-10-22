import type { IVRMenu, IVRMenuFormValues, IVRMenuHiveDetails, IVRMenuOptionFormValues } from './ivr-menu.types'

/** Axion's default page size, also what Reset returns to (ivr-menus.md §3/§6). */
export const defaultPageSize = 10

/** Axion's `dataPerPage` choices (ivr-menus.md §5). */
export const pageSizeOptions = [10, 25, 50, 100, 200]

export const ivrMenuPaths = {
  list: '/ivr-menus',
  add: '/ivr-menus/add',
  edit: (uuid: string) => `/ivr-menus/${encodeURIComponent(uuid)}/edit`,
}

/** Fields the mock list search matches. Real search semantics are backend-owned (§6 — UNKNOWN). */
export const searchableIVRMenuFields: (keyof IVRMenu)[] = ['ivr_menu_name', 'ivr_menu_extension', 'ivr_menu_description', 'domain_name']

/**
 * The Axion endpoints the service stands in for (ivr-menus.md §12), normalized to a leading `/`
 * (Axion mixes both, §12/§33). Not a confirmed PepperPBX backend contract.
 */
export const ivrMenuEndpoints = {
  list: '/ivrMenus/list',
  create: '/ivrMenus/create',
  update: '/ivrMenus/update',
  details: '/ivrMenus/details',
  delete: '/ivrMenus/delete',
  toggle: '/ivrMenus/toggle',
  copy: '/ivrMenus/copy',
  destinationOptions: '/ivrMenus/destinationDropdown',
  /** Cross-module: Axion borrows the Time Groups endpoint here (§12/§30). TODO: backend contract confirmation required. */
  exitActionOptions: '/timeGroups/destinationDropdown',
  greetOptions: '/ivrMenus/optionGreet',
  parentMenuOptions: '/ivrMenus/parentMenuDropdown',
  soundOptions: '/ivrMenus/soundDropdown',
  ringbackOptions: '/ivrMenus/ringBack',
  hiveUserDetails: '/hiveuser/details?module=IVR',
} as const

/**
 * Axion's literal permission keys (ivr-menus.md §1/§14, `IVRMENUS_PERMISSION` in Axion's
 * `pbxConfig/permissions.js`) — the same literal-key approach Extensions uses
 * (`extensionPermissionStrings`). `all` is the module-admin key. Axion has no separate delete/
 * toggle/copy keys; those actions are derived from these in useIVRMenuPermissions.
 * `admin`/`axionTech` are Axion's global wildcards: Copy (§14) and the Show All gate (§15).
 * TODO: backend contract confirmation required — RBAC is foundation-only and nothing populates the
 * store yet.
 */
export const ivrMenuPermissions = {
  view: 'pbx_ivrmenus_view',
  add: 'pbx_ivrmenus_add',
  edit: 'pbx_ivrmenus_edit',
  all: 'pbx_ivrmenus_all',
  admin: 'pbx_admin',
  axionTech: 'pbx_axiontech',
} as const

/**
 * Axion's only static Language option, `en-us callie` (§8). Confirmed static in Axion.
 * TODO: backend contract confirmation required — the stored value format (`en/us/callie` assumed).
 */
export const languageOptions = [{ label: 'en-us callie', value: 'en/us/callie' }]

/** Order select: 000–999 padded labels, numeric-string values (§5/§8). */
export const orderOptions = Array.from({ length: 1000 }, (_, index) => ({
  label: String(index).padStart(3, '0'),
  value: String(index),
}))

/** A fresh Options row — Axion's `{option_digits:'', destination:'', order:'0', description:''}` (§3). */
export const emptyOptionRow = (): IVRMenuOptionFormValues => ({ option_digits: '', destination: '', order: '0', description: '' })

/** Axion's Add defaults (ivr-menus.md §3/§26) — the single source of truth for both pages and the form. */
export const ivrMenuFormDefaults = {
  ivr_menu_enabled: true,
  ivr_menu_direct_dial: false,
  ivr_menu_timeout: '3000',
  ivr_menu_ringback: '${us-ring}',
  ivr_menu_invalid_sound: 'ivr/ivr-that_was_an_invalid_entry.wav',
  ivr_menu_confirm_key: '#',
  ivr_menu_tts_engine: 'flite',
  ivr_menu_tts_voice: 'rms',
  ivr_menu_confirm_attempts: '1',
  ivr_menu_inter_digit_timeout: '2000',
  ivr_menu_max_failures: '1',
  ivr_menu_max_timeouts: '1',
  ivr_menu_digit_len: '5',
} satisfies Partial<IVRMenuFormValues>

/**
 * Domain-scoped values reset when the domain changes in Add (§9/§20): every field whose options come
 * from a domain-scoped list goes back to its Add default (or empty), so no other domain's value survives.
 */
export const domainScopedResetValues: Partial<IVRMenuFormValues> = {
  ivr_menu_parent_uuid: undefined,
  ivr_menu_greet_long: undefined,
  ivr_menu_greet_short: undefined,
  exit_action: undefined,
  ivr_menu_ringback: ivrMenuFormDefaults.ivr_menu_ringback,
  ivr_menu_invalid_sound: ivrMenuFormDefaults.ivr_menu_invalid_sound,
  ivr_menu_exit_sound: undefined,
}

/** Add-mode initial values: audited defaults, one empty Options row, the domain's `autoExt`, context = domain. */
export const getDefaultIVRMenuFormValues = (hive: IVRMenuHiveDetails, domainName: string): Partial<IVRMenuFormValues> => ({
  ...ivrMenuFormDefaults,
  domain_name: domainName,
  ivr_menu_context: domainName,
  ivr_menu_name: '',
  ivr_menu_extension: hive.autoExt,
  options: [emptyOptionRow()],
})

/** Axion's shared delete warning (`deleteMessage('IVR menu')`, §3/§20). */
export const ivrMenuDeleteWarning =
  'Note: Please ensure that this IVR menu is not linked to any other records before proceeding, as deleting it may affect related data.'

/** Axion's `CommonExtInput` note under the extension field. */
export { extensionReuseNote } from '../../components/common/extensionReuseNote'
