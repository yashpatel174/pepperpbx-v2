import type { Announcement, AnnouncementFormValues, AnnouncementFunction, HiveAnnouncementDetails, SelectOption } from './announcement.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

export const announcementStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by fetchAnnouncements' search filter (see announcement.service.ts). */
export const searchableAnnouncementFields: (keyof Announcement)[] = ['name', 'description', 'domain']

/** Structure row "Function" options — Play/Pause/Execute (announcements.md §8's `functionOptions`). */
export const functionOptions: { label: string; value: AnnouncementFunction }[] = [
  { label: 'Play', value: 'play-file' },
  { label: 'Pause', value: 'pause-execute' },
  { label: 'Execute', value: 'execute' },
]

/**
 * Static Pause duration options, 0.1–5.0 seconds in 0.1 increments (announcements.md §8's
 * `pauseActionOptions`) — the one Structure action input that isn't domain-scoped/server-provided.
 */
export const pauseActionOptions: SelectOption[] = Array.from({ length: 50 }, (_, index) => {
  const value = ((index + 1) / 10).toFixed(1)
  return { label: value, value }
})

/**
 * Structure row "Order" options, 000–999 (announcements.md §8/§26/§33's `orderOptions`) — the
 * audit itself questions whether a 1000-entry range is intentional (§28), but explicitly lists it
 * under "Preserve" (§33), not "Fix", so it's reproduced as documented rather than trimmed.
 * `value` stays numeric (unlike the zero-padded `label`) so `phrase_detail_order` never needs a
 * string→number conversion at the service boundary — see outbound-route.service.ts's `limit` for
 * the analogous gap this deliberately avoids.
 */
export const structureOrderOptions: { label: string; value: number }[] = Array.from({ length: 1000 }, (_, index) => ({
  label: String(index).padStart(3, '0'),
  value: index,
}))

/**
 * Four-key granular permission module (announcements.md §14/§33) — `view`/`add`/`edit` plus an
 * `all` module-admin bypass, richer than Outbound Routes'/Gateways'/Destinations' single coarse
 * gate. Deliberately module-local placeholder strings per CLAUDE.md's `<module>.<action>` naming
 * rule — not a reproduction of Axion's literal `pbx_announcements_*` names.
 *
 * NOT reproduced: the audit's per-row permission flags (`original[perm]` checked against each
 * list row, announcements.md §14/§25/§33) — PepperPBX's `Announcement` list entity carries no
 * per-record permission data, and no confirmed backend contract exists for one, so row-level
 * checks here fall back to the module-level booleans only (see useAnnouncementPermissions.ts).
 */
export const announcementPermissions = {
  view: 'announcement.view',
  add: 'announcement.add',
  edit: 'announcement.edit',
  all: 'announcement.manage',
}

/**
 * Axion's `pbx_admin || pbx_axiontech` gate on the Execute Action select ↔ free-text toggle
 * (ToggleSelectInput's `canToggle`, announcements.md §8).
 */
export const announcementFreeTextPermissions = ['pbx_admin', 'pbx_axiontech'] as const

/**
 * Add-mode form defaults. Confirmed Axion defaults (announcements.md §3/§26): `phrase_enabled`
 * true, `phrase_language` 'en'. `phrase_details` starts empty — the Structure array is optional,
 * with no minimum-rows requirement (announcements.md §10/§28), unlike Outbound Routes' Gateways.
 */
export const getDefaultAnnouncementFormValues = (hive: HiveAnnouncementDetails): AnnouncementFormValues => ({
  phrase_name: '',
  phrase_language: 'en',
  domain_name: hive.defaultDomain,
  phrase_enabled: true,
  phrase_details: [],
})
