import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { CallFlowDestinationOption, CallFlowHiveDetails, CallFlowRecord, CallFlowSoundOption } from './call-flows.types'

/**
 * Mock data for call-flows.service.ts only. Domains are the same three every sibling module seeds,
 * so the shared current-domain store matches whichever module bootstrapped first.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'
const DOMAINS = [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/**
 * MOCK Hive bootstrap per domain. The 100–999999 bounds are PepperPBX's required Call Flow range,
 * standing in for the real bootstrap response — the live range is whatever that response returns
 * (call-flows.md §26/§30); validation always reads it from here, never hardcodes it.
 */
export const mockCallFlowHiveDetails: Record<string, CallFlowHiveDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '1504',
    excludeExt: [],
    additionalExtStart: 100,
    additionalExtEnd: 999999,
    additionalExtExclude: ['1599'],
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: BRANCH_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '1601',
    excludeExt: [],
    additionalExtStart: 100,
    additionalExtEnd: 999999,
    additionalExtExclude: [],
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: AXION_SAMPLE_DOMAIN,
    domainOptions: DOMAINS,
    autoExt: '1701',
    excludeExt: [],
    additionalExtStart: 100,
    additionalExtEnd: 999999,
    additionalExtExclude: [],
  },
}

/**
 * MOCK domain-scoped option groups. Values are illustrative FreeSWITCH-style strings — the real
 * option value format is backend-owned (call-flows.md §28).
 */
const destinationsFor = (domain: string, extensions: [string, string][]): CallFlowDestinationOption[] => [
  {
    label: 'Extensions',
    options: extensions.map(([number, name]) => ({ label: `${number} ${name}`, value: `transfer:${number} XML ${domain}` })),
  },
  {
    label: 'Voicemail',
    options: extensions.map(([number, name]) => ({ label: `Voicemail ${number} ${name}`, value: `transfer:*99${number} XML ${domain}` })),
  },
  {
    label: 'Other',
    options: [{ label: 'Hangup', value: 'hangup' }],
  },
]

export const mockDestinationOptionsByDomain: Record<string, CallFlowDestinationOption[]> = {
  [DEFAULT_DOMAIN]: destinationsFor(DEFAULT_DOMAIN, [
    ['1001', 'Front Desk'],
    ['1002', 'Night Line'],
    ['1003', 'Sales'],
  ]),
  [BRANCH_DOMAIN]: destinationsFor(BRANCH_DOMAIN, [
    ['2001', 'Branch Reception'],
    ['2002', 'Branch After Hours'],
  ]),
  [AXION_SAMPLE_DOMAIN]: destinationsFor(AXION_SAMPLE_DOMAIN, [['3001', 'Operator']]),
}

const soundGroups = (recordings: string[]): CallFlowSoundOption[] => [
  { label: 'Recordings', options: recordings.map((name) => ({ label: name, value: name })) },
  {
    label: 'Sounds',
    options: [
      { label: 'ivr/ivr-welcome.wav', value: 'ivr/ivr-welcome.wav' },
      { label: 'ivr/ivr-thank_you.wav', value: 'ivr/ivr-thank_you.wav' },
    ],
  },
]

export const mockSoundOptionsByDomain: Record<string, CallFlowSoundOption[]> = {
  [DEFAULT_DOMAIN]: soundGroups(['day-mode.wav', 'night-mode.wav']),
  [BRANCH_DOMAIN]: soundGroups(['branch-open.wav']),
  [AXION_SAMPLE_DOMAIN]: soundGroups([]),
}

/**
 * Seed records, deliberately wire-shaped: some flags are `'true'`/`'false'` strings so the service's
 * normalization path is exercised (call-flows.md §13/§28).
 */
