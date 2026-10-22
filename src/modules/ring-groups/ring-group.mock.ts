import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { AlertInfoGroup, RingGroupHiveDetails, RingGroupOption, RingGroupRecord } from './ring-group.types'

/**
 * Mock data for ring-group.service.ts only. Domains are the same three every sibling module seeds,
 * so the shared current-domain store matches whichever module bootstrapped first.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'
const DOMAINS = [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/**
 * MOCK Hive bootstrap per domain. The 8000–8999 bounds stand in for the real bootstrap response —
 * the live range is whatever that response returns (ring-groups.md §26/§33); validation always
 * reads it from here, never hardcodes it.
 */
export const mockRingGroupHiveDetails: Record<string, RingGroupHiveDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '8020',
    additionalExtStart: 8000,
    additionalExtEnd: 8999,
    additionalExtExclude: ['8999'],
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: BRANCH_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '8001',
    additionalExtStart: 8000,
    additionalExtEnd: 8999,
    additionalExtExclude: [],
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: AXION_SAMPLE_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '8001',
    additionalExtStart: 8000,
    additionalExtEnd: 8999,
    additionalExtExclude: [],
  },
}

/**
 * MOCK domain-scoped option groups. Values are illustrative — the real option value format is
 * backend-owned (ring-groups.md §12).
 */
const destinationsFor = (extensions: [string, string][]): RingGroupOption[] => [
  {
    label: 'Extensions',
    options: extensions.map(([number, name]) => ({ label: `${number} ${name}`, value: number })),
  },
]

const timeoutDestinationsFor = (domain: string, extensions: [string, string][]): RingGroupOption[] => [
  {
    label: 'Extensions',
    options: extensions.map(([number, name]) => ({ label: `${number} ${name}`, value: `transfer:${number} XML ${domain}` })),
  },
  {
    label: 'Voicemail',
    options: extensions.map(([number, name]) => ({ label: `Voicemail ${number} ${name}`, value: `transfer:*99${number} XML ${domain}` })),
  },
  { label: 'Other', options: [{ label: 'Hangup', value: 'hangup' }] },
]

const DEFAULT_EXTENSIONS: [string, string][] = [
  ['1001', 'Front Desk'],
  ['1002', 'Sales Desk'],
  ['1003', 'Support Desk'],
  ['1004', 'Billing'],
]
const BRANCH_EXTENSIONS: [string, string][] = [
  ['201', 'Branch Reception'],
  ['202', 'Branch Support'],
]
const AXION_EXTENSIONS: [string, string][] = [['3001', 'Operator']]

export const mockDestinationOptionsByDomain: Record<string, RingGroupOption[]> = {
  [DEFAULT_DOMAIN]: destinationsFor(DEFAULT_EXTENSIONS),
  [BRANCH_DOMAIN]: destinationsFor(BRANCH_EXTENSIONS),
  [AXION_SAMPLE_DOMAIN]: destinationsFor(AXION_EXTENSIONS),
}

export const mockTimeoutDestinationOptionsByDomain: Record<string, RingGroupOption[]> = {
  [DEFAULT_DOMAIN]: timeoutDestinationsFor(DEFAULT_DOMAIN, DEFAULT_EXTENSIONS),
  [BRANCH_DOMAIN]: timeoutDestinationsFor(BRANCH_DOMAIN, BRANCH_EXTENSIONS),
  [AXION_SAMPLE_DOMAIN]: timeoutDestinationsFor(AXION_SAMPLE_DOMAIN, AXION_EXTENSIONS),
}

const recordingGroup = (recordings: string[]): RingGroupOption[] =>
  recordings.length ? [{ label: 'Recordings', options: recordings.map((name) => ({ label: name, value: name })) }] : []

const labelledGroup = (label: string, entries: [string, string][]): RingGroupOption => ({
  label,
  options: entries.map(([value, optionLabel]) => ({ label: optionLabel, value })),
})

/**
 * MOCK greeting options (GET /api/ringGroups/greetings, §12). Greeting lists every group; Remote /
 * Too Late Announce list only the `Recordings` group (§9/§34.1), so the announcement entries live
 * there. Values are stable file-style ids for later replacement by real backend values.
 */
