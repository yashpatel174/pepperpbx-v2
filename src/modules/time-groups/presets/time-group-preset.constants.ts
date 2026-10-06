import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  fullDayTimeFrom,
  fullDayTimeTo,
  getBrowserTimeZone,
} from '../time-group.constants'
import type {
  FestivalName,
  PresetFestival,
  TimeGroupPreset,
  TimeGroupPresetFormValues,
} from './time-group-preset.types'

export const presetPaths = {
  list: '/time-groups/presets',
  add: '/time-groups/presets/add',
  edit: (uuid: string) => `/time-groups/presets/${encodeURIComponent(uuid)}/edit`,
}

/** Fields the mock list search matches. Real matching semantics are backend-owned. */
export const searchablePresetFields: (keyof TimeGroupPreset)[] = [
  'name',
  'description',
]

/**
 * The Axion endpoints the service stands in for (time-groups.md §12, `PRESET.*`).
 * Not a confirmed PepperPBX backend contract — the service is mock-only until it is.
 */
export const presetEndpoints = {
  list: '/presets/list',
  create: '/presets/create',
  update: '/presets/update',
  details: '/presets/details',
  delete: '/presets/delete',
  toggle: '/presets/toggle',
  copy: '/presets/copy',
} as const

/** Axion's `deleteMessage('preset')`. */
export const presetDeleteWarning =
  'Note: Please ensure that this preset is not linked to any other records before proceeding, as deleting it may affect related data.'

/** Festival dates are `MM-DD-YYYY` strings (Axion's `DatePickerFestival`). */
export const presetDateFormat = 'MM-DD-YYYY'

/** Axion's holiday list shows this year plus the next 3 (`getHolidaysForNextYears(3)`). */
const UPCOMING_YEARS = 3

/**
 * Convert a local Date to YYYY-MM-DD.
 *
 * Do not use `toISOString()` here because it can shift the calendar date
 * when the browser is running in a negative-offset timezone.
 */
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * Get the nth occurrence of a weekday in a month.
 *
 * weekday:
 *   0 = Sunday
 *   1 = Monday
 *   ...
 *   6 = Saturday
 *
 * n = -1 means the last occurrence in the month.
 */
const nthWeekday = (
  year: number,
  month: number,
  weekday: number,
  n: number,
) => {
  if (n === -1) {
    const last = new Date(year, month + 1, 0)

    last.setDate(
      last.getDate() - ((last.getDay() - weekday + 7) % 7),
    )

    return last
  }

  const first = new Date(year, month, 1)

  first.setDate(
    1 + ((weekday - first.getDay() + 7) % 7) + (n - 1) * 7,
  )

  return first
}

interface HolidayDefinition {
  festival_name: FestivalName
  label: string
  title: string
  /** Axion's rule text shown in the tooltip. */
  description: string
  date: (year: number) => Date
}

/**
 * Axion's 14 configured holidays.
 *
 * These definitions mirror the holiday names, titles and rule descriptions
 * from Axion's `getHolidaysForNextYears.js`.
 */
const holidayDefinitions: HolidayDefinition[] = [
  {
    festival_name: 'new_years_day',
    label: "New Year's Day",
    title: "New Year's Day",
    description: '1st January',
    date: (year) => new Date(year, 0, 1),
  },
  {
    festival_name: 'martin_luther_king_jr_day',
    label: 'Martin Luther King Jr. Day',
    title: 'Birthday of Martin Luther King, Jr.',
    description: 'Third Monday in January',
    date: (year) => nthWeekday(year, 0, 1, 3),
  },
  {
    festival_name: 'washingtons_birthday',
    label: "Washington's Birthday",
    title: "Washington's Birthday",
    description: 'Third Monday in February',
    date: (year) => nthWeekday(year, 1, 1, 3),
  },
  {
    festival_name: 'memorial_day',
    label: 'Memorial Day',
    title: 'Memorial Day',
    description: 'Last Monday in May',
    date: (year) => nthWeekday(year, 4, 1, -1),
  },
  {
    festival_name: 'juneteenth',
    label: 'Juneteenth',
    title: 'Juneteenth National Independence Day',
    description: '19th June',
    date: (year) => new Date(year, 5, 19),
  },
  {
    festival_name: 'independence_day',
    label: 'Independence Day',
    title: 'Independence Day',
    description: '4th July',
    date: (year) => new Date(year, 6, 4),
  },
  {
    festival_name: 'labor_day',
    label: 'Labor Day',
    title: 'Labor Day',
    description: 'First Monday in September',
    date: (year) => nthWeekday(year, 8, 1, 1),
  },
  {
    festival_name: 'columbus_day',
    label: 'Columbus Day',
    title: 'Columbus Day',
    description: 'Second Monday in October',
    date: (year) => nthWeekday(year, 9, 1, 2),
  },
  {
    festival_name: 'veterans_day',
    label: 'Veterans Day',
    title: 'Veterans Day',
    description: '11th November',
    date: (year) => new Date(year, 10, 11),
  },
  {
    festival_name: 'thanksgiving_day',
    label: 'Thanksgiving Day',
    title: 'Thanksgiving Day',
    description: 'Fourth Thursday in November',
    date: (year) => nthWeekday(year, 10, 4, 4),
  },
  {
    festival_name: 'black_friday',
    label: 'Black Friday',
    title: 'Black Friday',
    description: 'Day after Thanksgiving',
    date: (year) => {
      const thanksgivingDate = nthWeekday(year, 10, 4, 4)

      // Preserve Axion's actual implementation:
      // Thanksgiving + 2 days.
      thanksgivingDate.setDate(thanksgivingDate.getDate() + 2)

      return thanksgivingDate
    },
  },
  {
    festival_name: 'christmas_eve',
    label: 'Christmas Eve',
    title: 'Christmas Eve',
    description: '24th December',
    date: (year) => new Date(year, 11, 24),
  },
  {
    festival_name: 'christmas_day',
    label: 'Christmas Day',
    title: 'Christmas Day',
    description: '25th December',
    date: (year) => new Date(year, 11, 25),
  },
  {
    festival_name: 'new_years_eve',
    label: "New Year's Eve",
    title: "New Year's Eve",
    description: '31st December',
    date: (year) => new Date(year, 11, 31),
  },
]

