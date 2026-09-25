export interface SelectOption {
  label: string
  value: string
}

/**
 * One labeled group of Structure Action options — GET /api/phrases/playActionOptions and
 * /api/phrases/executeActionOptions both return grouped options. Only `value` is ever stored in
 * `phrase_detail_data`.
 */
export interface ActionOptionGroup {
  label: string
  options: SelectOption[]
}

/** Response body of the play/execute action-option endpoints — `data` is the groups array. */
export interface ActionOptionsResponse {
  data: ActionOptionGroup[]
}

/** Play (music-on-hold file), Pause (duration), or Execute (dialplan hook) — one Structure row's kind. */
export type AnnouncementFunction = 'play-file' | 'pause-execute' | 'execute'

/**
 * One row of the "Structure" (`phrase_details`) array — the audit's core distinctive feature
 * (announcements.md §8/§26/§33). `phrase_detail_data`'s meaning depends on `phrase_detail_function`:
 * a music-on-hold file value for Play, a duration string for Pause, or a dialplan-hook value (or
 * free-typed text) for Execute. The array itself is optional — zero rows is valid (§10/§28).
 */
export interface AnnouncementStructureItem {
  phrase_detail_function: AnnouncementFunction
  phrase_detail_data: string
  phrase_detail_order: number
}

export interface Announcement {
  id: string
  domain: string
  name: string
  /** ISO 639-1 code (e.g. 'en') — the table renders this as "en-English" via iso-639-1's getName(). */
  languageCode: string
  enabled: boolean
  description?: string
}

export interface AnnouncementListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface AnnouncementListResponse {
  data: Announcement[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/**
 * GET /api/hiveuser/details?module=Phrases&domain_name=... — Add/Edit bootstrap. The audit
 * confirms the real bootstrap module param is the singular `Phrases` (announcements.md §3/§26,
 * matching the backend's actual `/api/phrases/*` namespace) — unlike Outbound Routes' bootstrap
 * (where PepperPBX deliberately corrected a confirmed Axion inconsistency), here `Phrases` is
 * documented as the real, intentional value, not a bug, so it's reproduced as-is.
 */
export interface HiveAnnouncementDetails {
  defaultDomain: string
  domainOptions: string[]
}

/**
 * What the Add/Edit form actually collects — ONE shared shape for both modes. Unlike Outbound
 * Routes, the audit documents the same two cards (Basic + Structure) in both Add and Edit
 * (announcements.md §4's Screen/Page Audit), so no field here is mode-conditional except that
 * `domain_name` is locked (not hidden) on Edit — see AnnouncementBasicSection.tsx.
 */
export interface AnnouncementFormValues {
  phrase_name: string
  phrase_language: string
  domain_name: string
  phrase_description?: string
  phrase_enabled: boolean
  phrase_details: AnnouncementStructureItem[]
}

/** The stored/API record shape — the create/update form model as returned by the server. */
export interface AnnouncementDetails extends AnnouncementFormValues {
  phrase_uuid: string
}