const dummyGreetingOptions: RingGroupOption[] = [
  labelledGroup('Greetings', [
    ['default-greeting.wav', 'Default Greeting'],
    ['welcome-greeting.wav', 'Welcome Greeting'],
    ['business-hours-greeting.wav', 'Business Hours Greeting'],
    ['after-hours-greeting.wav', 'After Hours Greeting'],
    ['holiday-greeting.wav', 'Holiday Greeting'],
  ]),
  labelledGroup('Recordings', [
    ['remote-announce-1.wav', 'Remote Announce 1'],
    ['remote-announce-2.wav', 'Remote Announce 2'],
    ['remote-announce-3.wav', 'Remote Announce 3'],
    ['after-hours-announcement.wav', 'After Hours Announcement'],
    ['business-hours-announcement.wav', 'Business Hours Announcement'],
    ['too-late-announcement-1.wav', 'Too Late Announcement 1'],
    ['too-late-announcement-2.wav', 'Too Late Announcement 2'],
    ['call-queue-timeout.wav', 'Call Queue Timeout'],
    ['no-answer-announcement.wav', 'No Answer Announcement'],
    ['extended-ring-announcement.wav', 'Extended Ring Announcement'],
  ]),
]

export const mockGreetingOptionsByDomain: Record<string, RingGroupOption[]> = Object.fromEntries(
  DOMAINS.map((domain) => [domain, dummyGreetingOptions])
)

/** Ring back: standard FreeSWITCH tones plus the domain's recordings. */
const ringBackFor = (recordings: string[]): RingGroupOption[] => [
  {
    label: 'Ringtones',
    options: ['us-ring', 'uk-ring', 'fr-ring', 'de-ring', 'it-ring', 'au-ring'].map((tone) => ({ label: tone, value: tone })),
  },
  ...recordingGroup(recordings),
]

export const mockRingBackOptionsByDomain: Record<string, RingGroupOption[]> = {
  [DEFAULT_DOMAIN]: ringBackFor(['hold-music.wav']),
  [BRANCH_DOMAIN]: ringBackFor([]),
  [AXION_SAMPLE_DOMAIN]: ringBackFor([]),
}

/**
 * MOCK Alert-Info options (GET /api/alertInfo/options, §12/§34.4). Not domain-scoped. Labels and
 * values are illustrative — the real value format is backend-owned. One custom entry is seeded so
 * the delete path can be exercised.
 */
export const mockAlertInfoGroups: AlertInfoGroup[] = [
  {
    label: 'Default',
    options: ['Ring1', 'Ring2', 'Ring3', 'Ring4'].map((name, index) => ({
      label: name,
      value: name,
      alert_info_uuid: `ai-default-${index + 1}`,
      alert_info_is_default: true,
    })),
  },
  {
    label: 'Custom',
    options: [{ label: 'Bellcore-dr2', value: 'Bellcore-dr2', alert_info_uuid: 'ai-custom-1', alert_info_is_default: false }],
  },
]

const baseRecord = (domain: string) => ({
  domain_name: domain,
  ring_group_context: domain,
  ring_group_call_timeout: 30,
  ring_group_ringback: 'us-ring',
  ring_group_call_forward_enabled: false,
  ring_group_follow_me_enabled: false,
})

/**
 * Seed records, deliberately wire-shaped: some flags are `'true'`/`'false'` strings so the service's
 * normalization path is exercised (ring-groups.md §26/§28). Sales/Support match the ring groups the
 * Destinations mock already lists (`8000`, `8001`).
 */
