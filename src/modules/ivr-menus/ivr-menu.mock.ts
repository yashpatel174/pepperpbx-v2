import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import { ivrMenuFormDefaults } from './ivr-menu.constants'
import type { IVRMenuDetails, IVRMenuHiveDetails, IVRMenuOption, IVRMenuSelectOptions } from './ivr-menu.types'

/**
 * Mock data for ivr-menu.service.ts only — nothing else imports this file. Domains are the same
 * three every sibling module seeds, so the shared current-domain store matches whichever module
 * bootstrapped first. All option values are illustrative FreeSWITCH-style strings; the real value
 * formats are backend-owned (MOCK-ONLY).
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'
const DOMAINS = [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/**
 * MOCK Hive bootstrap per domain (`module=IVR`, §12/§26). The 5000–6999 bounds are MOCK-ONLY
 * stand-ins — the live range is whatever the bootstrap returns; validation always reads it from
 * here, never hardcodes it.
 */
export const mockIVRMenuHiveDetails: Record<string, IVRMenuHiveDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '5010',
    additionalExtStart: 5000,
    additionalExtEnd: 6999,
    additionalExtExclude: ['5999'],
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: BRANCH_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '5102',
    additionalExtStart: 5000,
    additionalExtEnd: 6999,
    additionalExtExclude: [],
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: AXION_SAMPLE_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '5201',
    additionalExtStart: 5000,
    additionalExtEnd: 6999,
    additionalExtExclude: [],
  },
}

const destinationsFor = (domain: string, extensions: [string, string][]): IVRMenuSelectOptions => [
  {
    label: 'Extensions',
    options: extensions.map(([number, name]) => ({ label: `${number} ${name}`, value: `transfer ${number} XML ${domain}` })),
  },
  {
    label: 'Voicemail',
    options: extensions.map(([number, name]) => ({ label: `Voicemail ${number} ${name}`, value: `transfer *99${number} XML ${domain}` })),
  },
  { label: 'Other', options: [{ label: 'Hangup', value: 'hangup' }] },
]

const DEFAULT_EXTENSIONS: [string, string][] = [
  ['1001', 'Front Desk'],
  ['1002', 'Sales'],
  ['1003', 'Support'],
  ['1004', 'Billing'],
]
const BRANCH_EXTENSIONS: [string, string][] = [
  ['2001', 'Branch Reception'],
  ['2002', 'Branch Support'],
]
const AXION_EXTENSIONS: [string, string][] = [['3001', 'Operator']]

/** GET /ivrMenus/destinationDropdown?domain_name= (§12). */
export const mockDestinationOptionsByDomain: Record<string, IVRMenuSelectOptions> = {
  [DEFAULT_DOMAIN]: destinationsFor(DEFAULT_DOMAIN, DEFAULT_EXTENSIONS),
  [BRANCH_DOMAIN]: destinationsFor(BRANCH_DOMAIN, BRANCH_EXTENSIONS),
  [AXION_SAMPLE_DOMAIN]: destinationsFor(AXION_SAMPLE_DOMAIN, AXION_EXTENSIONS),
}

/** GET /timeGroups/destinationDropdown?domain_name= (§12 — cross-module endpoint). */
export const mockExitActionOptionsByDomain: Record<string, IVRMenuSelectOptions> = {
  [DEFAULT_DOMAIN]: destinationsFor(DEFAULT_DOMAIN, DEFAULT_EXTENSIONS.slice(0, 2)),
  [BRANCH_DOMAIN]: destinationsFor(BRANCH_DOMAIN, BRANCH_EXTENSIONS),
  [AXION_SAMPLE_DOMAIN]: destinationsFor(AXION_SAMPLE_DOMAIN, AXION_EXTENSIONS),
}

const greetGroups = (recordings: string[]): IVRMenuSelectOptions => [
  { label: 'Recordings', options: recordings.map((name) => ({ label: name, value: name })) },
  {
    label: 'Sounds',
    options: [
      { label: 'ivr/ivr-welcome.wav', value: 'ivr/ivr-welcome.wav' },
      { label: 'ivr/ivr-welcome_to_freeswitch.wav', value: 'ivr/ivr-welcome_to_freeswitch.wav' },
      { label: 'ivr/ivr-please_choose_from_the_following.wav', value: 'ivr/ivr-please_choose_from_the_following.wav' },
    ],
  },
]

