import type { Registration } from './registrations.types'
import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'

/**
 * SAMPLE DATA ONLY — generated placeholder records, not endpoints on any real PBX. Documentation-range
 * addresses (RFC 5737) and reserved .test domains are used on purpose. The default domain is the
 * shared MOCK_DEFAULT_DOMAIN (store/domain.ts), as in the other module mocks.
 * `status` and `expires` values are ILLUSTRATIVE ONLY: neither the audit nor the repo documents the
 * backend's allowed statuses or the `expires` format (§5/§28), so the status strings below are not a
 * contract. The table renders whatever string arrives, so unknown real values display unchanged.
 * Generated from the index so the data is identical on every load.
 */
const OTHER_DOMAIN = 'globex.pepperpbx.test'
export const MOCK_WILDCARD_DOMAINS = [MOCK_DEFAULT_DOMAIN, OTHER_DOMAIN]

const USER_AGENTS = ['Yealink SIP-T54W 96.86.0.5', 'Polycom VVX 450 6.4.2', 'Grandstream GRP2614 1.0.5.2', 'Zoiper 5.5.13']

const buildRegistration = (index: number, domain: string, user: string): Registration => {
  const lanHost = 10 + (index % 40)
  const publicHost = 10 + (index % 5)
  const port = String(5060 + (index % 4) * 2)
  return {
    id: `b7e1d3a0-0002-4b20-8c02-${String(index).padStart(12, '0')}`,
    username: user,
    domain,
    userAgent: USER_AGENTS[index % USER_AGENTS.length],
    contact: `sip:${user}@192.0.2.${lanHost}:${port}`,
    lanIP: `192.0.2.${lanHost}`,
    ip: `203.0.113.${publicHost}`,
    port,
    status: index % 7 === 0 ? 'Unreachable' : 'Registered',
    expires: String(300 + (index % 6) * 60),
  }
}

export const mockRegistrations: Registration[] = [
  ...Array.from({ length: 24 }, (_, i) => buildRegistration(i + 1, MOCK_DEFAULT_DOMAIN, String(1001 + i))),
  ...Array.from({ length: 6 }, (_, i) => buildRegistration(i + 25, OTHER_DOMAIN, String(3001 + i))),
]
