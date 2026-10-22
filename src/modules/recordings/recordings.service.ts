import { defaultPageSize, searchableRecordingFields } from './recordings.constants'
import { mockDefaultDomain, mockRecordingDomainOptions, mockRecordings as seedRecordings, mockSilentAudioUrl } from './recordings.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  CreateRecordingPayload,
  Recording,
  RecordingAudio,
  RecordingDomainOptions,
  RecordingEditValues,
  RecordingListQuery,
  RecordingListResponse,
} from './recordings.types'

/**
 * The service's own working copy of the mock dataset. Kept private so recordings.service.ts is the
 * single mutation point for the mock "backend" — pages, components and the hook never import
 * recordings.mock.ts (CLAUDE.md's service-boundary rule). Resets on a real page reload.
 */
let recordings: Recording[] = seedRecordings.map((record) => ({ ...record }))

/** Object URLs of files uploaded through the Add modal this session, keyed by recording uuid. */
const uploadedMedia = new Map<string, string>()

const apiError = (status: number, message: string): ApiError => ({ status, message })

let uuidCounter = 0
const nextUuid = () => `rec-${Date.now()}-${(uuidCounter += 1)}`

/**
 * The domain the list defaults to when Show All is off: the global current-domain store (reused
 * as-is), falling back to the mock default domain until the Add modal's bootstrap has seeded it.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockDefaultDomain

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`
}

const pad = (value: number) => String(value).padStart(2, '0')
const formatTimestamp = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

/**
 * Mock implementation of the future recordings API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * GET /api/recordings/list?pageSize&pageNumber&showAll&search (recordings.md §12).
 * BACKEND CONTRACT REQUIRED: the real call has no domain parameter (the backend scopes by the
 * logged-in user) and the search semantics are unconfirmed (§6). The mock scopes by the global
 * current domain when `showAll` is false.
 */
export const fetchRecordings = (query: RecordingListQuery = {}): Promise<RecordingListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query
      const currentDomain = getCurrentDomainName()
      const needle = search.trim().toLowerCase()

      const filtered = recordings
        .filter((record) => showAll || record.domain_name === currentDomain)
        .filter(
          (record) =>
            !needle ||
            searchableRecordingFields.some((field) => {
              const value = record[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
        )

      const total_records = filtered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)
      const data = filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map((record) => ({ ...record }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/** GET /api/recordings/details?recording_uuid= (recordings.md §12). Rejects with a 404 for an unknown id. */
export const getRecording = (recordingUuid: string): Promise<Recording> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = recordings.find((record) => record.recording_uuid === recordingUuid)
      if (!found) {
        reject(apiError(404, `Recording ${recordingUuid} not found.`))
        return
      }
      resolve({ ...found })
    }, 250)
  })

/**
 * GET /api/hiveuser/details?module=Recording — domain options + default domain for the Add modal
 * (recordings.md §12). Also feeds the global domain store (the multi-tenancy placeholder):
 * availableDomains from `domainOptions`, currentDomain seeded once and never overwriting a persisted choice.
 */
export const getRecordingDomains = (): Promise<RecordingDomainOptions> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      setAvailableDomains(mockRecordingDomainOptions.map((name) => ({ id: name, name })))
      if (!currentDomain) setCurrentDomain({ id: mockDefaultDomain, name: mockDefaultDomain })
      resolve({ defaultDomain: mockDefaultDomain, domainOptions: [...mockRecordingDomainOptions] })
    }, 250)
  })

/**
 * POST /api/recordings/create (multipart: domain_name, recording, recording_name) — recordings.md §11.
 * The mock keeps the uploaded file as an object URL so it can be played back and downloaded in its
 * real format for the rest of the session.
 */
export const createRecording = (payload: CreateRecordingPayload): Promise<Recording> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!mockRecordingDomainOptions.includes(payload.domain_name)) {
        reject(apiError(400, `Unknown domain ${payload.domain_name}.`))
        return
      }
      const created: Recording = {
        recording_uuid: nextUuid(),
        domain_name: payload.domain_name,
        recording_name: payload.recording_name,
        recording_filename: payload.file.name,
        size: formatFileSize(payload.file.size),
        time: formatTimestamp(new Date()),
        recording_description: undefined,
        default: false,
      }
      uploadedMedia.set(created.recording_uuid, URL.createObjectURL(payload.file))
      recordings = [created, ...recordings]
      resolve({ ...created })
    }, 500)
  })

/** PATCH /api/recordings/update — only `recording_name` is editable (recordings.md §8/§26). */
export const updateRecording = (recordingUuid: string, values: RecordingEditValues): Promise<Recording> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = recordings.find((record) => record.recording_uuid === recordingUuid)
      if (!existing) {
        reject(apiError(404, `Recording ${recordingUuid} not found.`))
        return
      }
      if (existing.default) {
        reject(apiError(403, 'System recordings cannot be edited.'))
        return
      }
      const updated: Recording = { ...existing, recording_name: values.recording_name.trim() }
      recordings = recordings.map((record) => (record.recording_uuid === recordingUuid ? updated : record))
      resolve({ ...updated })
    }, 300)
  })

/**
 * DELETE /api/recordings/delete — { recording_uuid: string[], domain_uuid: string[] } (recordings.md §11).
 * Single-row and bulk delete share it. The mock needs no `domain_uuid`; the real call does.
 * System (`default`) recordings are refused — the UI never offers them, this guards a stale selection.
 */
export const deleteRecordings = (recordingUuids: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (recordings.some((record) => recordingUuids.includes(record.recording_uuid) && record.default)) {
        reject(apiError(403, 'System recordings cannot be deleted.'))
        return
      }
      recordingUuids.forEach((uuid) => {
        const mediaUrl = uploadedMedia.get(uuid)
        if (mediaUrl) URL.revokeObjectURL(mediaUrl)
        uploadedMedia.delete(uuid)
      })
      recordings = recordings.filter((record) => !recordingUuids.includes(record.recording_uuid))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/recordings/fetchRecording?recording_uuid= (recordings.md §12; PATCH is the backend's
 * atypical verb for this read). The audit treats the response as a URL string but does not confirm
 * it (§28) — if the backend returns binary audio, this boundary must convert it to an object URL.
 * Seeded mock recordings resolve a silent placeholder; session uploads resolve their real file.
 */
export const fetchRecordingAudio = (recordingUuid: string): Promise<RecordingAudio> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = recordings.find((record) => record.recording_uuid === recordingUuid)
      if (!found) {
        reject(apiError(404, 'Recording audio not found.'))
        return
      }
      resolve({ url: uploadedMedia.get(recordingUuid) ?? mockSilentAudioUrl(), fileName: found.recording_filename })
    }, 250)
  })
