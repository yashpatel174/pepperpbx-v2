import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { CallCenterAgentDetails, HiveCallCenterAgentDetails, SelectOption } from './call-center-agents.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with every sibling module (store/domain.ts) rather than inventing a
 * separate literal, and seeds AXION_SAMPLE_DOMAIN ("sip.axionhq.hivepbx.com", matching every
 * sibling module's own seed domain) from the start — a session that bootstrapped any other module
 * before visiting Call Center Agents will already have that domain persisted as the shared
 * current-domain (store/domain.ts's `currentDomain`), so `showAll=false` needs matching records
 * under it too. Learned directly from the identical issue already hit (and fixed after the fact)
 * in every other module — seeded correctly here up front.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

export const mockHiveCallCenterAgentDetails: Record<string, HiveCallCenterAgentDetails> = {
  [DEFAULT_DOMAIN]: { defaultDomain: DEFAULT_DOMAIN, domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN] },
  [BRANCH_DOMAIN]: { defaultDomain: BRANCH_DOMAIN, domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN] },
  [AXION_SAMPLE_DOMAIN]: { defaultDomain: AXION_SAMPLE_DOMAIN, domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN] },
}

/**
 * GET .../callCentersAgents/listOptions?domain_name=... — domain-scoped Contact dropdown options
 * (call-center.md §8/§13/§25). Distinct mock from the Call Center Queue module's own
 * `mockAgentOptionsByDomain` (that one is a different, dedicated endpoint — `getAgent` — used only
 * for the Tier assignment select, not this Contact field; see call-center-agents.service.ts's
 * comment on fetchContactOptions).
 */
export const mockContactOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: '101 - Front Desk', value: 'sip:101@sip.pepperpbx.local' },
    { label: '102 - Sales', value: 'sip:102@sip.pepperpbx.local' },
    { label: '104 - Support', value: 'sip:104@sip.pepperpbx.local' },
  ],
  [BRANCH_DOMAIN]: [{ label: '201 - Branch Reception', value: 'sip:201@branch.pepperpbx.local' }],
  [AXION_SAMPLE_DOMAIN]: [
    { label: '101 - Front Desk', value: 'sip:101@sip.axionhq.hivepbx.com' },
    { label: '104 - Accounts', value: 'sip:104@sip.axionhq.hivepbx.com' },
  ],
}

/**
 * Seed data for call-center-agents.service.ts's in-memory working copy — replace with a real API
 * response once the backend endpoints are available. Not mutated directly — the service owns a
 * copy. Uuids/names deliberately align with the Call Center Queue module's own
 * `mockAgentOptionsByDomain` placeholder options (agent-101/agent-102/agent-104/agent-201/
 * agent-101-axion/agent-104-axion) purely so the two independently-mocked datasets look
 * consistent in a demo — the two modules remain otherwise fully decoupled (call-center.md §5/§23:
 * the Queue's Tier dropdown and this module's own Agent CRUD are documented as separate concerns).
 */
const seed = (uuid: string, fields: Partial<CallCenterAgentDetails>): CallCenterAgentDetails => ({
  call_center_agent_uuid: uuid,
  agent_name: '',
  agent_type: 'callback',
  agent_call_timeout: '20',
  agent_no_answer_delay_time: '30',
  agent_max_no_answer: '0',
  agent_wrap_up_time: '10',
  agent_reject_delay_time: '90',
  agent_busy_delay_time: '90',
  domain_name: DEFAULT_DOMAIN,
  agent_contact: '',
  agent_record: false,
  ...fields,
})

export const mockCallCenterAgents: CallCenterAgentDetails[] = [
  seed('agent-101', {
    agent_name: 'John Carter',
    agent_id: '101',
    agent_contact: 'sip:101@sip.pepperpbx.local',
    agent_status: 'available',
  }),
  seed('agent-102', {
    agent_name: 'Emily Chen',
    agent_id: '102',
    agent_contact: 'sip:102@sip.pepperpbx.local',
    agent_status: 'on-break',
  }),
  seed('agent-104', {
    agent_name: 'Michael Rivera',
    agent_id: '104',
    agent_contact: 'sip:104@sip.pepperpbx.local',
    agent_status: 'logged-out',
  }),
  seed('agent-201', {
    agent_name: 'Branch Reception',
    agent_id: '201',
    domain_name: BRANCH_DOMAIN,
    agent_contact: 'sip:201@branch.pepperpbx.local',
    agent_status: 'available',
  }),
  /** Reference-sample records for AXION_SAMPLE_DOMAIN — see the mock's own header comment above. */
  seed('agent-101-axion', {
    agent_name: 'Front Desk',
    agent_id: '101',
    domain_name: AXION_SAMPLE_DOMAIN,
    agent_contact: 'sip:101@sip.axionhq.hivepbx.com',
    agent_status: 'available',
  }),
  seed('agent-104-axion', {
    agent_name: 'Accounts',
    agent_id: '104',
    domain_name: AXION_SAMPLE_DOMAIN,
    agent_contact: 'sip:104@sip.axionhq.hivepbx.com',
    agent_status: 'available-on-demand',
  }),
]
