import type { ConferenceProfile, ConferenceProfileFormValues, ConferenceProfileParam } from './conference-profile.types'

/** Axion's search commit and Reset both return to page size 10 (conference-profiles.md §3/§6). */
export const defaultPageSize = 10

/**
 * The audit doesn't list Axion's page-size choices, only its 200-row maximum (§5); these are the
 * sibling conference modules' options, which top out at the same 200.
 */
export const pageSizeOptions = [10, 25, 50, 100, 200]

/**
 * Routes. The `/conferenceProfiles/...` paths are Axion's and are kept, as the sibling conference
 * modules keep theirs (conference-profiles.md §1). Edit takes the uuid as `?conference_profile_uuid=`.
 */
export const conferenceProfilePaths = {
  list: '/conferenceProfiles/list',
  add: '/conferenceProfiles/add',
  edit: (uuid: string) => `/conferenceProfiles/edit?conference_profile_uuid=${encodeURIComponent(uuid)}`,
}

export const conferenceProfileStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by the mock list's server-side search emulation — real backend semantics are unknown (§6). */
export const searchableConferenceProfileFields: (keyof ConferenceProfile)[] = ['profile_name', 'profile_description']

/**
 * The Axion endpoints this module's service stands in for (conference-profiles.md §11/§12). Not
 * the confirmed PepperPBX backend contract. Axion defines no delete or copy endpoint for this module.
 * The Conferences/Conference Rooms profile dropdown uses a separate `/conferences/profileOptions`
 * endpoint (§27/§33), owned by those modules — not by this one.
 */
export const conferenceProfileEndpoints = {
  list: '/conference/profile/list',
  create: '/conference/profile/create',
  update: (uuid: string) => `/conference/profile/update/${uuid}`,
  details: (uuid: string) => `/conference/profile/details/${uuid}`,
  toggle: '/conference/profile/toggle',
} as const

/**
 * Axion's shared `CONFERENCES_PERMISSION` (`pbx_conference_view/add/edit/all`) covers all five
 * conference modules and must not be split (conference-profiles.md §14/§33). These are the same
 * placeholder strings the sibling conference modules already use — repeated, not imported, because
 * modules here don't import from each other.
 */
export const conferenceProfilePermissions = {
  view: 'conference.view',
  add: 'conference.add',
  edit: 'conference.edit',
  all: 'conference.manage',
}

/** Add-mode defaults — only `profile_enabled: true` (conference-profiles.md §3/§8). */
export const defaultConferenceProfileFormValues: Partial<ConferenceProfileFormValues> = {
  profile_name: '',
  profile_enabled: true,
}

/** A newly appended parameter row — `profile_param_enabled: true`, as Axion's `append(...)` (§8). */
export const newConferenceProfileParam: Partial<ConferenceProfileParam> = {
  profile_param_enabled: true,
}
