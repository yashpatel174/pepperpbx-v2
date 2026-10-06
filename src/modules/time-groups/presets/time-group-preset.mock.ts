import { MOCK_DEFAULT_DOMAIN } from '../../../store/domain'
import { festivalFlags, getHolidayOptions, isoToPresetDate, toIsoDate } from './time-group-preset.constants'
import type { FestivalName, PresetFestival, TimeGroupPresetRecord } from './time-group-preset.types'

/**
 * Mock data for time-group-preset.service.ts only. Same three domains the Time Groups mock (and
 * every sibling module) seeds; dates are computed for the current year so they stay realistic.
 */
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

const holidayDates = Object.fromEntries(getHolidayOptions().map((option) => [option.festival_name, option.current_year_date]))

interface FestivalSeed {
  name: FestivalName
  time_from?: string
  time_to?: string
  /** Days to extend Date To past the holiday itself. */
  extraDays?: number
  time_zone?: string
}

const festival = ({ name, time_from, time_to, extraDays = 0, time_zone = 'America/New_York' }: FestivalSeed): PresetFestival => {
  const iso = holidayDates[name]
  const end = new Date(`${iso}T00:00:00`)
  end.setDate(end.getDate() + extraDays)
  const endIso = toIsoDate(end)
  const fullDay = !time_from && !time_to
  return {
    festival_name: name,
    current_year_date: iso,
    full_day: fullDay,
    time_from: time_from ?? '12:00 AM',
    time_to: time_to ?? '11:59 PM',
    date_from: isoToPresetDate(iso),
    date_to: isoToPresetDate(endIso),
    time_zone,
  }
}

const preset = (
  uuid: string,
  domain: string,
  name: string,
  description: string,
  enable: boolean,
  festivals: PresetFestival[]
): TimeGroupPresetRecord => ({
  ...festivalFlags(festivals),
  preset_uuid: uuid,
  name,
  domain_name: domain,
  description,
  enable,
  festivals,
})

export const mockTimeGroupPresets: TimeGroupPresetRecord[] = [
  preset('tgp-101', MOCK_DEFAULT_DOMAIN, 'US Federal Holidays', 'Office closed on federal holidays', true, [
    festival({ name: 'new_years_day' }),
    festival({ name: 'memorial_day' }),
    festival({ name: 'independence_day' }),
    festival({ name: 'labor_day' }),
    festival({ name: 'thanksgiving_day' }),
    festival({ name: 'christmas_day' }),
  ]),
  // Partial days plus a multi-day window.
  preset('tgp-102', MOCK_DEFAULT_DOMAIN, 'Year End Closures', 'Early close on the eves', true, [
    festival({ name: 'christmas_eve', time_from: '01:00 PM', time_to: '11:50 PM' }),
    festival({ name: 'christmas_day', extraDays: 1 }),
    festival({ name: 'new_years_eve', time_from: '02:00 PM', time_to: '11:50 PM' }),
  ]),
  preset('tgp-103', MOCK_DEFAULT_DOMAIN, 'Thanksgiving Weekend', '', false, [
    festival({ name: 'thanksgiving_day' }),
    festival({ name: 'black_friday', extraDays: 2 }),
  ]),
  preset('tgp-104', MOCK_DEFAULT_DOMAIN, 'Monday Holidays', 'Long weekend Mondays', true, [
    festival({ name: 'martin_luther_king_jr_day' }),
    festival({ name: 'washingtons_birthday' }),
    festival({ name: 'columbus_day' }),
  ]),
  preset('tgp-201', BRANCH_DOMAIN, 'Branch Holidays', 'Branch closures', true, [
    festival({ name: 'juneteenth', time_zone: 'America/Chicago' }),
    festival({ name: 'veterans_day', time_zone: 'America/Chicago' }),
  ]),
  preset('tgp-301', AXION_SAMPLE_DOMAIN, 'Office Holidays', '', true, [festival({ name: 'independence_day', time_zone: 'America/Los_Angeles' })]),
]
