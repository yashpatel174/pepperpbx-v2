/** Axion's route names (active-conferences.md §1): list, and one conference's live members under /view. */
export const ACTIVE_CONFERENCES_PATH = '/activeConferences/list'
export const ACTIVE_CONFERENCE_VIEW_PATH = '/activeConferences/view'

/** The Conferences (configuration) list — target of Axion's "View Conference List" button (§4/§30). */
export const CONFERENCES_PATH = '/conferences'

/**
 * Single-key permission, mirroring Axion's `ACTIVE_CONFERENCES_PERMISSION` (`pbx_conference_admin`,
 * active-conferences.md §14). PLACEHOLDER string following PepperPBX's `<module>.<action>` naming —
 * not a confirmed backend permission name. The module is read-only, so there's no add/edit split.
 */
export const activeConferencePermissions = {
  view: 'activeConference.view',
}