export const mockCallFlows: CallFlowRecord[] = [
  {
    call_flow_uuid: 'cf-101',
    domain_name: DEFAULT_DOMAIN,
    call_flow_context: DEFAULT_DOMAIN,
    call_flow_name: 'Day Night',
    call_flow_extension: '1500',
    call_flow_feature_code: 'flow+*1500',
    call_flow_pin_number: '1234',
    call_flow_data: `transfer:1001 XML ${DEFAULT_DOMAIN}`,
    call_flow_label: 'Day',
    call_flow_sound: 'day-mode.wav',
    call_flow_alternate_data: `transfer:1002 XML ${DEFAULT_DOMAIN}`,
    call_flow_alternate_label: 'Night',
    call_flow_alternate_sound: 'night-mode.wav',
    call_flow_description: 'Switch the main line between day and night routing.',
    call_flow_enabled: 'true',
    call_flow_status: 'true',
    dialplan_uuid: 'dp-cf-101',
    domain_uuid: 'dom-default',
  },
  {
    call_flow_uuid: 'cf-102',
    domain_name: DEFAULT_DOMAIN,
    call_flow_context: DEFAULT_DOMAIN,
    call_flow_name: 'Holiday Mode',
    call_flow_extension: '1501',
    call_flow_feature_code: 'flow+*1501',
    call_flow_data: `transfer:1003 XML ${DEFAULT_DOMAIN}`,
    call_flow_label: 'Open',
    call_flow_alternate_data: 'hangup',
    call_flow_alternate_label: 'Closed',
    call_flow_description: '  Closes the sales line on public holidays.  ',
    call_flow_enabled: 'false',
    call_flow_status: 'true',
    dialplan_uuid: 'dp-cf-102',
    domain_uuid: 'dom-default',
  },
  {
    call_flow_uuid: 'cf-103',
    domain_name: DEFAULT_DOMAIN,
    call_flow_context: DEFAULT_DOMAIN,
    call_flow_name: 'Support Overflow',
    call_flow_extension: '1502',
    call_flow_feature_code: 'flow+*1502',
    call_flow_data: `transfer:1001 XML ${DEFAULT_DOMAIN}`,
    call_flow_label: 'Normal',
    call_flow_alternate_data: `transfer:*991001 XML ${DEFAULT_DOMAIN}`,
    call_flow_alternate_label: 'Voicemail',
    call_flow_enabled: true,
    call_flow_status: false,
    dialplan_uuid: 'dp-cf-103',
    domain_uuid: 'dom-default',
  },
  {
    call_flow_uuid: 'cf-201',
    domain_name: BRANCH_DOMAIN,
    call_flow_context: BRANCH_DOMAIN,
    call_flow_name: 'Branch Lunch',
    call_flow_extension: '1600',
    call_flow_feature_code: 'flow+*1600',
    call_flow_data: `transfer:2001 XML ${BRANCH_DOMAIN}`,
    call_flow_label: 'Staffed',
    call_flow_sound: 'branch-open.wav',
    call_flow_alternate_data: `transfer:2002 XML ${BRANCH_DOMAIN}`,
    call_flow_alternate_label: 'Lunch',
    call_flow_enabled: true,
    call_flow_status: true,
    dialplan_uuid: 'dp-cf-201',
    domain_uuid: 'dom-branch',
  },
  {
    call_flow_uuid: 'cf-301',
    domain_name: AXION_SAMPLE_DOMAIN,
    call_flow_context: AXION_SAMPLE_DOMAIN,
    call_flow_name: 'Operator Fallback',
    call_flow_extension: '1700',
    call_flow_feature_code: 'flow+*1700',
    call_flow_data: `transfer:3001 XML ${AXION_SAMPLE_DOMAIN}`,
    call_flow_label: 'Operator',
    call_flow_alternate_data: 'hangup',
    call_flow_alternate_label: 'Off',
    call_flow_description:
      'A deliberately long description used to check that the list truncates long text with an ellipsis and shows the full value in a tooltip.',
    call_flow_enabled: 'true',
    call_flow_status: 'false',
    dialplan_uuid: 'dp-cf-301',
    domain_uuid: 'dom-axion',
  },
  ...Array.from({ length: 9 }, (_, index): CallFlowRecord => {
    const extension = `15${String(10 + index)}`
    return {
      call_flow_uuid: `cf-4${String(index).padStart(2, '0')}`,
      domain_name: DEFAULT_DOMAIN,
      call_flow_context: DEFAULT_DOMAIN,
      call_flow_name: `Flow ${index + 1}`,
      call_flow_extension: extension,
      call_flow_feature_code: `flow+${extension.replace(/^\*\*/, '*')}`,
      call_flow_data: `transfer:1001 XML ${DEFAULT_DOMAIN}`,
      call_flow_label: 'Normal',
      call_flow_alternate_data: 'hangup',
      call_flow_alternate_label: 'Alternate',
      call_flow_enabled: index % 3 !== 0,
      call_flow_status: index % 2 === 0,
      dialplan_uuid: `dp-cf-4${index}`,
      domain_uuid: 'dom-default',
    }
  }),
]
