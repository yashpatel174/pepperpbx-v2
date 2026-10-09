/**
 * Canonical sample-rate values the UI selects between (music-on-hold.md §8: Default / 8 kHz /
 * 16 kHz / 32 kHz / 48 kHz). BACKEND CONTRACT REQUIRED: the audit prints only the labels and the
 * `default` default — the numeric wire strings are a mock assumption, kept in one place
 * (`mohRateOptions`) so they are trivial to correct.
 */
export type MohRate = 'default' | '8000' | '16000' | '32000' | '48000'

/** '1' = Mono, '2' = Stereo (the audit only confirms '2' = stereo, §25). */
export type MohChannels = '1' | '2'

/** An uploaded audio file inside a category record (music-on-hold.md §5). `file_size` is the backend's display string, rendered raw. */
export interface MohAudioFile {
  audio_name: string
  file_size: string
  /** ISO timestamp; formatted for display only (`MM-DD-YYYY hh:mm:ss a`, §27). */
  uploaded: string
}

/**
 * One category + rate record — the unit the Edit page, Shuffle, Delete and View all address by
 * `category_uuid` (music-on-hold.md §27: the "uuid" sent on delete is this record's uuid, not the
 * file's). Files hang off it; the same category name at another rate is a separate record.
 */
export interface MohCategory {
  category_uuid: string
  category_name: string
  music_on_hold_rate: MohRate
  /** The audit models these as the strings 'true' / '2' on the wire (§25); the service normalizes them. */
  category_shuffle: boolean
  stereo: boolean
  items: MohAudioFile[]
}

/** Accordion group: every rate record of one category name within one domain (music-on-hold.md §26). */
export interface MohGroup {
  maintitle: string
  domainName: string
  child: MohCategory[]
}

export interface MohListQuery {
  showAll?: boolean
  search?: string
}

/** Edit-page record (music-on-hold.md §8). Interval / chime values are free text in the form, numbers on the wire. */
export interface MohDetails {
  category_uuid: string
  music_on_hold_name: string
  music_on_hold_path: string
  music_on_hold_rate: MohRate
  music_on_hold_channels: MohChannels
  music_on_hold_interval: number | null
  music_on_hold_timer_name: string
  music_on_hold_chime_list: string | null
  music_on_hold_chime_freq: number | null
  music_on_hold_chime_max: number | null
  music_on_hold_shuffle: boolean
  domain_name: string
}

/** The editable subset sent on update — category, path, rate and domain are read-only (music-on-hold.md §8). */
export interface MohUpdatePayload {
  music_on_hold_channels: MohChannels
  music_on_hold_interval: number | null
  music_on_hold_timer_name: string
  music_on_hold_chime_list: string | null
  music_on_hold_chime_freq: number | null
  music_on_hold_chime_max: number | null
  music_on_hold_shuffle: boolean
}

/** Edit form values: numeric fields stay text until submit (§27: coerced with Number()). */
export interface MohEditFormValues {
  music_on_hold_name: string
  music_on_hold_path: string
  music_on_hold_rate: MohRate
  domain_name: string
  music_on_hold_channels: MohChannels
  music_on_hold_interval?: string
  music_on_hold_timer_name: string
  music_on_hold_chime_list?: string
  music_on_hold_chime_freq?: string
  music_on_hold_chime_max?: string
  music_on_hold_shuffle: boolean
}

/** Existing category offered by the Add popup (`getCategoryOptions`, §27): its rate records and their uuids. */
export interface MohCategoryOption {
  categoryName: string
  rates: { rate: MohRate; music_on_hold_uuid: string }[]
}

export interface MohDomainOptions {
  defaultDomain: string
  domainOptions: string[]
}

/**
 * Add-popup payload. When `music_on_hold_uuid` is set the upload is appended to that existing
 * category + rate record and name / rate are not sent (music-on-hold.md §27).
 */
export interface CreateMohPayload {
  domain_name: string
  is_new_category: boolean
  music_on_hold_name?: string
  music_on_hold_rate?: MohRate
  music_on_hold_uuid?: string
  /** The actual selected File — never an Ant Design upload wrapper. */
  file: File
}

export interface DeleteMohFilePayload {
  /** The category record's uuid (§27), not a per-file id. */
  music_on_hold_uuid: string
  file_name: string
}

/** What the playMusic endpoint resolves: a playable source and the file name to offer on download. */
export interface MohAudio {
  url: string
  fileName: string
}
