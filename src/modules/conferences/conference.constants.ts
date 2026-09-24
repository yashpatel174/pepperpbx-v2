import type { Conference, ConferenceFormValues, ConferenceHiveDetails } from './conference.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

export const conferenceStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by fetchConferences' search filter (see conference.service.ts). */
export const searchableConferenceFields: (keyof Conference)[] = ['name', 'extension', 'profile', 'description', 'domain']

/**
 * Order select options — 000–999 zero-padded labels, matching the audit's documented
 * `orderOptions` exactly (conferences.md §2/§21/§26's `utilities/selectOptions.js`). Generated
 * once at module load, not per-render. The stored/submitted value stays numeric (see
 * conference.types.ts's ConferenceFormValues doc comment) — only the displayed label is
 * zero-padded.
 */
export const orderOptions: { label: string; value: number }[] = Array.from({ length: 1000 }, (_, value) => ({
  label: String(value).padStart(3, '0'),
  value,
}))

/**
 * Four-key granular permission module, matching the audit's documented `CONFERENCES_PERMISSION`
 * shape (`pbx_conference_view/add/edit/all`, conferences.md §14/§33) — same shape as Call Center
 * Queue's/Announcements'/Call Block's `use<Feature>Permissions`. RBAC is foundation-only right now
 * — the store starts empty and is populated from the backend later — so an empty store is treated
 * as "everything granted" rather than locking the module, matching the convention already
 * established across every other module.
 *
 * The audit documents that Axion's identical `CONFERENCES_PERMISSION` is also shared by four
 * sibling modules (Conference Centers/Rooms/Controls/Profiles, conferences.md §14/§30/§33) — none
 * of which exist in PepperPBX yet. This module owns its own placeholder permission set per
 * CLAUDE.md's `<module>.<action>` naming rule; if/when those sibling modules are built, whether
 * they should reuse these exact strings is a decision for that future task, not invented here.
 */
export const conferencePermissions = {
  view: 'conference.view',
  add: 'conference.add',
  edit: 'conference.edit',
  all: 'conference.manage',
}

/**
 * Add-mode form defaults. Confirmed Axion defaults (conferences.md §3/§8/§26): `conference_enabled`
 * true, `conference_profile` 'default', `conference_order` 0.
 */
export const getDefaultConferenceFormValues = (hive: ConferenceHiveDetails): ConferenceFormValues => ({
  conference_name: '',
  conference_extension: hive.autoExtension,
  conference_profile: 'default',
  conference_account_code: hive.accountCode,
  domain_name: hive.defaultDomain,
  conference_order: 0,
  conference_enabled: true,
})
