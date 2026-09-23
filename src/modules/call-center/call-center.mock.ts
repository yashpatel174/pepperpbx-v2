import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { CallCenterDetails, HiveCallCenterDetails, SelectOption } from './call-center.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with Extensions/Gateways/Outbound Routes/Announcements/Call Block
 * (store/domain.ts) rather than inventing a separate literal, and seeds AXION_SAMPLE_DOMAIN
 * ("sip.axionhq.hivepbx.com", matching every sibling dialplans/applications module's own seed
 * domain) from the start — a session that bootstrapped any of those modules before visiting Call
 * Center will already have that domain persisted as the shared current-domain
 * (store/domain.ts's `currentDomain`), so `showAll=false` needs matching records under it too.
 * Learned directly from the identical issue already hit (and fixed after the fact) in Outbound
 * Routes/Announcements/Call Block — seeded correctly here up front.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

/**
 * call-center.md §26/§33: "call center range 2000–2999... PepperPBX must preserve this range."
 * `autoExtension` is a simple "next available in range" suggestion, mirroring the audit's
 * documented `autoExt` bootstrap field.
 */
export const mockHiveCallCenterDetails: Record<string, HiveCallCenterDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
    autoExtension: '2003',
    extensionRangeStart: 2000,
    extensionRangeEnd: 2999,
    extensionExclude: ['2000'],
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: BRANCH_DOMAIN,
    domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
    autoExtension: '2001',
    extensionRangeStart: 2000,
    extensionRangeEnd: 2999,
    extensionExclude: [],
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: AXION_SAMPLE_DOMAIN,
    domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
    autoExtension: '2002',
    extensionRangeStart: 2000,
    extensionRangeEnd: 2999,
    extensionExclude: ['2000'],
  },
}

/**
 * Placeholder options for the Agent tier assignment select (call-center.md §8's
 * `agentSelectOptions`, fetched per domain via `/api/callCenters/getAgent`). The Agent entity's
 * own CRUD (list/add/edit/delete + Agent Status) is the separate, distinctly-permissioned
 * `call-center-agents` module (Axion's `AGENT_PERMISSION`, call-center.md §1/§14/§33). This is a
 * self-contained mock of just the dropdown values a queue's tier rows need to reference.
 */
export const mockAgentOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'John Carter', value: 'agent-101' },
    { label: 'Emily Chen', value: 'agent-102' },
    { label: 'Michael Rivera', value: 'agent-104' },
  ],
  [BRANCH_DOMAIN]: [{ label: 'Branch Reception', value: 'agent-201' }],
  [AXION_SAMPLE_DOMAIN]: [
    { label: 'Front Desk', value: 'agent-101-axion' },
    { label: 'Accounts', value: 'agent-104-axion' },
  ],
}

/** GET .../callCenters/listgreetings?domain_name=... (call-center.md §8/§12). */
export const mockGreetingOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Welcome Greeting', value: 'welcome-greeting' },
    { label: 'Hold Greeting', value: 'hold-greeting' },
  ],
  [BRANCH_DOMAIN]: [{ label: 'Branch Greeting', value: 'branch-greeting' }],
  [AXION_SAMPLE_DOMAIN]: [{ label: 'Axion Welcome', value: 'axion-welcome' }],
}

/** GET .../callCenters/timeoutActions?domain_name=... (call-center.md §8/§12). */
export const mockTimeoutActionOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Voicemail', value: 'voicemail' },
    { label: 'Extension 100', value: 'extension-100' },
  ],
  [BRANCH_DOMAIN]: [{ label: 'Branch Voicemail', value: 'branch-voicemail' }],
  [AXION_SAMPLE_DOMAIN]: [{ label: 'Axion Voicemail', value: 'axion-voicemail' }],
}

/** GET .../callCenters/getAnnouncedDropDown?domain_name=... (call-center.md §8/§12). */
export const mockAnnounceOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Position Announcement', value: 'position-announcement' },
    { label: 'Estimated Wait', value: 'estimated-wait' },
  ],
  [BRANCH_DOMAIN]: [{ label: 'Branch Announcement', value: 'branch-announcement' }],
  [AXION_SAMPLE_DOMAIN]: [{ label: 'Axion Announcement', value: 'axion-announcement' }],
}

