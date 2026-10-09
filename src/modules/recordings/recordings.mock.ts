import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { Recording } from './recordings.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with the other modules (store/domain.ts) and the two extra domains
 * Voicemail/Call Block seed, so Show All off has matching records whichever module bootstrapped the
 * shared current-domain first.
 */
export const mockDefaultDomain = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

export const mockRecordingDomainOptions = [mockDefaultDomain, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/**
 * Invented sample data — only the field NAMES come from the audit. `size` / `time` are free-form
 * display strings (recordings.md §27). `default: true` rows are the system-provided recordings.
 */
export const mockRecordings: Recording[] = [
  { recording_uuid: 'rec-001', domain_name: mockDefaultDomain, recording_name: 'welcome_greeting', recording_filename: 'welcome_greeting.wav', size: '312.4 KB', time: '2026-05-04 09:12:45', recording_description: 'Main line welcome prompt', default: false },
  { recording_uuid: 'rec-002', domain_name: mockDefaultDomain, recording_name: 'after_hours', recording_filename: 'after_hours.wav', size: '198.0 KB', time: '2026-05-04 09:20:03', recording_description: 'Played outside business hours', default: false },
  { recording_uuid: 'rec-003', domain_name: mockDefaultDomain, recording_name: 'hold_message', recording_filename: 'hold_message.wav', size: '1.2 MB', time: '2026-05-11 14:02:31', recording_description: undefined, default: false },
  { recording_uuid: 'rec-004', domain_name: mockDefaultDomain, recording_name: 'holiday-closure', recording_filename: 'holiday-closure.wav', size: '254.8 KB', time: '2026-05-19 16:45:10', recording_description: 'Public holiday announcement', default: false },
  { recording_uuid: 'rec-005', domain_name: mockDefaultDomain, recording_name: 'sales_queue_intro', recording_filename: 'sales_queue_intro.wav', size: '421.6 KB', time: '2026-05-22 10:08:57', recording_description: 'Sales queue introduction', default: false },
  { recording_uuid: 'rec-006', domain_name: mockDefaultDomain, recording_name: 'support_queue_intro', recording_filename: 'support_queue_intro.wav', size: '389.2 KB', time: '2026-05-22 10:15:12', recording_description: 'Support queue introduction', default: false },
  { recording_uuid: 'rec-007', domain_name: mockDefaultDomain, recording_name: 'invalid_option', recording_filename: 'invalid_option.wav', size: '64.5 KB', time: '2026-06-01 08:30:00', recording_description: 'IVR invalid selection prompt', default: false },
  { recording_uuid: 'rec-008', domain_name: mockDefaultDomain, recording_name: 'voicemail_prompt', recording_filename: 'voicemail_prompt.wav', size: '143.9 KB', time: '2026-06-03 11:27:44', recording_description: undefined, default: false },
  { recording_uuid: 'rec-009', domain_name: mockDefaultDomain, recording_name: 'conference_welcome', recording_filename: 'conference_welcome.wav', size: '276.3 KB', time: '2026-06-09 13:50:21', recording_description: 'Conference bridge greeting', default: false },
  { recording_uuid: 'rec-010', domain_name: mockDefaultDomain, recording_name: 'transfer_notice', recording_filename: 'transfer_notice.wav', size: '88.1 KB', time: '2026-06-12 15:05:36', recording_description: 'Please hold while we transfer you', default: false },
  { recording_uuid: 'rec-011', domain_name: mockDefaultDomain, recording_name: 'system_default_prompt', recording_filename: 'system_default_prompt.wav', size: '52.7 KB', time: '2026-01-15 00:00:00', recording_description: 'System-provided prompt', default: true },
  { recording_uuid: 'rec-012', domain_name: mockDefaultDomain, recording_name: 'system_beep', recording_filename: 'system_beep.wav', size: '9.4 KB', time: '2026-01-15 00:00:00', recording_description: 'System-provided tone', default: true },
  { recording_uuid: 'rec-013', domain_name: BRANCH_DOMAIN, recording_name: 'branch_welcome', recording_filename: 'branch_welcome.wav', size: '305.0 KB', time: '2026-05-28 09:00:12', recording_description: 'Branch office greeting', default: false },
  { recording_uuid: 'rec-014', domain_name: BRANCH_DOMAIN, recording_name: 'branch_after_hours', recording_filename: 'branch_after_hours.wav', size: '187.2 KB', time: '2026-05-28 09:06:48', recording_description: undefined, default: false },
  { recording_uuid: 'rec-015', domain_name: AXION_SAMPLE_DOMAIN, recording_name: 'axion_demo_prompt', recording_filename: 'axion_demo_prompt.wav', size: '230.8 KB', time: '2026-06-02 17:40:05', recording_description: 'Demo tenant prompt', default: false },
]

/**
 * A one-second silent WAV as a data URL. MOCK ONLY: it stands in for the audio the play endpoint
 * would serve (the real response — URL vs binary — is NOT CONFIRMED by the audit, §28), so the
 * seeded recordings play silence. Recordings uploaded through the Add modal in this session play
 * their real file instead (see recordings.service.ts).
 */
let silentWavUrl: string | undefined
export const mockSilentAudioUrl = (): string => {
  if (silentWavUrl) return silentWavUrl
  const sampleRate = 8000
  const buffer = new ArrayBuffer(44 + sampleRate)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, 36 + sampleRate, true)
  write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  write(36, 'data')
  view.setUint32(40, sampleRate, true)
  new Uint8Array(buffer, 44).fill(128)
  let binary = ''
  new Uint8Array(buffer).forEach((byte) => (binary += String.fromCharCode(byte)))
  silentWavUrl = `data:audio/wav;base64,${btoa(binary)}`
  return silentWavUrl
}
