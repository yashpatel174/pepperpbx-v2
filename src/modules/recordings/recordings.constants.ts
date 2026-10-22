export const defaultPageSize = 10

/** recordings.md §5: 10, 25, 50, 100, 200. */
export const pageSizeOptions = [10, 25, 50, 100, 200]

/**
 * Fields the mock list search matches. The audit does NOT confirm the backend's matching
 * semantics (recordings.md §6/§28) — this is a mock-only guess, to be replaced by the real
 * server-side search.
 */
export const searchableRecordingFields = ['recording_name', 'recording_filename', 'recording_description'] as const

/** recordings.md §26: letters, numbers, dashes and underscores — no spaces or special characters. */
export const recordingNameRule = /^[a-zA-Z0-9_-]+$/

/** recordings.md §11: the uploaded file's name (minus extension) follows the same rule as the name. */
export const audioFileNameRule = recordingNameRule

/** recordings.md §11/§26: MP3 / WAV / OGG, at most 80 MB (`maximumAudioFileSize`). */
export const recordingMimeTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg']
export const maximumAudioFileSizeBytes = 80 * 1024 * 1024

/**
 * Module-local placeholder permission strings per CLAUDE.md's `<module>.<action>` rule — not a
 * reproduction of Axion's `pbx_systemrecordings_*` keys (recordings.md §14) and not a confirmed
 * backend contract. Axion's Show All gate (`pbx_axiontech` / multiple wildcard domains) is not
 * reproduced either: no such signal exists here yet.
 */
export const recordingPermissions = {
  view: 'recordings.view',
  add: 'recordings.add',
  edit: 'recordings.edit',
  all: 'recordings.manage',
}

export const recordingEditPath = (recordingUuid: string): string => `/recordings/${recordingUuid}/edit`
