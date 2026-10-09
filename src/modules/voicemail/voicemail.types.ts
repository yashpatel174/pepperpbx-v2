export interface SelectOption {
  label: string
  value: string
}

/** Grouped option list, as `GET /api/voicemail/listOptions` returns it (voicemail.md §9). */
export interface SelectOptionGroup {
  label: string
  options: SelectOption[]
}

/** voicemail.md §9: attach / listen_link / download_link. */
export type VoicemailFileMode = 'attach' | 'listen_link' | 'download_link'

/**
 * List row (GET /api/voicemail/list, voicemail.md §4.4). `default` is the list-only flag that
 * hides the Status button (voicemail.md §7) — NOT the Default-greeting form field, which this
 * module calls `greeting_id` (see VoicemailFormValues).
 */
export interface Voicemail {
  voicemail_uuid: string
  domain_name: string
  voicemail_id: string
  voicemail_mail_to?: string
  voicemail_file: VoicemailFileMode
  voicemail_local_after_email: boolean
  voicemail_transcription_enabled: boolean
  voicemail_enabled: boolean
  voicemail_description?: string
  total_messages: number
  total_greetings: number
  default: boolean
}

export interface VoicemailListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface VoicemailListResponse {
  data: Voicemail[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** One row of the Options card (voicemail.md §9). `voicemail_option_uuid` exists on saved rows only. */
export interface VoicemailOption {
  voicemail_option_uuid?: string
  voicemail_option_digits: string
  voicemail_option_param: string
  /** 0–999 (rendered 000–999). */
  voicemail_option_order: number
  voicemail_option_description: string
}

/**
 * What the Add/Edit form collects — ONE shared shape for both modes (voicemail.md §9).
 * Booleans are real booleans: the audit's string `'true'` comparisons (§10, §24) are a backend
 * representation quirk, normalized at the service boundary rather than leaked into the UI.
 */
export interface VoicemailFormValues {
  voicemail_id: string
  voicemail_password: string
  /** The "Default" greeting select (audit field `default` / `greeting_id`). */
  greeting_id: string
  domain_name: string
  voicemail_alternate_greet_id: string
  voicemail_mail_to: string
  voicemail_file: VoicemailFileMode
  voicemail_description: string
  voicemail_tutorial: boolean
  voicemail_transcription_enabled: boolean
  voicemail_local_after_email: boolean
  voicemail_enabled: boolean
  options: VoicemailOption[]
  /** Voicemail UUIDs of the checked Forward Destinations. */
  addDestination: string[]
}

/** The stored record as `GET /api/voicemail/view` returns it. */
export interface VoicemailDetails extends VoicemailFormValues {
  voicemail_uuid: string
  total_messages: number
  total_greetings: number
  default: boolean
}

/**
 * GET /api/hiveuser/details?module=Voicemail&domain_name=... — Add/Edit/Copy bootstrap
 * (voicemail.md §8/§12). Only the fields the audit says the code reads. The shape of
 * `additionalExtExclude` is AMBIGUOUS in the audit (§24) — modelled here as a string array.
 */
export interface HiveVoicemailDetails {
  defaultDomain: string
  domainOptions: string[]
  /** Next suggested Voicemail ID for the domain. */
  autoExt: string
  additionalExtStart?: number
  additionalExtEnd?: number
  additionalExtExclude: string[]
}

/** The three domain-scoped lookups VoicemailForm loads in parallel (voicemail.md §8). */
export interface VoicemailLookups {
  /** GET /api/voicemail/listOptions — grouped Destination options for Option rows. */
  destinationOptions: SelectOptionGroup[]
  /** POST /api/voicemail/greetings — "Default" greeting select options. Content shape NOT CONFIRMED. */
  greetingOptions: SelectOption[]
  /** GET api/voicemail/listVoicemail — Forward Destinations checkbox options. */
  forwardOptions: SelectOption[]
}

export type ImportDelimiter = ',' | '|'
export type ImportEnclosure = '"' | ' '

export interface ImportVoicemailOptions {
  fromRow: number
  delimiter: ImportDelimiter
  enclosure: ImportEnclosure
  /** Pasted delimited text — used when no file is chosen (voicemail.md §16). */
  rawData?: string
  file?: File
}

/** Result of POST /api/voicemail/import — correlates to the match step via `csvId`. */
export interface ImportVoicemailResult {
  csvId: string
  csvColumns: string[]
  matchedFields: Record<string, string>
  unmatchedDbFields: string[]
  rowCount: number
}

/** Result of POST /api/voicemail/bulkIn (voicemail.md §16). */
export interface ImportInfo {
  add_count: number
  invalid_count: number
  duplicate_data: { voicemail_id: string; domain_name: string }[]
}

// -- Messages (voicemail.md §23a) ------------------------------------------------------------

export interface VoicemailMessage {
  voicemail_message_uuid: string
  /** Epoch seconds — formatted at render time; absent shows "-". */
  created_epoch?: number
  caller_id_name?: string
  caller_id_number?: string
  length?: string
  size?: string
  /** `null` = unread (rendered bold). A toggle flips between unread and read. */
  message_status: string | null
  /** Non-empty when the message audio can be played (the View action depends on it). */
  message_base64: string
  /** Transcription text. Field name NOT CONFIRMED by the audit (§23a only names the section). */
  message_transcription?: string
}

export interface VoicemailChildListQuery {
  voicemailUuid: string
  voicemailId: string
  page?: number
  pageSize?: number
}

export interface VoicemailMessageListResponse {
  data: VoicemailMessage[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

// -- Greetings (voicemail.md §23b) -----------------------------------------------------------

export interface VoicemailGreeting {
  voicemail_greeting_uuid: string
  greeting_id: number
  greeting_name: string
  greeting_filename: string
  size?: string
  /** Upload date (ISO string). */
  date: string
  greeting_description?: string
}

/** GET /viewGreetings — carries `greeting_base64`, which is stripped before the update request. */
export interface VoicemailGreetingDetails extends VoicemailGreeting {
  greeting_base64: string
}

export interface VoicemailGreetingListResponse {
  data: VoicemailGreeting[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

export interface CreateGreetingPayload {
  domain_name: string
  voicemail_id: string
  voicemail_uuid: string
  uploadFile: File
}

export interface GreetingEditValues {
  greeting_name: string
  greeting_description?: string
}
