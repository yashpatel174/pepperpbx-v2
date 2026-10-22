/**
 * Time Group Presets — ported from Axion's `timeGroup/components/presets/**` and the
 * `elements/Festivals/**` form it renders (`FestivalForm`, `FestivalCheckForm`,
 * `FestivalGroupArrayForm`, `FestivalFullDayTimeForm`). time-groups.md §1/§2/§12 list the routes
 * and endpoints; the field set below is read from that Axion source, not from the audit.
 */

/** The 14 US holidays Axion's `getHolidaysForNextYears` offers, snake_cased as Axion stores them. */
export type FestivalName =
  | 'new_years_day'
  | 'martin_luther_king_jr_day'
  | 'washingtons_birthday'
  | 'memorial_day'
  | 'juneteenth'
  | 'independence_day'
  | 'labor_day'
  | 'columbus_day'
  | 'veterans_day'
  | 'thanksgiving_day'
  | 'black_friday'
  | 'christmas_eve'
  | 'christmas_day'
  | 'new_years_eve'

/**
 * One selected holiday ("festival") and its window, as Axion submits it after stripping the
 * display-only `title`/`description`/`upcoming_years`/`current_year` keys.
 */
export interface PresetFestival {
  festival_name: FestivalName
  /** The holiday's date this year, `YYYY-MM-DD`. */
  current_year_date: string
  full_day: boolean
  /** `hh:mm A`; forced to 12:00 AM when `full_day`. */
  time_from: string
  /** `hh:mm A`; forced to 11:59 PM when `full_day`. */
  time_to: string
  /** `MM-DD-YYYY`. */
  date_from: string
  /** `MM-DD-YYYY`. */
  date_to: string
  time_zone: string
}

/** Lean list/table entity — the keys Axion's `LIstPreset` columns read. */
export interface TimeGroupPreset {
  preset_uuid: string
  /** Shown only in Show All mode. */
  domain_name: string
  name: string
  /** "Status" pill. */
  enable: boolean
  description: string
}

/** GET /api/presets/list — query: pageSize, pageNumber, showAll, search (time-groups.md §12). */
export interface TimeGroupPresetListParams {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface TimeGroupPresetListResponse {
  data: TimeGroupPreset[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
  wildCardDomains: string[]
}

/**
 * GET /api/presets/details/:uuid?domain_name= — the stored record. Besides the `festivals` array,
 * Axion's payload carries one top-level boolean per holiday (`new_years_day: true`, …) mirroring
 * which festivals are selected; the service derives those flags, so nothing else handles them.
 *
 * TODO (backend): Axion's Edit also reads `start_date`/`end_date` off the details payload, but no
 * form field uses them and their meaning is undocumented — not modelled until the contract is known.
 * BACKEND CONTRACT REQUIRED: the whole shape is Axion's, unconfirmed for PepperPBX.
 */
export type TimeGroupPresetRecord = {
  preset_uuid: string
  name: string
  domain_name: string
  description: string
  enable: boolean
  festivals: PresetFestival[]
} & Record<FestivalName, boolean>

/** What the shared Add/Edit form collects and create/update submit. */
export interface TimeGroupPresetFormValues {
  name: string
  domain_name: string
  description?: string
  festivals: PresetFestival[]
}

/** The normalized record the Edit page works with — form model plus server-owned fields. */
export interface TimeGroupPresetDetails extends TimeGroupPresetFormValues {
  preset_uuid: string
  enable: boolean
}
