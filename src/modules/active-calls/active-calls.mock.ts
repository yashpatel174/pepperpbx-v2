import type { ActiveCall } from './active-calls.types'
import { MOCK_DEFAULT_DOMAIN } from './active-calls.constants'

/**
 * SAMPLE DATA ONLY — static placeholder records, not calls on any real PBX. Documentation-range
 * addresses (RFC 5737) and reserved .test domains are used on purpose. Call state values are
 * illustrative; the audit does not list the allowed set (§28).
 */
export const MOCK_WILDCARD_DOMAINS = [MOCK_DEFAULT_DOMAIN, 'globex.pepperpbx.test']

export const mockActiveCalls: ActiveCall[] = [
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000001',
    callState: 'ACTIVE',
    direction: 'inbound',
    created: '2026-10-12T09:14:05',
    cid_name: 'Maria Lopez',
    cid_num: '2025550143',
    destination: '1001',
    ip_addr: '203.0.113.10',
    domain: MOCK_DEFAULT_DOMAIN,
    hostname: '198.51.100.21',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000002',
    callState: 'RINGING',
    direction: 'inbound',
    created: '2026-10-12T09:15:31',
    cid_name: 'John Carter',
    cid_num: '2025550188',
    destination: '1002',
    ip_addr: '203.0.113.10',
    domain: MOCK_DEFAULT_DOMAIN,
    hostname: '198.51.100.21',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000003',
    callState: 'ACTIVE',
    direction: 'outbound',
    created: '2026-10-12T09:02:47',
    cid_name: 'Sales Desk',
    cid_num: '1004',
    destination: '2025550177',
    ip_addr: '203.0.113.11',
    domain: MOCK_DEFAULT_DOMAIN,
    hostname: '198.51.100.22',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000004',
    callState: 'EARLY',
    direction: 'outbound',
    created: '2026-10-12T09:16:02',
    cid_name: 'Support',
    cid_num: '1010',
    destination: '2025550102',
    ip_addr: '203.0.113.11',
    domain: MOCK_DEFAULT_DOMAIN,
    hostname: '198.51.100.22',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000005',
    callState: 'HELD',
    direction: 'inbound',
    created: '2026-10-12T08:47:19',
    cid_name: 'Priya Nair',
    cid_num: '2025550166',
    destination: '1003',
    ip_addr: '203.0.113.10',
    domain: MOCK_DEFAULT_DOMAIN,
    hostname: '198.51.100.21',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000006',
    callState: 'ACTIVE',
    direction: 'inbound',
    created: '2026-10-12T09:10:44',
    cid_name: 'Hank Moreau',
    cid_num: '2025550121',
    destination: '3001',
    ip_addr: '203.0.113.12',
    domain: 'globex.pepperpbx.test',
    hostname: '198.51.100.23',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000007',
    callState: 'RINGING',
    direction: 'outbound',
    created: '2026-10-12T09:16:40',
    cid_name: 'Front Office',
    cid_num: '3002',
    destination: '2025550155',
    ip_addr: '203.0.113.12',
    domain: 'globex.pepperpbx.test',
    hostname: '198.51.100.23',
  },
  {
    uuid: 'a1f0c2d4-0001-4a10-9b01-000000000008',
    callState: 'ACTIVE',
    direction: 'inbound',
    // No created timestamp — the audit renders an empty cell in that case (§5).
    cid_name: 'Unknown',
    cid_num: '2025550199',
    destination: '3003',
    ip_addr: '203.0.113.12',
    domain: 'globex.pepperpbx.test',
    hostname: '198.51.100.23',
  },
]
