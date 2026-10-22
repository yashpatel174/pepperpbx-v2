import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { MohAudioFile, MohDetails } from './music-on-hold.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with the other modules (store/domain.ts) plus the two extra domains
 * Recordings/Voicemail seed, so Show All off has matching records whichever module bootstrapped the
 * shared current-domain first.
 */
export const mockDefaultDomain = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

export const mockMohDomainOptions = [mockDefaultDomain, BRANCH_DOMAIN, AXION_SAMPLE_DOMAIN]

/** Stand-in for `getChimeFileOptions` (music-on-hold.md §12). Invented names. */
export const mockChimeFiles = ['chime-soft.wav', 'chime-bell.wav', 'chime-tone.wav']

/** The service's internal record: the Edit-page details plus the category's audio files. */
export interface MohRecord extends MohDetails {
  files: MohAudioFile[]
}

const pathFor = (domain: string, category: string, rate: string) => `/usr/share/freeswitch/sounds/music/${domain}/${category}/${rate}`

const record = (
  uuid: string,
  domain: string,
  name: string,
  rate: MohDetails['music_on_hold_rate'],
  overrides: Partial<MohDetails>,
  files: MohAudioFile[]
): MohRecord => ({
  category_uuid: uuid,
  music_on_hold_name: name,
  music_on_hold_path: pathFor(domain, name, rate),
  music_on_hold_rate: rate,
  music_on_hold_channels: '1',
  music_on_hold_interval: null,
  music_on_hold_timer_name: 'soft',
  music_on_hold_chime_list: null,
  music_on_hold_chime_freq: null,
  music_on_hold_chime_max: null,
  music_on_hold_shuffle: false,
  domain_name: domain,
  ...overrides,
  files,
})

/** Invented sample data — only the field NAMES come from the audit. */
export const mockMohRecords: MohRecord[] = [
  record('moh-001', mockDefaultDomain, 'default', '8000', {}, [
    { audio_name: 'office_jazz.wav', file_size: '2.4 MB', uploaded: '2026-05-04T09:12:45' },
    { audio_name: 'soft_piano.mp3', file_size: '3.1 MB', uploaded: '2026-05-04T09:15:02' },
  ]),
  record('moh-002', mockDefaultDomain, 'default', '16000', { music_on_hold_timer_name: 'wideband' }, [
    { audio_name: 'office_jazz_hd.wav', file_size: '4.8 MB', uploaded: '2026-05-04T09:20:30' },
  ]),
  record(
    'moh-003',
    mockDefaultDomain,
    'sales_hold',
    '8000',
    {
      music_on_hold_channels: '2',
      music_on_hold_shuffle: true,
      music_on_hold_interval: 30,
      music_on_hold_chime_list: 'chime-soft.wav',
      music_on_hold_chime_freq: 60,
      music_on_hold_chime_max: 3,
      music_on_hold_timer_name: 'sales',
    },
    [
      { audio_name: 'upbeat_one.mp3', file_size: '1.9 MB', uploaded: '2026-05-11T14:02:31' },
      { audio_name: 'upbeat_two.mp3', file_size: '2.2 MB', uploaded: '2026-05-11T14:05:10' },
      { audio_name: 'upbeat_three.ogg', file_size: '1.4 MB', uploaded: '2026-05-12T10:44:09' },
    ]
  ),
  record('moh-004', mockDefaultDomain, 'support_music', '16000', { music_on_hold_shuffle: true, music_on_hold_timer_name: 'support' }, [
    { audio_name: 'calm_strings.wav', file_size: '5.6 MB', uploaded: '2026-05-19T16:45:10' },
    { audio_name: 'ambient_waves.wav', file_size: '6.2 MB', uploaded: '2026-05-19T16:48:55' },
  ]),
  record('moh-005', mockDefaultDomain, 'holiday_specials', '48000', { music_on_hold_channels: '2', music_on_hold_timer_name: 'holiday' }, []),
  record('moh-006', BRANCH_DOMAIN, 'branch_hold', '8000', { music_on_hold_timer_name: 'branch' }, [
    { audio_name: 'branch_theme.mp3', file_size: '1.1 MB', uploaded: '2026-05-28T09:00:12' },
  ]),
  record('moh-007', AXION_SAMPLE_DOMAIN, 'demo_moh', '48000', { music_on_hold_channels: '2', music_on_hold_timer_name: 'demo' }, [
    { audio_name: 'demo_track.wav', file_size: '9.8 MB', uploaded: '2026-06-02T17:40:05' },
  ]),
]

/**
 * A one-second silent WAV as a data URL. MOCK ONLY: it stands in for the audio the playMusic
 * endpoint would serve (the real response — URL vs binary — is NOT CONFIRMED by the audit, §28), so
 * seeded files play silence. Files uploaded through the Add popup in this session play their real file.
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
