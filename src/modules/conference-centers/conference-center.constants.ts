import type { ConferenceCenter, ConferenceCenterFormValues, HiveUserConferenceDetails } from './conference-center.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

/** This module's own routes (see conference-centers.router.tsx). */
export const conferenceCenterPaths = {
  list: '/conference-centers',
  add: '/conference-centers/add',
  edit: (uuid: string) => `/conference-centers/${uuid}/edit`,
}

export const conferenceCenterStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by the mock list's server-side search emulation (see conference-center.service.ts). */
export const searchableConferenceCenterFields: (keyof ConferenceCenter)[] = ['name', 'extension', 'greeting', 'description', 'domain']

/** PIN Length select — 3 through 100 allowed PIN digits (conference-centers.md §8/§26). */
export const pinLengthOptions: { label: string; value: number }[] = Array.from({ length: 98 }, (_, index) => ({
  label: String(index + 3),
  value: index + 3,
}))

/**
 * The Axion endpoints this module's service stands in for (conference-centers.md §11/§12). Not the
 * confirmed PepperPBX backend contract — kept in one place so the real paths can be swapped in
 * without touching any caller once the backend exists.
 */
export const conferenceCenterEndpoints = {
  list: '/conference/center/list',
  create: '/conference/center/create',
  update: (uuid: string) => `/conference/center/update/${uuid}`,
  details: (uuid: string) => `/conference/center/details/${uuid}`,
  delete: '/conference/center/delete',
  toggle: '/conference/center/toggle',
  greetings: '/conference/center/listGreetings',
  hiveUserDetails: '/hiveuser/details',
} as const

/**
 * Axion shares ONE permission object (`CONFERENCES_PERMISSION`: `pbx_conference_view/add/edit/
 * all`) across Conferences, Conference Centers, Rooms, Controls and Profiles, and the audit says not
 * to split it (conference-centers.md §14/§33). These are therefore the exact same placeholder
 * strings the Conferences module already uses (conference.constants.ts) — not new names. They're
 * repeated rather than imported because modules in this codebase don't import from each other.
 */
export const conferenceCenterPermissions = {
  view: 'conference.view',
  add: 'conference.add',
  edit: 'conference.edit',
  all: 'conference.manage',
}

/** Add-mode defaults: only `conference_center_enabled: true` plus hive-provided values (conference-centers.md §3/§26). */
export const getDefaultConferenceCenterFormValues = (hive: HiveUserConferenceDetails): Partial<ConferenceCenterFormValues> => ({
  conference_center_name: '',
  conference_center_extension: hive.autoExtension,
  conference_center_account_code: hive.accountCode,
  domain_name: hive.defaultDomain,
  conference_center_enabled: true,
})
