import type { MohChannels, MohRate } from './music-on-hold.types'

export const musicOnHoldListPath = '/applications/music-on-hold'
export const musicOnHoldEditPath = (categoryUuid: string): string => `${musicOnHoldListPath}/${categoryUuid}/edit`

/** music-on-hold.md §8. Wire values are a mock assumption — see `MohRate`. */
export const mohRateOptions: { value: MohRate; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: '8000', label: '8 kHz' },
  { value: '16000', label: '16 kHz' },
  { value: '32000', label: '32 kHz' },
  { value: '48000', label: '48 kHz' },
]

export const mohRateLabel = (rate: MohRate): string => mohRateOptions.find((option) => option.value === rate)?.label ?? rate

/** music-on-hold.md §8 (Mono / Stereo). '2' = stereo is the audit-confirmed value (§25). */
export const mohChannelsOptions: { value: MohChannels; label: string }[] = [
  { value: '1', label: 'Mono' },
  { value: '2', label: 'Stereo' },
]

/** music-on-hold.md §10/§26: MP3 / WAV / OGG, at most 80 MB (`maximumAudioFileSize`). */
export const mohMimeTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg']
export const maximumAudioFileSizeBytes = 80 * 1024 * 1024

/** music-on-hold.md §26: the audio file name (minus extension) allows letters, numbers, dashes and underscores only. */
export const audioFileNameRule = /^[a-zA-Z0-9_-]+$/

/** music-on-hold.md §10: digits only, at most 20 (Interval / Chime Frequency / Chime Maximum). */
export const numericFieldRule = /^\d{1,20}$/

/** music-on-hold.md §27: `dayjs(uploaded).format(dateFormatUS)`. */
export const uploadedDateFormat = 'MM-DD-YYYY hh:mm:ss a'

/** Search commits this long after typing stops (the debounce every PepperPBX list module uses). */
export const searchDebounceMs = 400

/**
 * Module-local placeholder permission strings per CLAUDE.md's `<module>.<action>` rule — not
 * Axion's `pbx_musiconhold_*` keys (music-on-hold.md §14) and not a confirmed backend contract.
 * Shuffle deliberately uses `edit`, NOT Axion's cross-module Variables permission (§14/§28/§33).
 */
export const mohPermissions = {
  view: 'music-on-hold.view',
  add: 'music-on-hold.add',
  edit: 'music-on-hold.edit',
  all: 'music-on-hold.manage',
}
