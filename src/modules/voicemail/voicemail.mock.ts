import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type {
  HiveVoicemailDetails,
  SelectOption,
  SelectOptionGroup,
  VoicemailDetails,
  VoicemailGreetingDetails,
  VoicemailMessage,
  VoicemailOption,
} from './voicemail.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with the other modules (store/domain.ts) and seeds the same two extra
 * domains Call Block uses, so `showAll=false` has matching records whichever module bootstrapped
 * the shared current-domain first.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

const domainOptions = [DEFAULT_DOMAIN, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/**
 * GET /api/hiveuser/details?module=Voicemail&domain_name=... (voicemail.md §8/§12). Per-domain
 * `autoExt` / range / reserved list. Values are invented mock data — the real response only
 * confirms the field NAMES the Axion code reads.
 */
export const mockHiveVoicemailByDomain: Record<string, HiveVoicemailDetails> = {
  [DEFAULT_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions,
    autoExt: '120',
    additionalExtStart: 100,
    additionalExtEnd: 999,
    additionalExtExclude: ['911', '999'],
  },
  [BRANCH_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions,
    autoExt: '220',
    additionalExtStart: 200,
    additionalExtEnd: 299,
    additionalExtExclude: ['250'],
  },
  [AXION_SAMPLE_DOMAIN]: {
    defaultDomain: DEFAULT_DOMAIN,
    domainOptions,
    autoExt: '300',
    additionalExtStart: 100,
    additionalExtEnd: 999999,
    additionalExtExclude: [],
  },
}

/** POST /api/voicemail/greetings — content shape NOT CONFIRMED by the audit (voicemail.md §9). */
export const mockGreetingOptions: SelectOption[] = [
  { label: 'Default', value: '0' },
  { label: 'Greeting 1 — Business hours', value: '1' },
  { label: 'Greeting 2 — After hours', value: '2' },
  { label: 'Greeting 3 — Holiday', value: '3' },
]

/** GET /api/voicemail/listOptions — grouped Destination options (voicemail.md §9). Mock content. */
export const mockDestinationOptionsByDomain: Record<string, SelectOptionGroup[]> = {
  [DEFAULT_DOMAIN]: [
    {
      label: 'Extensions',
      options: [
        { label: '101 - Front Desk', value: 'transfer:101 XML sip.pepperpbx.local' },
        { label: '102 - Sales', value: 'transfer:102 XML sip.pepperpbx.local' },
      ],
    },
    { label: 'Other', options: [{ label: 'Hangup', value: 'hangup' }] },
  ],
  [BRANCH_DOMAIN]: [
    { label: 'Extensions', options: [{ label: '201 - Branch Reception', value: 'transfer:201 XML branch.pepperpbx.local' }] },
    { label: 'Other', options: [{ label: 'Hangup', value: 'hangup' }] },
  ],
  [AXION_SAMPLE_DOMAIN]: [
    { label: 'Extensions', options: [{ label: '101 - Front Desk', value: 'transfer:101 XML sip.axionhq.hivepbx.com' }] },
    { label: 'Other', options: [{ label: 'Hangup', value: 'hangup' }] },
  ],
}

const option = (uuid: string, digits: string, param: string, order: number, description: string): VoicemailOption => ({
  voicemail_option_uuid: uuid,
  voicemail_option_digits: digits,
  voicemail_option_param: param,
  voicemail_option_order: order,
  voicemail_option_description: description,
})

type Seed = Partial<VoicemailDetails> & Pick<VoicemailDetails, 'voicemail_uuid' | 'voicemail_id' | 'domain_name'>

const seed = (record: Seed): VoicemailDetails => ({
  voicemail_password: '1234',
  greeting_id: '0',
  voicemail_alternate_greet_id: '',
  voicemail_mail_to: '',
  voicemail_file: 'attach',
  voicemail_description: '',
  voicemail_tutorial: false,
  voicemail_transcription_enabled: true,
  voicemail_local_after_email: true,
  voicemail_enabled: true,
  options: [],
  addDestination: [],
  total_messages: 0,
  total_greetings: 0,
  default: false,
  ...record,
})

/**
 * Seed data for voicemail.service.ts's working copy — never mutated directly. Covers enabled and
 * disabled records, all three Voicemail File modes, Keep Local / Transcribe on and off, the
 * `default` flag (hides Status), option rows, forward destinations, long and empty descriptions,
 * and enough records in the default domain (>10) to exercise pagination and the page-size select.
 */
export const mockVoicemails: VoicemailDetails[] = [
  seed({
    voicemail_uuid: 'vm-101',
    voicemail_id: '101',
    domain_name: DEFAULT_DOMAIN,
    voicemail_mail_to: 'frontdesk@pepperpbx.local',
    voicemail_description: 'Front desk mailbox',
    total_messages: 4,
    total_greetings: 2,
    greeting_id: '1',
    voicemail_alternate_greet_id: '555',
    options: [option('vmo-1', '1', 'transfer:102 XML sip.pepperpbx.local', 0, 'Press 1 for sales'), option('vmo-2', '0', 'hangup', 1, 'Press 0 to end')],
    addDestination: ['vm-102'],
  }),
  seed({
    voicemail_uuid: 'vm-102',
    voicemail_id: '102',
    domain_name: DEFAULT_DOMAIN,
    voicemail_mail_to: 'sales@pepperpbx.local,sales-lead@pepperpbx.local',
    voicemail_file: 'listen_link',
    voicemail_description: 'Sales team voicemail with a deliberately long description to exercise truncation and the tooltip in the table',
    total_messages: 12,
    total_greetings: 1,
  }),
  seed({
    voicemail_uuid: 'vm-103',
    voicemail_id: '103',
    domain_name: DEFAULT_DOMAIN,
    voicemail_mail_to: 'support@pepperpbx.local',
    voicemail_file: 'download_link',
    voicemail_local_after_email: false,
    voicemail_transcription_enabled: false,
    voicemail_enabled: false,
    voicemail_description: 'Support (disabled)',
    total_messages: 0,
    total_greetings: 0,
  }),
  seed({
    voicemail_uuid: 'vm-104',
    voicemail_id: '104',
    domain_name: DEFAULT_DOMAIN,
    voicemail_enabled: false,
    voicemail_local_after_email: false,
    total_messages: 1,
  }),
  seed({ voicemail_uuid: 'vm-105', voicemail_id: '105', domain_name: DEFAULT_DOMAIN, voicemail_mail_to: 'accounts@pepperpbx.local', voicemail_description: 'Accounts', total_messages: 7 }),
  seed({ voicemail_uuid: 'vm-106', voicemail_id: '106', domain_name: DEFAULT_DOMAIN, voicemail_description: 'Warehouse', total_greetings: 1 }),
  seed({ voicemail_uuid: 'vm-107', voicemail_id: '107', domain_name: DEFAULT_DOMAIN, voicemail_transcription_enabled: false, voicemail_description: 'Dispatch' }),
  seed({ voicemail_uuid: 'vm-108', voicemail_id: '108', domain_name: DEFAULT_DOMAIN, voicemail_file: 'listen_link', voicemail_mail_to: 'hr@pepperpbx.local', voicemail_description: 'HR' }),
  seed({ voicemail_uuid: 'vm-109', voicemail_id: '109', domain_name: DEFAULT_DOMAIN, voicemail_enabled: false, voicemail_description: 'Legal (disabled)' }),
  seed({ voicemail_uuid: 'vm-110', voicemail_id: '110', domain_name: DEFAULT_DOMAIN, voicemail_description: 'Marketing', total_messages: 2 }),
  seed({ voicemail_uuid: 'vm-111', voicemail_id: '111', domain_name: DEFAULT_DOMAIN, voicemail_mail_to: 'ops@pepperpbx.local', voicemail_description: 'Operations' }),
  seed({ voicemail_uuid: 'vm-112', voicemail_id: '98', domain_name: DEFAULT_DOMAIN, voicemail_description: 'Default mailbox (Status hidden)', default: true, total_messages: 3 }),
  seed({
    voicemail_uuid: 'vm-201',
    voicemail_id: '201',
    domain_name: BRANCH_DOMAIN,
    voicemail_mail_to: 'reception@branch.pepperpbx.local',
    voicemail_description: 'Branch reception',
    total_messages: 5,
    total_greetings: 1,
  }),
  seed({ voicemail_uuid: 'vm-202', voicemail_id: '202', domain_name: BRANCH_DOMAIN, voicemail_enabled: false, voicemail_description: 'Branch sales (disabled)' }),
  seed({
    voicemail_uuid: 'vm-301',
    voicemail_id: '301',
    domain_name: AXION_SAMPLE_DOMAIN,
    voicemail_mail_to: 'axion@axionhq.example',
    voicemail_file: 'download_link',
    voicemail_description: 'Axion sample domain mailbox',
    total_messages: 9,
  }),
]

// -- Messages / Greetings ----------------------------------------------------------------------

const CALLERS = [
  ['Alice Morgan', '5551230101'],
  ['Bob Chen', '5551230102'],
  ['', '5551230103'],
  ['Dana Ruiz', '5551230104'],
  ['Support Line', '5551230105'],
]

/**
 * Deterministic mock messages for one mailbox. The count follows the mailbox's seed
 * `total_messages`, so the list's Messages (n) pill agrees with the Messages page. Every third
 * message is read, every seventh has no audio (so the View action is hidden), and some carry a
 * transcription.
 */
export const buildMockMessages = (voicemailUuid: string, count: number): VoicemailMessage[] =>
  Array.from({ length: count }, (_, index) => {
    const [name, number] = CALLERS[index % CALLERS.length]
    return {
      voicemail_message_uuid: `${voicemailUuid}-msg-${index + 1}`,
      created_epoch: 1_760_000_000 - index * 86_400 - index * 1_234,
      caller_id_name: name || undefined,
      caller_id_number: number,
      length: `0:${String(10 + ((index * 7) % 50)).padStart(2, '0')}`,
      size: `${40 + index * 3} KB`,
      message_status: index % 3 === 2 ? 'saved' : null,
      message_base64: index % 7 === 6 ? '' : 'audio',
      message_transcription: index % 2 === 0 ? 'Hi, this is a mock transcription asking for a call back.' : undefined,
    }
  })

export const buildMockGreetings = (voicemailUuid: string, count: number): VoicemailGreetingDetails[] =>
  Array.from({ length: count }, (_, index) => ({
    voicemail_greeting_uuid: `${voicemailUuid}-greet-${index + 1}`,
    greeting_id: index + 1,
    greeting_name: `greeting_${index + 1}`,
    greeting_filename: `greeting_${index + 1}.wav`,
    size: `${120 + index * 20} KB`,
    date: new Date(Date.UTC(2026, 5, 1 + index)).toISOString(),
    greeting_description: index === 0 ? 'Business hours greeting' : undefined,
    greeting_base64: 'audio',
  }))

/**
 * A short silent WAV as a data URL — stands in for the audio URL that `playmessage` /
 * `playGreeting` return (the real URL format is NOT CONFIRMED by the audit).
 */
export const mockAudioUrl = (): string => {
  const sampleRate = 8000
  const samples = sampleRate // one second
  const buffer = new ArrayBuffer(44 + samples)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  write(36, 'data')
  view.setUint32(40, samples, true)
  new Uint8Array(buffer, 44).fill(128)
  let binary = ''
  new Uint8Array(buffer).forEach((byte) => (binary += String.fromCharCode(byte)))
  return `data:audio/wav;base64,${btoa(binary)}`
}
