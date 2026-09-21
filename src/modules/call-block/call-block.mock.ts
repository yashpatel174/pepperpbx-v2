import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { CallBlockDetails, HiveCallBlockDetails, RecentCall, SelectOption } from './call-block.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with Extensions/Gateways/Outbound Routes/Announcements
 * (store/domain.ts) rather than inventing a separate literal. Also seeds AXION_SAMPLE_DOMAIN
 * ("sip.axionhq.hivepbx.com", matching Destinations'/Outbound Routes'/Announcements' own seed
 * domain) from the start — a session that bootstrapped any of those modules before visiting Call
 * Block will already have that domain persisted as the shared current-domain (store/domain.ts's
 * `currentDomain`), so `showAll=false` needs matching records under it too, or the list renders
 * empty despite real seed data existing. Learned directly from the identical issue already hit
 * (and fixed after the fact) in Outbound Routes and Announcements — seeded correctly here up front.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

export const mockHiveCallBlockDetails: HiveCallBlockDetails = {
  defaultDomain: DEFAULT_DOMAIN,
  domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN],
}

/**
 * GET .../callBlocks/extDropdown?domain_name=... — domain-scoped extension options
 * (call-block.md §8/§9/§12/§33: "server-driven Extension dropdown ... do not hardcode"). Kept as
 * this module's own independent mock, not imported from the Extensions module's own data —
 * matches every sibling module's documented precedent of not depending on sibling modules' mock
 * data at the component/service level. This module's own dedicated dropdown endpoint is
 * conceptually distinct from the Extensions module's CRUD list, exactly as Outbound Routes'
 * dedicated gateway-options endpoint is distinct from the Gateways module's own CRUD list.
 */
export const mockExtensionOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: '101 - Front Desk', value: 'ext-101' },
    { label: '102 - Sales', value: 'ext-102' },
    { label: '103 - Support', value: 'ext-103' },
  ],
  [BRANCH_DOMAIN]: [
    { label: '201 - Branch Reception', value: 'ext-201' },
    { label: '202 - Branch Sales', value: 'ext-202' },
  ],
  [AXION_SAMPLE_DOMAIN]: [
    { label: '101 - Front Desk', value: 'ext-101-axion' },
    { label: '104 - Accounts', value: 'ext-104-axion' },
  ],
}

/**
 * GET .../callBlocks/actionDropdown?domain_name=... — domain-scoped call-block actions
 * (call-block.md §8/§9/§12/§33: "server-driven Action dropdown ... do not hardcode"). Same
 * self-contained-mock convention as the extension options above. Real-world call-blocking actions
 * are plausibly domain-invariant, but the audit documents the endpoint as domain-scoped
 * (`?domain_name=`), so every domain gets its own (currently identical) option list rather than
 * one hardcoded module-wide constant, to keep the service boundary honest about being
 * domain-parameterized.
 */
export const mockActionOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Reject', value: 'reject' },
    { label: 'Busy', value: 'busy' },
    { label: 'Hangup', value: 'hangup' },
    { label: 'Send to Voicemail', value: 'voicemail' },
  ],
  [BRANCH_DOMAIN]: [
    { label: 'Reject', value: 'reject' },
    { label: 'Busy', value: 'busy' },
    { label: 'Hangup', value: 'hangup' },
  ],
  [AXION_SAMPLE_DOMAIN]: [
    { label: 'Reject', value: 'reject' },
    { label: 'Busy', value: 'busy' },
    { label: 'Hangup', value: 'hangup' },
    { label: 'Send to Voicemail', value: 'voicemail' },
  ],
}

