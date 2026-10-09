import type { HiveVoicemailDetails, ImportDelimiter, ImportEnclosure, SelectOption, VoicemailFileMode, VoicemailFormValues, VoicemailOption } from './voicemail.types'

export const defaultPageSize = 10

/** voicemail.md §4.5: 10, 25, 50, 100, 200. */
export const pageSizeOptions = [10, 25, 50, 100, 200]

/** Search box max length (voicemail.md §4.2 — shared Text component, 300). */
export const searchMaxLength = 300

export const voicemailStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/**
 * Fields the mock list search matches. The audit does NOT confirm which fields the backend
 * searches (voicemail.md §4.2 "Not found in source") — this is a mock-only guess, to be replaced
 * by the real server-side search.
 */
export const searchableVoicemailFields = ['voicemail_id', 'voicemail_mail_to', 'voicemail_description', 'domain_name'] as const

/** voicemail.md §9 "Voicemail File" options. */
export const voicemailFileOptions: { label: string; value: VoicemailFileMode }[] = [
  { label: 'Audio File Attachment', value: 'attach' },
  { label: 'Listen Link (login required)', value: 'listen_link' },
  { label: 'Download Link (no login required)', value: 'download_link' },
]

/**
 * What the list's inline "Attached" toggle writes when switching Attached off. Voicemail File has
 * no "none" mode (voicemail.md §9: attach / listen_link / download_link), so "not attached" means
 * one of the two link modes; the login-required Listen Link is used. Switching back on writes `attach`.
 */
export const voicemailFileDisabledMode: VoicemailFileMode = 'listen_link'

/** voicemail.md §9: Order select 000…999 (values 0–999). */
export const optionOrderOptions: { label: string; value: number }[] = Array.from({ length: 1000 }, (_, index) => ({
  label: String(index).padStart(3, '0'),
  value: index,
}))

/** voicemail.md §9 note 5: a new option row. */
export const emptyOptionRow = (): VoicemailOption => ({
  voicemail_option_digits: '',
  voicemail_option_param: '',
  voicemail_option_order: 0,
  voicemail_option_description: '',
})

/** voicemail.md §11: Voicemail ID range fallbacks used in the validation message. */
export const defaultExtStart = 100
export const defaultExtEnd = 999999

/**
 * Module-local placeholder permission strings per CLAUDE.md's `<module>.<action>` rule — not a
 * reproduction of Axion's `pbx_voicemail_*` / `pbx_extensionbasic_*` keys (voicemail.md §19), and
 * not a confirmed backend contract. Axion's per-row permission flags are NOT reproduced: the
 * PepperPBX `Voicemail` entity carries no per-record permission data.
 */
export const voicemailPermissions = {
  view: 'voicemail.view',
  add: 'voicemail.add',
  edit: 'voicemail.edit',
  all: 'voicemail.manage',
}

/** Add-mode defaults (voicemail.md §8 "Defaults"). */
export const getDefaultVoicemailFormValues = (hive: HiveVoicemailDetails): VoicemailFormValues => ({
  voicemail_id: hive.autoExt,
  voicemail_password: '',
  greeting_id: '0',
  domain_name: hive.defaultDomain,
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
})

// -- Import (voicemail.md §16) --------------------------------------------------------------

/** From Row: 2…99. */
export const fromRowOptions: SelectOption[] = Array.from({ length: 98 }, (_, index) => {
  const value = String(index + 2)
  return { label: value, value }
})

export const delimiterOptions: { label: string; value: ImportDelimiter }[] = [
  { label: ',', value: ',' },
  { label: '|', value: '|' },
]

export const enclosureOptions: { label: string; value: ImportEnclosure }[] = [
  { label: '"', value: '"' },
  { label: 'Space', value: ' ' },
]

export const maximumCsvFileSizeBytes = 10 * 1024 * 1024

/** voicemail.md §11 file base-name pattern. */
export const csvFileNameRule = /^[a-zA-Z0-9_.-]+(?: [a-zA-Z0-9_.-]+)*$/

/**
 * Import-match DB fields in the sample CSV's column order, with the CSV header each is
 * auto-matched against (voicemail.md §16 "Sample columns"). The audit does not list the backend's
 * own matching rules — header-label/db-key matching here is a mock-only approximation.
 */
export const voicemailCsvFields: { key: string; header: string }[] = [
  { key: 'voicemail_id', header: 'Voicemail ID' },
  { key: 'voicemail_password', header: 'Password' },
  { key: 'voicemail_alternate_greet_id', header: 'Alternate Greet ID' },
  { key: 'voicemail_mail_to', header: 'Mail To' },
  { key: 'voicemail_transcription_enabled', header: 'Transcription Enabled' },
  { key: 'domain_name', header: 'Domain' },
  { key: 'voicemail_file', header: 'Voicemail File' },
  { key: 'voicemail_local_after_email', header: 'Keep Local' },
  { key: 'voicemail_enabled', header: 'Enabled' },
  { key: 'voicemail_description', header: 'Description' },
  { key: 'voicemail_tutorial', header: 'Play Tutorial' },
  { key: 'greeting_id', header: 'Default' },
]

/** voicemail.md §11 importMatchSchema. */
export const requiredImportMatchFields = ['voicemail_id', 'domain_name']

// -- Messages / Greetings (voicemail.md §3, §11, §23) ------------------------------------------

/**
 * Child-page URL carrying the FULL mailbox context (voicemail.md §3: `voicemail-uuid` AND
 * `voicemail-id`). Every link between Voicemail, Messages, Greetings and Edit goes through this /
 * `voicemailEditPath`, so neither value can be dropped (Axion's Messages → Settings link dropped
 * `voicemail-id`, voicemail.md §3 — not reproduced).
 */
export const voicemailChildPath = (kind: 'messages' | 'greetings', voicemailUuid: string, voicemailId: string): string =>
  `/voicemail/${kind}?voicemail-uuid=${encodeURIComponent(voicemailUuid)}&voicemail-id=${encodeURIComponent(voicemailId)}`

export const voicemailEditPath = (voicemailUuid: string): string => `/voicemail/${voicemailUuid}/edit`

export const maximumAudioFileSizeBytes = 80 * 1024 * 1024

/** voicemail.md §11 greeting upload MIME types. */
export const greetingMimeTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg']

/** Shared file-name pattern (voicemail.md §11) — same as the CSV base-name rule. */
export const audioFileNameRule = csvFileNameRule

/** voicemail.md §11 greeting edit: letters, numbers, dashes and underscores. */
export const greetingNameRule = /^[a-zA-Z0-9_-]+$/
