/**
 * Lean list/table entity (time-groups.md §5). Field names are Axion's list payload keys; only the
 * service builds these.
 */
export interface TimeGroup {
  dialplan_uuid: string
  /** Shown only in Show All mode (§5/§25). */
  domain_name: string
  dialplan_name: string
  dialplan_context: string
  /** Empty when the record has no main order (Order is optional, §8). */
  dialplan_order: number | null
  dialplan_description: string
}

/** GET /api/timeGroups/list — query: pageSize, pageNumber, showAll, search (§3/§12). */
export interface TimeGroupListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface TimeGroupListResponse {
  data: TimeGroup[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
  /** Axion reads `wildCardDomains` from the list response to gate Show All (§3/§15). */
  wildCardDomains: string[]
}

export type WeekdayKey =
  | 'week_monday'
  | 'week_tuesday'
  | 'week_wednesday'
  | 'week_thursday'
  | 'week_friday'
  | 'week_saturday'
  | 'week_sunday'

export type MonthKey =
  | 'month_january'
  | 'month_february'
  | 'month_march'
  | 'month_april'
  | 'month_may'
  | 'month_june'
  | 'month_july'
  | 'month_august'
  | 'month_september'
  | 'month_october'
  | 'month_november'
  | 'month_december'

/** `day_1` … `day_31` (§8). */
export type MonthDayKey = `day_${number}`

/**
 * One time range ("group") as the API carries it (§8/§27): every weekday, month and day-of-month is
 * its own boolean flag, times are `hh:mm A` strings and `year` is a comma-joined string
 * (`"2026"`, `"2026,2027"`, or `"2026,2099"` for Apply on All Years, §26).
 * BACKEND CONTRACT REQUIRED: the shape is Axion's, unconfirmed for PepperPBX.
 */
export type TimeGroupRangeRecord = {
  order: number
  full_day: boolean
  time_from: string
  time_to: string
  time_zone: string
  /** Derived from the weekday flags; submitted alongside them, as Axion does (§27). */
  enabled_all_days: boolean
  enabled_week_days: boolean
  advance_settings: boolean
  apply_on_all_years: boolean
  year: string
} & Record<WeekdayKey, boolean> &
  Record<MonthKey, boolean> &
  Record<MonthDayKey, boolean>

/** GET /api/timeGroups/details/:uuid — `data` (§12). Also the create/update payload shape (§27). */
export interface TimeGroupRecord {
  dialplan_uuid: string
  name: string
  domain_name: string
  /** Optional main order (§8). */
  order: number | null
  /** Always mirrors `domain_name` (§9/§26). */
  context: string
  description: string
  /** Defaults to false on create; no UI edits it (§26). Carried through untouched. */
  enabled: boolean
  groups: TimeGroupRangeRecord[]
}

/**
 * One time range as the form edits it. Unlike the API's per-day/per-month boolean flags, the form
 * holds arrays (Checkbox.Group values) and the year as numbers — the service maps between the two,
 * so nothing outside it sees the flag shape.
 */
export interface TimeGroupRangeFormValues {
  order: number
  full_day: boolean
  /** `hh:mm A`. */
  time_from: string
  /** `hh:mm A`. */
  time_to: string
  time_zone: string
  weekdays: WeekdayKey[]
  advance_settings: boolean
  apply_on_all_years: boolean
  /** Up to two years, or `[currentYear, 2099]` when Apply on All Years is on (§8). */
  year: number[]
  months: MonthKey[]
  /** 1–31. */
  month_days: number[]
}

/** What the shared Add/Edit form collects and what create/update submit (§8). */
export interface TimeGroupFormValues {
  name: string
  domain_name: string
  /** Optional; `undefined` when not chosen. */
  order?: number
  /** Read-only mirror of `domain_name`. */
  context: string
  description?: string
  groups: TimeGroupRangeFormValues[]
}

/** The normalized record the Edit page works with — form model plus server-owned fields. */
export interface TimeGroupDetails extends TimeGroupFormValues {
  dialplan_uuid: string
  enabled: boolean
}

/**
 * GET /api/hiveuser/details?module=TimeGroup&domain_name= — Add/Edit bootstrap (§3/§12). Only the
 * domain fields are used by this module.
 */
export interface TimeGroupHiveDetails {
  defaultDomain: string
  domainOptions: string[]
}