/**
 * Seed data for call-block.service.ts's in-memory working copy — replace with a real API response
 * once the backend endpoints are available. Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, fields: Partial<CallBlockDetails>): CallBlockDetails => ({
  call_block_uuid: uuid,
  call_block_direction: 'inbound',
  call_block_action: 'reject',
  domain_name: DEFAULT_DOMAIN,
  call_block_enabled: true,
  call_block_count: 0,
  date_added: '2026-01-01T00:00:00.000Z',
  ...fields,
})

export const mockCallBlocks: CallBlockDetails[] = [
  seed('cb-spam-1', {
    call_block_name: 'Known Spam Caller',
    call_block_number: '18005551234',
    call_block_count: 14,
    date_added: '2026-01-15T09:30:00.000Z',
    call_block_description: 'Repeat robocall complaints',
  }),
  seed('cb-spam-2', {
    call_block_country_code: '91',
    call_block_number: '9876543210',
    call_block_count: 3,
    date_added: '2026-02-02T14:12:00.000Z',
  }),
  seed('cb-outbound-1', {
    call_block_direction: 'outbound',
    extension_uuid: 'ext-102',
    call_block_name: 'Premium Rate Blocklist',
    call_block_number: '19005551212',
    call_block_action: 'busy',
    call_block_count: 1,
    date_added: '2026-02-10T11:00:00.000Z',
    call_block_description: 'Block outbound dialing to premium-rate numbers',
  }),
  seed('cb-disabled-1', {
    extension_uuid: 'ext-103',
    call_block_name: 'Old Vendor Line',
    call_block_enabled: false,
    call_block_count: 0,
    date_added: '2026-01-20T08:00:00.000Z',
  }),
  seed('cb-branch-1', {
    domain_name: BRANCH_DOMAIN,
    extension_uuid: 'ext-201',
    call_block_name: 'Branch Nuisance Caller',
    call_block_number: '18005559876',
    call_block_count: 6,
    date_added: '2026-02-05T10:45:00.000Z',
  }),
  seed('cb-branch-outbound', {
    domain_name: BRANCH_DOMAIN,
    call_block_direction: 'outbound',
    call_block_number: '19005550000',
    call_block_action: 'hangup',
    call_block_count: 0,
    date_added: '2026-02-11T16:20:00.000Z',
  }),
  /**
   * Reference-sample records for AXION_SAMPLE_DOMAIN — see the constant's comment above.
   */
  seed('cb-axion-1', {
    domain_name: AXION_SAMPLE_DOMAIN,
    extension_uuid: 'ext-101-axion',
    call_block_name: 'Telemarketer',
    call_block_number: '18005550100',
    call_block_count: 9,
    date_added: '2026-02-03T12:00:00.000Z',
    call_block_description: 'Frequent telemarketing calls',
  }),
  seed('cb-axion-2', {
    domain_name: AXION_SAMPLE_DOMAIN,
    call_block_direction: 'outbound',
    extension_uuid: 'ext-104-axion',
    call_block_number: '19005550200',
    call_block_action: 'voicemail',
    call_block_count: 0,
    date_added: '2026-02-06T09:15:00.000Z',
  }),
  seed('cb-axion-3', {
    domain_name: AXION_SAMPLE_DOMAIN,
    call_block_country_code: '44',
    call_block_number: '7911123456',
    call_block_enabled: false,
    call_block_count: 2,
    date_added: '2026-01-28T17:40:00.000Z',
    call_block_description: 'International spoofed caller',
  }),
]

/**
 * Seed "recent calls" per domain — matched against a block's name/number by
 * getRecentCallBlockList's fuzzy filter (call-block.md §3/§12: "matching the block's
 * call_block_name + call_block_number"). Independent of the Call Block records above; a real
 * backend would source this from the actual call log (CDR), which PepperPBX has no module for
 * yet, so this is a self-contained mock dataset — see call-block.service.ts's BACKEND CONTRACT
 * REQUIRED note.
 */
export const mockRecentCallsByDomain: Record<string, RecentCall[]> = {
  [DEFAULT_DOMAIN]: [
    { id: 'cdr-1', direction: 'inbound', callerIdName: 'Known Spam Caller', callerIdNumber: '18005551234', destination: '101', startEpoch: 1770000000, duration: 42 },
    { id: 'cdr-2', direction: 'inbound', callerIdName: 'Known Spam Caller', callerIdNumber: '18005551234', destination: '102', startEpoch: 1770003600, duration: 15 },
    { id: 'cdr-3', direction: 'inbound', callerIdNumber: '9876543210', destination: '103', startEpoch: 1770007200, duration: 8 },
    { id: 'cdr-4', direction: 'outbound', callerIdNumber: '19005551212', destination: '19005551212', startEpoch: 1770010800, duration: 120 },
    { id: 'cdr-5', direction: 'inbound', callerIdName: 'Unknown', callerIdNumber: '15551230000', destination: '101', startEpoch: 1770014400, duration: 3 },
  ],
  [BRANCH_DOMAIN]: [
    { id: 'cdr-b1', direction: 'inbound', callerIdName: 'Branch Nuisance Caller', callerIdNumber: '18005559876', destination: '201', startEpoch: 1770100000, duration: 25 },
    { id: 'cdr-b2', direction: 'outbound', callerIdNumber: '19005550000', destination: '19005550000', startEpoch: 1770103600, duration: 60 },
  ],
  [AXION_SAMPLE_DOMAIN]: [
    { id: 'cdr-a1', direction: 'inbound', callerIdName: 'Telemarketer', callerIdNumber: '18005550100', destination: 'ext-101-axion', startEpoch: 1770200000, duration: 33 },
    { id: 'cdr-a2', direction: 'inbound', callerIdNumber: '447911123456', destination: 'ext-104-axion', startEpoch: 1770203600, duration: 5 },
    { id: 'cdr-a3', direction: 'outbound', callerIdNumber: '19005550200', destination: '19005550200', startEpoch: 1770207200, duration: 90 },
  ],
}