/** GET .../callCenters/mohDropdown?domain_name=... (call-center.md §8/§12). */
export const mockMusicOnHoldOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Default MOH', value: 'default-moh' },
    { label: 'Jazz MOH', value: 'jazz-moh' },
  ],
  [BRANCH_DOMAIN]: [{ label: 'Branch MOH', value: 'branch-moh' }],
  [AXION_SAMPLE_DOMAIN]: [{ label: 'Axion MOH', value: 'axion-moh' }],
}

/**
 * Seed data for call-center.service.ts's in-memory working copy — replace with a real API
 * response once the backend endpoints are available. Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, fields: Partial<CallCenterDetails>): CallCenterDetails => ({
  call_center_queue_uuid: uuid,
  queue_name: '',
  queue_extension: '2000',
  queue_strategy: 'longest-idle-agent',
  queue_moh_sound: 'default-moh',
  queue_time_base_score: 'system',
  queue_max_wait_time: 0,
  queue_tier_rule_wait_second: 30,
  queue_discard_abandoned_after: 900,
  queue_max_wait_time_with_no_agent: 90,
  queue_max_wait_time_with_no_agent_time_reached: 30,
  domain_name: DEFAULT_DOMAIN,
  queue_record_template: false,
  queue_tier_rules_apply: false,
  queue_abandoned_resume_allowed: false,
  queue_announce_position: true,
  queue_tier_rule_wait_multiply_level: true,
  queue_tier_rule_no_agent_no_wait: true,
  callcenter_tier: [],
  ...fields,
})

export const mockCallCenters: CallCenterDetails[] = [
  seed('cc-support-1', {
    queue_name: 'Support Queue',
    queue_extension: '2001',
    queue_strategy: 'longest-idle-agent',
    queue_moh_sound: 'default-moh',
    queue_description: 'Tier-1 customer support',
    queue_tier_rules_apply: true,
    callcenter_tier: [
      { call_center_tier_uuid: 'tier-1', call_center_agent_uuid: 'agent-101', tier_level: 0, tier_position: 0 },
      { call_center_tier_uuid: 'tier-2', call_center_agent_uuid: 'agent-102', tier_level: 0, tier_position: 1 },
    ],
  }),
  seed('cc-sales-1', {
    queue_name: 'Sales Queue',
    queue_extension: '2002',
    queue_strategy: 'round-robin',
    queue_moh_sound: 'jazz-moh',
    queue_description: 'Inbound sales calls',
    callcenter_tier: [{ call_center_tier_uuid: 'tier-3', call_center_agent_uuid: 'agent-104', tier_level: 0, tier_position: 0 }],
  }),
  seed('cc-billing-1', {
    queue_name: 'Billing Queue',
    queue_extension: '2004',
    queue_strategy: 'top-down',
    queue_moh_sound: 'default-moh',
    callcenter_tier: [],
  }),
  seed('cc-branch-1', {
    queue_name: 'Branch Reception Queue',
    queue_extension: '2005',
    domain_name: BRANCH_DOMAIN,
    queue_strategy: 'ring-all',
    queue_moh_sound: 'branch-moh',
    queue_tier_rules_apply: true,
    callcenter_tier: [{ call_center_tier_uuid: 'tier-4', call_center_agent_uuid: 'agent-201', tier_level: 0, tier_position: 0 }],
  }),
  /** Reference-sample records for AXION_SAMPLE_DOMAIN — see the constant's comment above. */
  seed('cc-axion-1', {
    queue_name: 'Axion Support Queue',
    queue_extension: '2006',
    domain_name: AXION_SAMPLE_DOMAIN,
    queue_strategy: 'longest-idle-agent',
    queue_moh_sound: 'axion-moh',
    queue_description: 'Reference-sample queue',
    queue_tier_rules_apply: true,
    callcenter_tier: [{ call_center_tier_uuid: 'tier-5', call_center_agent_uuid: 'agent-101-axion', tier_level: 0, tier_position: 0 }],
  }),
  seed('cc-axion-2', {
    queue_name: 'Axion Sales Queue',
    queue_extension: '2007',
    domain_name: AXION_SAMPLE_DOMAIN,
    queue_strategy: 'random',
    queue_moh_sound: 'axion-moh',
    callcenter_tier: [],
  }),
]
