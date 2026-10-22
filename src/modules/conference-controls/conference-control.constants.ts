import type { ConferenceControl, ConferenceControlDetail, ConferenceControlFormValues } from './conference-control.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

/**
 * Routes. The `/conferenceControls/...` paths are Axion's and are kept, as Conference Rooms keeps
 * its own (conference-controls.md §1). Edit takes the uuid as `?conference_control_uuid=`.
 */
export const conferenceControlPaths = {
  list: '/conferenceControls/list',
  add: '/conferenceControls/add',
  edit: (uuid: string) => `/conferenceControls/edit?conference_control_uuid=${encodeURIComponent(uuid)}`,
}

export const conferenceControlStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by the mock list's server-side search emulation — real backend semantics are unknown (§6). */
export const searchableConferenceControlFields: (keyof ConferenceControl)[] = ['control_name', 'control_description']

/**
 * Digits select — 0 through 999 (conference-controls.md §8/§26), generated rather than Axion's
 * 1000-line hardcoded `maxMemberOptions` list (§28).
 */
export const controlDigitOptions: { label: string; value: number }[] = Array.from({ length: 1000 }, (_, value) => ({
  label: String(value),
  value,
}))

/**
 * The Axion endpoints this module's service stands in for (conference-controls.md §11/§12). Not
 * the confirmed PepperPBX backend contract. Axion defines no delete endpoint for this module.
 */
export const conferenceControlEndpoints = {
  list: '/conference/control/list',
  create: '/conference/control/create',
  update: (uuid: string) => `/conference/control/update/${uuid}`,
  details: (uuid: string) => `/conference/control/details/${uuid}`,
  toggle: '/conference/control/toggle',
} as const

/**
 * Axion's shared `CONFERENCES_PERMISSION` (`pbx_conference_view/add/edit/all`) covers all five
 * conference modules and must not be split (conference-controls.md §14/§33). These are the same
 * placeholder strings the sibling conference modules already use — repeated, not imported, because
 * modules here don't import from each other.
 */
export const conferenceControlPermissions = {
  view: 'conference.view',
  add: 'conference.add',
  edit: 'conference.edit',
  all: 'conference.manage',
}

/** Add-mode defaults — only `control_enabled: true` (conference-controls.md §3/§8). */
export const defaultConferenceControlFormValues: Partial<ConferenceControlFormValues> = {
  control_name: '',
  control_enabled: true,
}

/** A newly appended DTMF row — `control_detail_enabled: true`, as Axion's `append(...)` (§8). */
export const newConferenceControlDetail: Partial<ConferenceControlDetail> = {
  control_detail_enabled: true,
}
