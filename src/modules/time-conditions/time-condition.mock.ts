import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { TimeConditionDetailsRecord, TimeConditionHiveDetails } from './time-condition.types'

/**
 * Mock data for time-condition.service.ts only. Domains are the same three every sibling module
 * seeds, so the shared (persisted) current-domain store always matches one of them, whichever
 * module bootstrapped first. Destination options come from the Destinations module's
 * `getActionOptions` (§30), which falls back to its default domain's options for other domains.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'
const DOMAINS = [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/** Destination values as the Destinations mock's options carry them. */
const ACTION_DOMAIN = 'sip.axionhq.hivepbx.com'
const transfer = (number: string) => `transfer:${number} XML ${ACTION_DOMAIN}`

/**
 * MOCK Hive bootstrap per domain. The 1000–1499 bounds mirror Axion's usual Time Condition range,
 * standing in for the real bootstrap response — validation always reads the range from here, never
 * hardcodes it (§26/§33).
 */
export const mockTimeConditionHiveDetails: Record<string, TimeConditionHiveDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '1013',
    excludeExt: [],
    additionalExtStart: 1000,
    additionalExtEnd: 1499,
    additionalExtExclude: ['1499'],
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: BRANCH_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '1102',
    excludeExt: [],
    additionalExtStart: 1000,
    additionalExtEnd: 1499,
    additionalExtExclude: [],
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: AXION_SAMPLE_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '1203',
    excludeExt: [],
    additionalExtStart: 1000,
    additionalExtEnd: 1499,
    additionalExtExclude: [],
  },
}

/**
 * MOCK Time Group presets per domain — what `/api/timeCondition/timeGroup/dropdown` returns and
 * what the list's server-side join resolves into `dialplan_name` (Time Group) + `name` (Preset).
 */
export interface MockTimeGroupPreset {
  uuid: string
  timeGroup: string
  preset: string
}

export const mockTimeGroupPresetsByDomain: Record<string, MockTimeGroupPreset[]> = {
  [DEFAULT_DOMAIN]: [
    { uuid: 'tgp-101', timeGroup: 'Business Hours', preset: 'Weekdays 9-5' },
    { uuid: 'tgp-102', timeGroup: 'Business Hours', preset: 'Saturday 10-2' },
    { uuid: 'tgp-103', timeGroup: 'Holidays', preset: 'Public Holidays' },
    { uuid: 'tgp-104', timeGroup: 'Lunch Break', preset: 'Daily 12-1' },
  ],
  [BRANCH_DOMAIN]: [
    { uuid: 'tgp-201', timeGroup: 'Branch Hours', preset: 'Weekdays 8-6' },
    { uuid: 'tgp-202', timeGroup: 'Branch Holidays', preset: 'Branch Closures' },
  ],
  [AXION_SAMPLE_DOMAIN]: [
    { uuid: 'tgp-301', timeGroup: 'Office Hours', preset: 'Weekdays 10-4' },
    { uuid: 'tgp-302', timeGroup: 'After Hours', preset: 'Weeknights 6pm-8am' },
  ],
}