export const mockRingGroups: RingGroupRecord[] = [
  {
    ...baseRecord(DEFAULT_DOMAIN),
    ring_group_uuid: 'rg-101',
    ring_group_name: 'Sales',
    ring_group_extension: '8000',
    ring_group_strategy: 'simultaneous',
    ring_group_greeting: 'welcome-greeting.wav',
    caller_id_name: 'Sales',
    ring_group_cid_prefix: 'SALES',
    ring_group_distinctive_ring: 'Ring2',
    ring_group_forward_cid_mode: 'fixed',
    ring_group_forward_cid_value: '+15550001000',
    ring_group_remote_announce: 'remote-announce-1.wav',
    ring_group_too_late_announce: 'too-late-announcement-1.wav',
    skip_busy_agent: true,
    call_recording_enabled: true,
    ring_group_missed_call_app: 'email',
    ring_group_missed_call_data: 'sales@pepperpbx.local, manager@pepperpbx.local',
    ring_group_timeout_action: `transfer:*991002 XML ${DEFAULT_DOMAIN}`,
    ring_group_forward_enabled: 'false',
    ring_group_enabled: 'true',
    ring_group_call_forward_enabled: 'true',
    ring_group_follow_me_enabled: 'true',
    ring_group_description: 'Rings every sales desk at once.',
    ring_group_destinations: [
      { destination_number: '1002', destination_delay: 0, destination_timeout: 30, destination_prompt: 0 },
      { destination_number: '1004', destination_delay: 0, destination_timeout: 30, destination_prompt: 0 },
    ],
  },
  {
    ...baseRecord(DEFAULT_DOMAIN),
    ring_group_uuid: 'rg-102',
    ring_group_name: 'Support',
    ring_group_extension: '8001',
    ring_group_strategy: 'sequence',
    ring_group_call_timeout: 45,
    // Legacy pre-rename value — loads as Default (§26).
    ring_group_forward_cid_mode: 'original',
    enable_call_pickup: true,
    ring_group_forward_enabled: 'true',
    ring_group_forward_destination: '15551234567',
    ring_group_enabled: 'true',
    ring_group_description: '  Support escalation, first desk first.  ',
    ring_group_destinations: [
      { destination_number: '1003', destination_delay: 0, destination_timeout: 20, destination_prompt: 0 },
      { destination_number: '1001', destination_delay: 5, destination_timeout: 20, destination_prompt: 1 },
    ],
  },
  {
    ...baseRecord(DEFAULT_DOMAIN),
    ring_group_uuid: 'rg-103',
    ring_group_name: 'After Hours',
    ring_group_extension: '8002',
    ring_group_strategy: 'rollover',
    ring_group_ringback: 'hold-music.wav',
    ring_group_forward_enabled: false,
    ring_group_enabled: false,
    ring_group_destinations: [{ destination_number: '1001', destination_delay: 0, destination_timeout: 30, destination_prompt: 0 }],
  },
  {
    ...baseRecord(BRANCH_DOMAIN),
    ring_group_uuid: 'rg-201',
    ring_group_name: 'Branch Support',
    ring_group_extension: '8000',
    ring_group_strategy: 'enterprise',
    ring_group_greeting: 'business-hours-greeting.wav',
    ring_group_forward_cid_mode: 'dialed',
    ring_group_forward_enabled: true,
    ring_group_forward_destination: '202',
    ring_group_enabled: true,
    ring_group_destinations: [
      { destination_number: '201', destination_delay: 0, destination_timeout: 30, destination_prompt: 0 },
      { destination_number: '202', destination_delay: 10, destination_timeout: 30, destination_prompt: 0 },
    ],
  },
  {
    ...baseRecord(AXION_SAMPLE_DOMAIN),
    ring_group_uuid: 'rg-301',
    ring_group_name: 'Remote Support',
    ring_group_extension: '8000',
    ring_group_strategy: 'random',
    ring_group_forward_enabled: 'false',
    ring_group_enabled: 'true',
    ring_group_description:
      'A deliberately long description used to check that the list truncates long text with an ellipsis and shows the full value in a tooltip.',
    ring_group_destinations: [{ destination_number: '3001', destination_delay: 0, destination_timeout: 30, destination_prompt: 0 }],
  },
  ...Array.from({ length: 10 }, (_, index): RingGroupRecord => ({
    ...baseRecord(DEFAULT_DOMAIN),
    ring_group_uuid: `rg-4${String(index).padStart(2, '0')}`,
    ring_group_name: `Team ${index + 1}`,
    ring_group_extension: `80${String(10 + index)}`,
    ring_group_strategy: index % 2 === 0 ? 'simultaneous' : 'sequence',
    ring_group_forward_enabled: false,
    ring_group_enabled: index % 3 !== 0,
    ring_group_destinations: [{ destination_number: '1001', destination_delay: 0, destination_timeout: 30, destination_prompt: 0 }],
  })),
]
