/** Axion's route name (active-calls.md §1): a single flat list route. */
export const ACTIVE_CALLS_PATH = '/activecalls/list'

/**
 * Single-key permission, mirroring Axion's `ACTIVE_CALLS_PERMISSION` (`pbx_activecalls`,
 * active-calls.md §14). PLACEHOLDER string following PepperPBX's `<module>.<action>` naming —
 * not a confirmed backend permission name. The module is read-only, so there's no add/edit split.
 */
export const activeCallPermissions = {
  view: 'activeCall.view',
}

/** Axion's page-size choices (§5). */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200]
export const DEFAULT_PAGE_SIZE = 10

/**
 * Display format for `created`. Axion uses `dateFormatUS` (§5); its exact pattern isn't in the
 * audit, so a US-style date + 12-hour time is assumed.
 */
export const CREATED_DATE_FORMAT = 'MM/DD/YYYY hh:mm:ss A'

/**
 * Domain treated as the user's own when Show All is off. Axion reads `localStorage['defaultDomain']`
 * (§15); PepperPBX has no populated domain store yet, so the mock service uses this stand-in.
 */
export const MOCK_DEFAULT_DOMAIN = 'acme.pepperpbx.test'