/** Seed records, detail-shaped (`time_condition_time_group_uuid`, §27). */
export const mockTimeConditions: TimeConditionDetailsRecord[] = [
  {
    time_condition_uuid: 'tc-100',
    domain_name: DEFAULT_DOMAIN,
    time_condition_name: 'Default Business Hours',
    time_condition_extension: '1000',
    time_condition_time_group_uuid: 'tgp-101',
    time_match_action: transfer('101'),
    time_not_match_action: transfer('*99101'),
    enabled: true,
    // System-created: no Edit/Delete, not selectable (§26).
    default: true,
  },
  {
    time_condition_uuid: 'tc-101',
    domain_name: DEFAULT_DOMAIN,
    time_condition_name: 'Main Line Hours',
    time_condition_extension: '1001',
    time_condition_time_group_uuid: 'tgp-101',
    time_match_action: transfer('5000'),
    time_not_match_action: transfer('*99102'),
    enabled: true,
    default: false,
  },
  {
    time_condition_uuid: 'tc-102',
    domain_name: DEFAULT_DOMAIN,
    time_condition_name: 'Saturday Sales',
    time_condition_extension: '1002',
    time_condition_time_group_uuid: 'tgp-102',
    time_match_action: transfer('8000'),
    time_not_match_action: 'hangup',
    enabled: false,
    default: false,
  },
  {
    time_condition_uuid: 'tc-103',
    domain_name: DEFAULT_DOMAIN,
    time_condition_name: 'Holiday Closure',
    time_condition_extension: '1003',
    time_condition_time_group_uuid: 'tgp-103',
    time_match_action: 'phrase:welcome-announcement',
    time_not_match_action: transfer('5000'),
    enabled: true,
    default: false,
  },
  {
    // A saved destination the dropdown no longer lists — exercises the "Other" fallback (§25/§27).
    time_condition_uuid: 'tc-104',
    domain_name: DEFAULT_DOMAIN,
    time_condition_name: 'Legacy Support Line',
    time_condition_extension: '1004',
    time_condition_time_group_uuid: 'tgp-104',
    time_match_action: transfer('8009'),
    time_not_match_action: transfer('8001'),
    enabled: true,
    default: false,
  },
  ...Array.from({ length: 8 }, (_, index): TimeConditionDetailsRecord => ({
    time_condition_uuid: `tc-2${String(index).padStart(2, '0')}`,
    domain_name: DEFAULT_DOMAIN,
    time_condition_name: `Department ${index + 1} Hours`,
    time_condition_extension: `10${String(5 + index).padStart(2, '0')}`,
    time_condition_time_group_uuid: index % 2 === 0 ? 'tgp-101' : 'tgp-104',
    time_match_action: transfer(index % 2 === 0 ? '101' : '102'),
    time_not_match_action: index % 3 === 0 ? 'hangup' : transfer('*98'),
    enabled: index % 3 !== 1,
    default: false,
  })),
  {
    time_condition_uuid: 'tc-300',
    domain_name: BRANCH_DOMAIN,
    time_condition_name: 'Branch Opening Hours',
    time_condition_extension: '1100',
    time_condition_time_group_uuid: 'tgp-201',
    time_match_action: transfer('201'),
    time_not_match_action: transfer('*99201'),
    enabled: true,
    default: false,
  },
  {
    time_condition_uuid: 'tc-301',
    domain_name: BRANCH_DOMAIN,
    time_condition_name: 'Branch Closures',
    time_condition_extension: '1101',
    time_condition_time_group_uuid: 'tgp-202',
    time_match_action: transfer('5000'),
    time_not_match_action: transfer('202'),
    enabled: false,
    default: false,
  },
  {
    time_condition_uuid: 'tc-400',
    domain_name: AXION_SAMPLE_DOMAIN,
    time_condition_name: 'Front Desk Hours',
    time_condition_extension: '1200',
    time_condition_time_group_uuid: 'tgp-301',
    time_match_action: transfer('101'),
    time_not_match_action: transfer('*99101'),
    enabled: true,
    default: false,
  },
  {
    time_condition_uuid: 'tc-401',
    domain_name: AXION_SAMPLE_DOMAIN,
    time_condition_name: 'After Hours Routing',
    time_condition_extension: '1201',
    time_condition_time_group_uuid: 'tgp-302',
    time_match_action: transfer('*98'),
    time_not_match_action: transfer('5000'),
    enabled: false,
    default: false,
  },
  {
    time_condition_uuid: 'tc-402',
    domain_name: AXION_SAMPLE_DOMAIN,
    time_condition_name: 'Support Weekday Hours',
    time_condition_extension: '1202',
    time_condition_time_group_uuid: 'tgp-301',
    time_match_action: transfer('8001'),
    time_not_match_action: 'hangup',
    enabled: true,
    default: false,
  },
]