/** GET /ivrMenus/optionGreet?domain_name= (§12). */
export const mockGreetOptionsByDomain: Record<string, IVRMenuSelectOptions> = {
  [DEFAULT_DOMAIN]: greetGroups(['main-menu-long.wav', 'main-menu-short.wav', 'after-hours.wav']),
  [BRANCH_DOMAIN]: greetGroups(['branch-welcome.wav']),
  [AXION_SAMPLE_DOMAIN]: greetGroups([]),
}

const soundGroups = (recordings: string[]): IVRMenuSelectOptions => [
  { label: 'Recordings', options: recordings.map((name) => ({ label: name, value: name })) },
  {
    label: 'Sounds',
    options: [
      { label: 'ivr/ivr-that_was_an_invalid_entry.wav', value: 'ivr/ivr-that_was_an_invalid_entry.wav' },
      { label: 'ivr/ivr-thank_you.wav', value: 'ivr/ivr-thank_you.wav' },
      { label: 'ivr/ivr-call_being_transferred.wav', value: 'ivr/ivr-call_being_transferred.wav' },
      { label: 'voicemail/vm-goodbye.wav', value: 'voicemail/vm-goodbye.wav' },
    ],
  },
]

/** GET /ivrMenus/soundDropdown?domain_name= (§12). */
export const mockSoundOptionsByDomain: Record<string, IVRMenuSelectOptions> = {
  [DEFAULT_DOMAIN]: soundGroups(['invalid-choice.wav']),
  [BRANCH_DOMAIN]: soundGroups([]),
  [AXION_SAMPLE_DOMAIN]: soundGroups([]),
}

const ringbackGroups = (musicOnHold: string[]): IVRMenuSelectOptions => [
  {
    label: 'Ringtones',
    options: ['us-ring', 'uk-ring', 'fr-ring', 'de-ring'].map((tone) => ({ label: tone, value: `\${${tone}}` })),
  },
  { label: 'Music on Hold', options: musicOnHold.map((name) => ({ label: name, value: `local_stream://${name}` })) },
]

/** GET /ivrMenus/ringBack?domain_name= (§12). */
export const mockRingbackOptionsByDomain: Record<string, IVRMenuSelectOptions> = {
  [DEFAULT_DOMAIN]: ringbackGroups(['default', 'jazz']),
  [BRANCH_DOMAIN]: ringbackGroups(['default']),
  [AXION_SAMPLE_DOMAIN]: ringbackGroups(['default']),
}

const option = (option_digits: string, destination: string, order: number, description: string): IVRMenuOption => ({
  option_digits,
  destination,
  order,
  description,
})

/** Advanced defaults in stored (numeric) form, shared by the seed records below. */
const advancedDefaults = {
  ivr_menu_invalid_sound: ivrMenuFormDefaults.ivr_menu_invalid_sound,
  ivr_menu_confirm_key: ivrMenuFormDefaults.ivr_menu_confirm_key,
  ivr_menu_tts_engine: ivrMenuFormDefaults.ivr_menu_tts_engine,
  ivr_menu_tts_voice: ivrMenuFormDefaults.ivr_menu_tts_voice,
  ivr_menu_confirm_attempts: 1,
  ivr_menu_inter_digit_timeout: 2000,
  ivr_menu_max_failures: 1,
  ivr_menu_max_timeouts: 1,
  ivr_menu_digit_len: 5,
}

