import type { GatewayDetails, HiveGatewayDetails, SbcDomainOption, SipProfileOption } from './gateway.types'

const DEFAULT_DOMAIN = 'sip.pepperpbx.local'

export const mockHiveGatewayDetails: HiveGatewayDetails = {
  defaultDomain: DEFAULT_DOMAIN,
  domainOptions: [DEFAULT_DOMAIN, 'branch.pepperpbx.local', 'remote.pepperpbx.local'],
}

export const mockSbcDomains: SbcDomainOption[] = [
  { label: 'sbc1.pepperpbx.local', value: 'sbc1.pepperpbx.local' },
  { label: 'sbc2.pepperpbx.local', value: 'sbc2.pepperpbx.local' },
]

export const mockSipProfiles: SipProfileOption[] = [
  { label: 'internal', value: 'internal' },
  { label: 'external', value: 'external' },
]

/**
 * Seed data for gateway.service.ts's in-memory working copy — replace with a real API response
 * once the backend endpoints are available (see gateway.service.ts). Records are stored in the
 * rich create/update shape (GatewayDetails); the list is projected from these by the service.
 * Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, gateway: string, fields: Partial<GatewayDetails>): GatewayDetails => ({
  gateway_uuid: uuid,
  gateway,
  domain_name: DEFAULT_DOMAIN,
  sbcDomainIp: mockSbcDomains[0].value,
  proxy: '203.0.113.10',
  expire_seconds: 800,
  retry_seconds: 30,
  context: 'public',
  register: true,
  enabled: true,
  distinct_to: false,
  caller_id_in_from: false,
  supress_cng: false,
  extension_in_contact: false,
  status: 'Running',
  ...fields,
})

export const mockGateways: GatewayDetails[] = [
  seed('gw-acme-voip', 'acme-voip', { username: 'acme_trunk', password: 'Password1', realm: 'acme-voip.test', description: 'Primary outbound trunk', hostname: 'sip.acme-voip.test', status: 'Running', state: 'UP' }),
  seed('gw-acme-backup', 'acme-backup', { username: 'acme_backup', password: 'Password1', proxy: '203.0.113.20', description: 'Backup trunk', status: 'Stopped', state: 'DOWN' }),
  seed('gw-branch-local', 'branch-local', { domain_name: 'branch.pepperpbx.local', proxy: '198.51.100.5', register: false, enabled: true, description: 'Branch office local PSTN gateway', status: 'Stopped' }),
  seed('gw-branch-fax', 'branch-fax', { domain_name: 'branch.pepperpbx.local', username: 'branch_fax', password: 'Password1', proxy: '198.51.100.6', description: 'Branch fax line', enabled: false, status: 'Stopped', state: 'DOWN' }),
  seed('gw-remote-sip', 'remote-sip', { domain_name: 'remote.pepperpbx.local', username: 'remote_sip', password: 'Password1', proxy: '192.0.2.15', hostname: 'sip.remote.test', description: 'Remote office SIP trunk', status: 'Running', state: 'UP' }),
  seed('gw-remote-overflow', 'remote-overflow', { domain_name: 'remote.pepperpbx.local', register: false, proxy: '192.0.2.16', description: 'Overflow route, no registration' }),
  seed('gw-global-carrier', 'global-carrier', { domain_name: 'global', username: 'carrier1', password: 'Password1', proxy: 'carrier.example.test', realm: 'carrier.example.test', description: 'Shared carrier trunk', status: 'Running', state: 'UP' }),
]
