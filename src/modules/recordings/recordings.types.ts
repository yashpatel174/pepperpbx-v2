/**
 * A system recording (recordings.md §4/§5). One shape serves both the list row and the Edit
 * details: the audit reads the same fields from `list` and `details`. `size` and `time` are the
 * backend's own display strings, rendered raw (recordings.md §27) — never parsed into numbers/dates
 * for display.
 */
export interface Recording {
  recording_uuid: string
  domain_name: string
  recording_name: string
  recording_filename: string
  size: string
  time: string
  recording_description?: string
  /** System-provided recording: no row actions, not selectable, never editable (recordings.md §26). */
  default: boolean
}

export interface RecordingListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface RecordingListResponse {
  data: Recording[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/** Edit form — only the name is editable (recordings.md §8). */
export interface RecordingEditValues {
  recording_name: string
}

/** Add modal values (recordings.md §8). */
export interface CreateRecordingPayload {
  recording_name: string
  domain_name: string
  file: File
}

/** Domain options for the Add modal (the audit's `getHiveUserDetails?module=Recording`, §12). */
export interface RecordingDomainOptions {
  defaultDomain: string
  domainOptions: string[]
}

/** What the play endpoint resolves: a playable URL and the file name to offer on download. */
export interface RecordingAudio {
  url: string
  fileName: string
}