export const mockIVRMenus: IVRMenuDetails[] = [
  {
    ivr_menu_uuid: 'ivr-101',
    domain_name: DEFAULT_DOMAIN,
    ivr_menu_context: DEFAULT_DOMAIN,
    ivr_menu_name: 'Main Menu',
    ivr_menu_extension: '5000',
    ivr_menu_language: 'en/us/callie',
    ivr_menu_greet_long: 'main-menu-long.wav',
    ivr_menu_greet_short: 'main-menu-short.wav',
    ivr_menu_timeout: 3000,
    exit_action: `transfer 1001 XML ${DEFAULT_DOMAIN}`,
    ivr_menu_ringback: '${us-ring}',
    ivr_menu_cid_prefix: 'Main',
    ivr_menu_direct_dial: true,
    ivr_menu_enabled: true,
    ivr_menu_description: 'Company main auto-attendant.',
    options: [
      option('1', `transfer 1002 XML ${DEFAULT_DOMAIN}`, 1, 'Sales'),
      option('2', `transfer 1003 XML ${DEFAULT_DOMAIN}`, 2, 'Support'),
      option('3', `transfer 1004 XML ${DEFAULT_DOMAIN}`, 3, 'Billing'),
      option('0', `transfer 1001 XML ${DEFAULT_DOMAIN}`, 4, 'Operator'),
    ],
    ...advancedDefaults,
    ivr_menu_exit_sound: 'voicemail/vm-goodbye.wav',
  },
  {
    ivr_menu_uuid: 'ivr-102',
    domain_name: DEFAULT_DOMAIN,
    ivr_menu_context: DEFAULT_DOMAIN,
    ivr_menu_name: 'Support Submenu',
    ivr_menu_extension: '5001',
    ivr_menu_parent_uuid: 'ivr-101',
    ivr_menu_language: 'en/us/callie',
    ivr_menu_greet_long: 'ivr/ivr-please_choose_from_the_following.wav',
    ivr_menu_timeout: 5000,
    ivr_menu_ringback: '${us-ring}',
    ivr_menu_direct_dial: false,
    ivr_menu_enabled: true,
    ivr_menu_description: '  Technical vs. account support.  ',
    options: [
      option('1', `transfer 1003 XML ${DEFAULT_DOMAIN}`, 1, 'Technical'),
      option('2', `transfer *991003 XML ${DEFAULT_DOMAIN}`, 2, 'Leave a message'),
      option('*', 'hangup', 3, 'Hang up'),
    ],
    ...advancedDefaults,
    ivr_menu_max_failures: 3,
    ivr_menu_max_timeouts: 3,
  },
  {
    ivr_menu_uuid: 'ivr-103',
    domain_name: DEFAULT_DOMAIN,
    ivr_menu_context: DEFAULT_DOMAIN,
    ivr_menu_name: 'After Hours',
    ivr_menu_extension: '5002',
    ivr_menu_greet_long: 'after-hours.wav',
    ivr_menu_timeout: 3000,
    exit_action: 'hangup',
    ivr_menu_ringback: '${us-ring}',
    ivr_menu_direct_dial: false,
    ivr_menu_enabled: false,
    options: [option('1', `transfer *991001 XML ${DEFAULT_DOMAIN}`, 1, 'Voicemail')],
    ...advancedDefaults,
    ivr_menu_pin_number: '4321',
  },
  {
    ivr_menu_uuid: 'ivr-201',
    domain_name: BRANCH_DOMAIN,
    ivr_menu_context: BRANCH_DOMAIN,
    ivr_menu_name: 'Branch Welcome',
    ivr_menu_extension: '5100',
    ivr_menu_language: 'en/us/callie',
    ivr_menu_greet_long: 'branch-welcome.wav',
    ivr_menu_timeout: 3000,
    ivr_menu_ringback: '${uk-ring}',
    ivr_menu_direct_dial: true,
    ivr_menu_enabled: true,
    ivr_menu_description: 'Branch office front menu.',
    options: [
      option('1', `transfer 2001 XML ${BRANCH_DOMAIN}`, 1, 'Reception'),
      option('2', `transfer 2002 XML ${BRANCH_DOMAIN}`, 2, 'Support'),
    ],
    ...advancedDefaults,
  },
  {
    ivr_menu_uuid: 'ivr-301',
    domain_name: AXION_SAMPLE_DOMAIN,
    ivr_menu_context: AXION_SAMPLE_DOMAIN,
    ivr_menu_name: 'Operator Menu',
    ivr_menu_extension: '5200',
    ivr_menu_greet_long: 'ivr/ivr-welcome.wav',
    ivr_menu_timeout: 4000,
    ivr_menu_ringback: '${us-ring}',
    ivr_menu_direct_dial: false,
    ivr_menu_enabled: true,
    ivr_menu_description:
      'A deliberately long description used to check that the list truncates long text with an ellipsis and shows the full value in a tooltip.',
    options: [option('0', `transfer 3001 XML ${AXION_SAMPLE_DOMAIN}`, 0, 'Operator')],
    ...advancedDefaults,
  },
  ...Array.from({ length: 9 }, (_, index): IVRMenuDetails => ({
    ivr_menu_uuid: `ivr-4${String(index).padStart(2, '0')}`,
    domain_name: DEFAULT_DOMAIN,
    ivr_menu_context: DEFAULT_DOMAIN,
    ivr_menu_name: `Department Menu ${index + 1}`,
    ivr_menu_extension: String(5020 + index),
    ivr_menu_greet_long: 'ivr/ivr-welcome.wav',
    ivr_menu_timeout: 3000,
    ivr_menu_ringback: '${us-ring}',
    ivr_menu_direct_dial: false,
    ivr_menu_enabled: index % 3 !== 0,
    options: [option('1', `transfer 1001 XML ${DEFAULT_DOMAIN}`, 1, 'Front Desk')],
    ...advancedDefaults,
  })),
]
