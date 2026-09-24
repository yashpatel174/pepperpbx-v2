import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { ConferenceDetails, ConferenceHiveDetails, ConferenceProfileOption } from './conference.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with every sibling module (store/domain.ts) rather than inventing a
 * separate literal, and seeds AXION_SAMPLE_DOMAIN ("sip.axionhq.hivepbx.com", matching every
 * sibling module's own seed domain) so a session that bootstrapped any other module before
 * visiting Conferences already has that domain persisted as the shared current-domain — the same
 * fix already established for every other module's mock.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

/**
 * Extension range 3000–3999 matches the audit's own reference `extensionConfig.conference` table
 * (conferences.md §26) — used here only as the mock's stand-in for a real backend response, never
 * as a hardcoded business rule inside validation code (see conference.validation.ts's
 * extensionRangeRule, which always reads the range from this bootstrap data).
 */
export const mockHiveConferenceDetails: Record<string, ConferenceHiveDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
    autoExtension: '3000',
    extensionRangeStart: 3000,
    extensionRangeEnd: 3999,
    extensionExclude: ['3001'],
    accountCode: 'ACC-CONF-001',
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: BRANCH_DOMAIN,
    domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
    autoExtension: '3100',
    extensionRangeStart: 3000,
    extensionRangeEnd: 3999,
    extensionExclude: [],
    accountCode: 'ACC-CONF-002',
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: AXION_SAMPLE_DOMAIN,
    domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
    autoExtension: '3200',
    extensionRangeStart: 3000,
    extensionRangeEnd: 3999,
    extensionExclude: [],
    accountCode: 'ACC-CONF-003',
  },
}

/**
 * GET /api/conferences/profileOptions — deliberately a flat, non-domain-scoped list, matching the
 * audit's own data-transformation note that this endpoint "resolves response.data (not
 * response.data.data)... suggesting the API returns a flat data array, not a nested/domain-scoped
 * wrapper" (conferences.md §27). Profile names are generic FreeSWITCH conference-profile
 * placeholders, not confirmed literal values from the audit (which documents only the mechanism,
 * not the exact option list).
 */
export const mockConferenceProfileOptions: ConferenceProfileOption[] = [
  { label: 'Default', value: 'default' },
  { label: 'Wideband', value: 'wideband' },
  { label: 'Ultra Wideband', value: 'ultrawideband' },
]

/**
 * Seed data for conference.service.ts's in-memory working copy — replace with a real API response
 * once the backend endpoints are available. Not mutated directly — the service owns a copy.
 */
export const mockConferences: ConferenceDetails[] = [
  {
    conference_uuid: 'conf-101',
    conference_name: 'Sales Team Bridge',
    conference_extension: '3001',
    conference_pin_number: '123456',
    conference_profile: 'default',
    conference_flags: 'mute|moderator',
    conference_email_address: '',
    conference_account_code: 'ACC-CONF-001',
    domain_name: DEFAULT_DOMAIN,
    conference_order: 0,
    conference_description: 'Daily sales standup bridge.',
    conference_enabled: true,
  },
  {
    conference_uuid: 'conf-102',
    conference_name: 'Support Escalation Room',
    conference_extension: '3002',
    conference_profile: 'wideband',
    conference_flags: 'deaf|waste',
    conference_account_code: 'ACC-CONF-001',
    domain_name: DEFAULT_DOMAIN,
    conference_order: 1,
    conference_description: 'Used for escalated support calls.',
    conference_enabled: false,
  },
  {
    conference_uuid: 'conf-201',
    conference_name: 'Branch All-Hands',
    conference_extension: '3101',
    conference_profile: 'default',
    conference_account_code: 'ACC-CONF-002',
    domain_name: BRANCH_DOMAIN,
    conference_order: 0,
    conference_enabled: true,
  },
  {
    conference_uuid: 'conf-301-axion',
    conference_name: 'Reference Bridge',
    conference_extension: '3201',
    conference_profile: 'ultrawideband',
    conference_account_code: 'ACC-CONF-003',
    domain_name: AXION_SAMPLE_DOMAIN,
    conference_order: 5,
    conference_enabled: true,
  },
]
