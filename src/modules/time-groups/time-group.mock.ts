import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import { allWeekdays, monthOptions, workWeekdays } from './time-group.constants'
import type { MonthDayKey, MonthKey, TimeGroupHiveDetails, TimeGroupRangeRecord, TimeGroupRecord, WeekdayKey } from './time-group.types'

/**
 * Mock data for time-group.service.ts only. Domains are the same three every sibling module seeds,
 * so the shared (persisted) current-domain store always matches one of them.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'
const DOMAINS = [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

export const mockTimeGroupHiveDetails: Record<string, TimeGroupHiveDetails> = Object.fromEntries(
  DOMAINS.map((domain) => [domain, { defaultDomain: domain, domainOptions: DOMAINS }])
)

const CURRENT_YEAR = new Date().getFullYear()

interface RangeSeed {
  order: number
  time_from?: string
  time_to?: string
  time_zone?: string
  weekdays?: WeekdayKey[]
  months?: MonthKey[]
  monthDays?: number[]
  year?: string
  apply_on_all_years?: boolean
}

/** Builds an API-shaped range (one boolean flag per weekday / month / day-of-month, §27). */
const range = (seed: RangeSeed): TimeGroupRangeRecord => {
  const weekdays = seed.weekdays ?? []
  const months = seed.months ?? []
  const monthDays = seed.monthDays ?? []
  const fullDay = !seed.time_from && !seed.time_to
  const record = {
    order: seed.order,
    full_day: fullDay,
    time_from: seed.time_from ?? '12:00 AM',
    time_to: seed.time_to ?? '11:59 PM',
    time_zone: seed.time_zone ?? 'America/New_York',
    enabled_all_days: weekdays.length === allWeekdays.length,
    enabled_week_days: weekdays.length === workWeekdays.length && workWeekdays.every((day) => weekdays.includes(day)),
    advance_settings: months.length > 0 || monthDays.length > 0 || seed.year !== undefined,
    apply_on_all_years: seed.apply_on_all_years ?? false,
    year: seed.year ?? String(CURRENT_YEAR),
    ...Object.fromEntries(allWeekdays.map((day) => [day, weekdays.includes(day)])),
    ...Object.fromEntries(monthOptions.map(({ value }) => [value, months.includes(value)])),
    ...Object.fromEntries(
      Array.from({ length: 31 }, (_, index): [MonthDayKey, boolean] => [`day_${index + 1}`, monthDays.includes(index + 1)])
    ),
  }
  return record as TimeGroupRangeRecord
}

const record = (
  uuid: string,
  domain: string,
  name: string,
  order: number | null,
  description: string,
  groups: TimeGroupRangeRecord[]
): TimeGroupRecord => ({
  dialplan_uuid: uuid,
  name,
  domain_name: domain,
  order,
  context: domain,
  description,
  enabled: true,
  groups,
})

/** Seed records, detail-shaped (§12). */
export const mockTimeGroups: TimeGroupRecord[] = [
  record('tg-101', DEFAULT_DOMAIN, 'Business Hours', 505, 'Weekday office hours', [
    range({ order: 510, time_from: '09:00 AM', time_to: '05:00 PM', weekdays: workWeekdays }),
  ]),
  // Multiple ranges in one group: split weekday shift plus a Saturday morning.
  record('tg-102', DEFAULT_DOMAIN, 'Support Shifts', 515, 'Split weekday shift and Saturday morning', [
    range({ order: 520, time_from: '08:00 AM', time_to: '12:00 PM', weekdays: workWeekdays }),
    range({ order: 525, time_from: '01:00 PM', time_to: '06:00 PM', weekdays: workWeekdays }),
    range({ order: 530, time_from: '10:00 AM', time_to: '02:00 PM', weekdays: ['week_saturday'], time_zone: 'Europe/London' }),
  ]),
  // Date-based ranges via Advance Settings (month + day-of-month), recurring on every year.
  record('tg-103', DEFAULT_DOMAIN, 'Public Holidays', 535, 'New Year and Christmas closures', [
    range({
      order: 540,
      weekdays: allWeekdays,
      months: ['month_january'],
      monthDays: [1],
      year: `${CURRENT_YEAR},2099`,
      apply_on_all_years: true,
    }),
    range({
      order: 545,
      weekdays: allWeekdays,
      months: ['month_december'],
      monthDays: [25, 26],
      year: `${CURRENT_YEAR},2099`,
      apply_on_all_years: true,
    }),
  ]),
  record('tg-104', DEFAULT_DOMAIN, 'Lunch Break', null, '', [
    range({ order: 501, time_from: '12:00 PM', time_to: '01:00 PM', weekdays: allWeekdays }),
  ]),
  record('tg-105', DEFAULT_DOMAIN, 'Weekend', 550, 'All day Saturday and Sunday', [
    range({ order: 555, weekdays: ['week_saturday', 'week_sunday'] }),
  ]),
  // A two-year window (Axion's year range picker allows up to two years, §8).
  record('tg-106', DEFAULT_DOMAIN, 'Summer Hours', 560, 'Short Fridays in July and August', [
    range({
      order: 565,
      time_from: '09:00 AM',
      time_to: '01:00 PM',
      weekdays: ['week_friday'],
      months: ['month_july', 'month_august'],
      year: `${CURRENT_YEAR},${CURRENT_YEAR + 1}`,
    }),
  ]),
  ...Array.from({ length: 7 }, (_, index) =>
    record(`tg-2${String(index).padStart(2, '0')}`, DEFAULT_DOMAIN, `Department ${index + 1} Hours`, 570 + (index % 5) * 5, '', [
      range({ order: 505, time_from: '08:00 AM', time_to: index % 2 === 0 ? '04:00 PM' : '06:00 PM', weekdays: workWeekdays }),
    ])
  ),
  record('tg-301', BRANCH_DOMAIN, 'Branch Hours', 505, 'Branch opening hours', [
    range({ order: 510, time_from: '08:00 AM', time_to: '06:00 PM', weekdays: workWeekdays, time_zone: 'America/Chicago' }),
  ]),
  record('tg-302', BRANCH_DOMAIN, 'Branch Closures', 515, '', [
    range({ order: 520, weekdays: allWeekdays, months: ['month_november'], monthDays: [27, 28] }),
  ]),
  record('tg-401', AXION_SAMPLE_DOMAIN, 'Office Hours', 505, 'Front desk coverage', [
    range({ order: 510, time_from: '10:00 AM', time_to: '04:00 PM', weekdays: workWeekdays, time_zone: 'Asia/Kolkata' }),
  ]),
  record('tg-402', AXION_SAMPLE_DOMAIN, 'After Hours', 515, 'Weeknights', [
    range({ order: 520, time_from: '06:00 PM', time_to: '11:50 PM', weekdays: workWeekdays, time_zone: 'Asia/Kolkata' }),
    range({ order: 525, time_from: '12:00 AM', time_to: '08:00 AM', weekdays: workWeekdays, time_zone: 'Asia/Kolkata' }),
  ]),
]