export const festivalNames: FestivalName[] =
  holidayDefinitions.map((holiday) => holiday.festival_name)

/**
 * Creates the top-level festival flags used by Axion's preset payload.
 *
 * Example:
 * {
 *   new_years_day: true,
 *   christmas_day: false,
 *   ...
 * }
 */
export const festivalFlags = (festivals: PresetFestival[]) =>
  Object.fromEntries(
    festivalNames.map((name) => [
      name,
      festivals.some((item) => item.festival_name === name),
    ]),
  ) as Record<FestivalName, boolean>

export const festivalLabel = (name: FestivalName) =>
  holidayDefinitions.find(
    (holiday) => holiday.festival_name === name,
  )?.label ?? name

export interface HolidayOption {
  festival_name: FestivalName
  label: string
  title: string
  description: string

  /** Current year's date in YYYY-MM-DD format. */
  current_year_date: string

  /** Next 3 years' dates in YYYY-MM-DD format. */
  upcoming_dates: string[]
}

/**
 * Returns the Axion holiday checkbox options.
 *
 * Axion displays:
 * - current year
 * - next year
 * - following year
 * - third following year
 */
export const getHolidayOptions = (
  currentYear = new Date().getFullYear(),
): HolidayOption[] =>
  holidayDefinitions.map((holiday) => ({
    festival_name: holiday.festival_name,
    label: holiday.label,
    title: holiday.title,
    description: holiday.description,
    current_year_date: toIsoDate(holiday.date(currentYear)),
    upcoming_dates: Array.from(
      { length: UPCOMING_YEARS },
      (_, index) =>
        toIsoDate(holiday.date(currentYear + index + 1)),
    ),
  }))

/** YYYY-MM-DD → MM-DD-YYYY. */
export const isoToPresetDate = (iso: string) => {
  const [year, month, day] = iso.split('-')

  return `${month}-${day}-${year}`
}

/**
 * MM-DD-YYYY → sortable YYYYMMDD number.
 *
 * Returns null for malformed values.
 */
export const presetDateToNumber = (
  value?: string,
): number | null => {
  const match = value
    ? /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
    : null

  if (!match) {
    return null
  }

  return Number(`${match[3]}${match[1]}${match[2]}`)
}

/**
 * Form.Item props for a DatePicker whose form value is
 * stored as an MM-DD-YYYY string.
 */
export const datePickerItemProps = {
  getValueProps: (value?: string) => {
    const match = value
      ? /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
      : null

    return {
      value: match
        ? dayjs(
            new Date(
              Number(match[3]),
              Number(match[1]) - 1,
              Number(match[2]),
            ),
          )
        : undefined,
    }
  },

  normalize: (value: Dayjs | null) =>
    value ? value.format(presetDateFormat) : '',
}

/**
 * Creates a new selected holiday using Axion's defaults:
 *
 * - Full Day enabled
 * - Date From = current year's holiday date
 * - Date To = current year's holiday date
 * - Full-day time range
 * - Browser timezone
 */
export const newPresetFestival = (
  option: HolidayOption,
): PresetFestival => ({
  festival_name: option.festival_name,
  current_year_date: option.current_year_date,
  full_day: true,
  time_from: fullDayTimeFrom,
  time_to: fullDayTimeTo,
  date_from: isoToPresetDate(option.current_year_date),
  date_to: isoToPresetDate(option.current_year_date),
  time_zone: getBrowserTimeZone(),
})

/**
 * Add-mode defaults from Axion's `AddPreset`.
 *
 * The preset starts with no selected holidays.
 */
export const getDefaultPresetFormValues = (
  domainName: string,
): TimeGroupPresetFormValues => ({
  name: '',
  domain_name: domainName,
  description: undefined,
  festivals: [],
})