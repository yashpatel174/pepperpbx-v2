export interface SelectOption {
  label: string
  value: string
}

/**
 * Lean list/table entity — deliberately NOT the full Add/Edit shape (see ConferenceFormValues/
 * ConferenceDetails below), matching the entity-vs-form-values separation convention established
 * by every sibling module (Extensions/Gateways/Destinations/Outbound Routes/Call Center Queue).
 */
export interface Conference {
  id: string
  domain: string
  name: string
  extension: string
  profile?: string
  order: number
  enabled: boolean
  description?: string
}

export interface ConferenceListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface ConferenceListResult {
  data: Conference[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** GET /api/conferences/profileOptions (conferences.md §8/§11/§12/§27 — the audit's own data-
 * transformation note suggests this endpoint returns a flat, non-domain-scoped options array). */
export type ConferenceProfileOption = SelectOption

/** The Domain select's own option shape — kept as a named type per this module's own convention,
 * distinct from the generic SelectOption used for Profile, even though both are structurally
 * `{label, value}` today. */
export type ConferenceDomainOption = SelectOption

/**
 * GET /api/hiveuser/details?module=Conference&domain_name=... — Add/Edit/Copy bootstrap
 * (conferences.md §8/§9/§12/§26/§33). `autoExtension`/`extensionRangeStart`/`extensionRangeEnd`/
 * `extensionExclude` drive `conference_extension`'s validation — the audit documents a reference
 * 3000–3999 range (§26) sourced from this bootstrap response rather than hardcoded in validation
 * code, matching the server-driven-range pattern already established for Extensions/Call Center
 * Queue. `accountCode` is the server-derived, always-read-only Account Code field's value.
 */
export interface ConferenceHiveDetails {
  defaultDomain: string
  domainOptions: string[]
  autoExtension: string
  extensionRangeStart: number
  extensionRangeEnd: number
  extensionExclude: string[]
  accountCode: string
}

/**
 * What the Add/Edit form actually collects — ONE shared shape for both modes, matching every
 * sibling module's `Add<Feature>Page`/`Edit<Feature>Page` sharing one `<Feature>Form`.
 * `conference_order` stays numeric (a Select bound to discrete 0–999 options, matching Outbound
 * Routes' identical `dialplan_order: number` convention) rather than a string coerced at submit —
 * the audit's own documented `Number(conference_order)` coercion is therefore a no-op here, not a
 * required transform.
 */
export interface ConferenceFormValues {
  conference_name: string
  /** Supports an optional embedded `**` prefix, matching Extensions' own extension pattern
   * (conferences.md §8/§10: "matches `**?digits`") — kept as free text, never `type="number"`,
   * since a native number input cannot accept the `**` prefix. */
  conference_extension: string
  conference_pin_number?: string
  conference_profile?: string
  conference_flags?: string
  conference_email_address?: string
  /** Always read-only — server/hive-derived, never user-editable in either mode. */
  conference_account_code?: string
  /** Editable on Add, locked (disabled) on Edit — conferences.md §15/§26: a conference can't move
   * between domains after creation. */
  domain_name: string
  conference_order: number
  conference_description?: string
  conference_enabled: boolean
}

/** The stored/API record shape — the create/update form model as returned by the server. */
export interface ConferenceDetails extends ConferenceFormValues {
  conference_uuid: string
}
