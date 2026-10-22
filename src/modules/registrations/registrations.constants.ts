/** Axion's route name (registrations.md §1): a single flat list route. */
export const REGISTRATIONS_PATH = '/registrations/list'

/**
 * Single-key permission, mirroring Axion's `ACTIVE_REGISTRATIONS_PERMISSION` (`pbx_registrations`,
 * registrations.md §14). PLACEHOLDER string following PepperPBX's `<module>.<action>` naming —
 * not a confirmed backend permission name. The module is read-only, so there's no add/edit split.
 */
export const registrationPermissions = {
  view: 'registration.view',
}

/** Axion's page-size choices (§5/§32). */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200]
export const DEFAULT_PAGE_SIZE = 10
