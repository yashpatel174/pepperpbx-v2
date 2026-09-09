import type { ExtensionDetails, HiveUserDetails } from './extension.types'

const DEFAULT_DOMAIN = 'sip.axionhq.hivepbx.com'

/**
 * Seed data for extension.service.ts's in-memory working copy — replace with a real API
 * response once the backend endpoints are available (see extension.service.ts).
 * Records are stored in the rich create/update shape (ExtensionDetails); the list is
 * projected from these by the service. Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, extension: string, fields: Partial<ExtensionDetails>): ExtensionDetails => ({
  extension_uuid: uuid,
  extension,
  accountcode: '4100',
  password: 'Password1',
  limit_max: 5,
  limit_destination: '!USER_BUSY',
  missed_call_app: '',
  call_timeout: 30,
  user_record: '',
  sip_force_contact: '',
  sip_bypass_media: '',
  voicemail_file: '',
  domain_name: DEFAULT_DOMAIN,
  user_context: DEFAULT_DOMAIN,
  call_screen_enabled: false,
  force_ping: false,
  directory_visible: true,
  directory_exten_visible: true,
  voicemail_transcription_enabled: true,
  voicemail_local_after_email: true,
  voicemail_enabled: false,
  voicemail_password: '123456',
  enabled: true,
  ...fields,
})

export const mockExtensions: ExtensionDetails[] = [
  seed('ext-101', '101', { effective_caller_id_name: 'John Carter', outbound_caller_id_name: 'Acme Sales', call_group: 'Sales', description: 'Sales Desk 1', voicemail_enabled: true, voicemail_mail_to: 'john.carter@acme.test', directory_visible: true }),
  seed('ext-102', '102', { effective_caller_id_name: 'Emily Chen', outbound_caller_id_name: 'Acme Sales', call_group: 'Sales', description: 'Sales Desk 2', voicemail_enabled: true, voicemail_mail_to: 'emily.chen@acme.test', directory_visible: true }),
  seed('ext-103', '103', { effective_caller_id_name: 'Front Desk', outbound_caller_id_name: 'Acme Reception', call_group: 'Reception', description: 'Main Reception', voicemail_enabled: true, directory_visible: true, domain_name: '192.168.1.126', user_context: '192.168.1.126' }),
  seed('ext-104', '104', { effective_caller_id_name: 'Michael Rivera', outbound_caller_id_name: 'Acme Support', call_group: 'Support', description: 'Support Tier 1', voicemail_enabled: true, voicemail_mail_to: 'michael.rivera@acme.test', directory_visible: true, domain_name: '192.168.1.126', user_context: '192.168.1.126' }),
  seed('ext-105', '105', { effective_caller_id_name: 'Sarah Patel', outbound_caller_id_name: 'Acme Support', call_group: 'Support', description: 'Support Tier 1', voicemail_enabled: true, voicemail_mail_to: 'sarah.patel@acme.test', directory_visible: true }),
  seed('ext-106', '106', { effective_caller_id_name: 'David Kim', outbound_caller_id_name: 'Acme Support', call_group: 'Support', description: 'Support Tier 2', enabled: false, voicemail_enabled: false, directory_visible: false, domain_name: '192.168.1.126', user_context: '192.168.1.126' }),
  seed('ext-107', '107', { effective_caller_id_name: 'Laura Bianchi', outbound_caller_id_name: 'Acme Billing', call_group: 'Billing', description: 'Billing Desk', voicemail_enabled: true, directory_visible: true }),
  seed('ext-108', '108', { effective_caller_id_name: 'James Wilson', outbound_caller_id_name: 'Acme Billing', call_group: 'Billing', description: 'Billing Desk', voicemail_enabled: true, directory_visible: true }),
  seed('ext-109', '109', { effective_caller_id_name: 'Anna Novak', outbound_caller_id_name: 'Acme HR', call_group: 'HR', description: 'Human Resources', voicemail_enabled: true, voicemail_mail_to: 'anna.novak@acme.test', directory_visible: false }),
  seed('ext-110', '110', { effective_caller_id_name: 'Robert Singh', outbound_caller_id_name: 'Acme Executive', call_group: 'Executive', description: 'VP Operations', voicemail_enabled: true, voicemail_mail_to: 'robert.singh@acme.test', directory_visible: false }),
  seed('ext-111', '111', { effective_caller_id_name: 'Maria Gonzalez', outbound_caller_id_name: 'Acme Executive', call_group: 'Executive', description: 'CEO Office', voicemail_enabled: true, voicemail_mail_to: 'maria.gonzalez@acme.test', directory_visible: false }),
  seed('ext-112', '112', { effective_caller_id_name: 'Tom Becker', outbound_caller_id_name: 'Acme IT', call_group: 'IT', description: 'IT Helpdesk', voicemail_enabled: true, directory_visible: true }),
  seed('ext-113', '113', { effective_caller_id_name: 'Grace Lee', outbound_caller_id_name: 'Acme IT', call_group: 'IT', description: 'IT Helpdesk', enabled: false, voicemail_enabled: false, directory_visible: false }),
  seed('ext-114', '114', { effective_caller_id_name: 'Conference Room A', outbound_caller_id_name: 'Acme Office', description: 'Conference Room A Phone', voicemail_enabled: false, directory_visible: false, domain_name: '192.168.1.86', user_context: '192.168.1.86' }),
  seed('ext-115', '115', { effective_caller_id_name: 'Conference Room B', outbound_caller_id_name: 'Acme Office', description: 'Conference Room B Phone', voicemail_enabled: false, directory_visible: false, domain_name: '192.168.1.86', user_context: '192.168.1.86' }),
  seed('ext-116', '116', { effective_caller_id_name: 'Warehouse Line', outbound_caller_id_name: 'Acme Logistics', call_group: 'Logistics', description: 'Warehouse Extension', voicemail_enabled: true, directory_visible: true }),
  seed('ext-117', '117', { effective_caller_id_name: "Kevin O'Brien", outbound_caller_id_name: 'Acme Logistics', call_group: 'Logistics', description: 'Dispatch Desk', voicemail_enabled: true, directory_visible: true }),
  seed('ext-118', '118', { effective_caller_id_name: 'Nina Fischer', outbound_caller_id_name: 'Acme Marketing', call_group: 'Marketing', description: 'Marketing Team', voicemail_enabled: true, directory_visible: true }),
  // Marked as a protected/system record so Select Action's default-extension exclusion has
  // something real to demonstrate — see extension.service.ts's toListExtension.
  seed('ext-119', '119', { description: 'Unassigned Extension', enabled: false, voicemail_enabled: false, directory_visible: false, default: 'true' }),
  seed('ext-120', '120', { effective_caller_id_name: 'Voicemail Test', outbound_caller_id_name: 'Acme Office', description: 'Testing Line', enabled: false, voicemail_enabled: true, voicemail_mail_to: 'voicemail.test@acme.test', directory_visible: false }),
]

export const mockHiveUserDetails: HiveUserDetails = {
  autoExt: '100',
  accountNumber: '4100',
  defaultDomain: DEFAULT_DOMAIN,
  newDomainName: '',
  domainOptions: [DEFAULT_DOMAIN, '192.168.1.126', '192.168.1.86'],
  additionalExtStart: 100,
  additionalExtEnd: 999999,
  additionalExtExclude: ['211', '311', '411', '511', '611', '711', '811', '911', '988'],
}

export const mockHoldMusicOptions: string[] = ['default', 'hold_music.mp3', 'soft_jazz.wav', 'silent_hold.wav']