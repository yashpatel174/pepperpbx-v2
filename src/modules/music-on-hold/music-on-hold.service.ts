import dayjs from 'dayjs'
import { mockChimeFiles, mockDefaultDomain, mockMohDomainOptions, mockMohRecords, mockSilentAudioUrl } from './music-on-hold.mock'
import type { MohRecord } from './music-on-hold.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  CreateMohPayload,
  DeleteMohFilePayload,
  MohAudio,
  MohCategory,
  MohCategoryOption,
  MohDetails,
  MohDomainOptions,
  MohGroup,
  MohListQuery,
  MohRate,
  MohUpdatePayload,
} from './music-on-hold.types'

/**
 * The service's own working copy of the mock dataset. Kept private so music-on-hold.service.ts is
 * the single mutation point for the mock "backend" — pages, components and the hook never import
 * music-on-hold.mock.ts (CLAUDE.md's service-boundary rule). Resets on a real page reload.
 */
let records: MohRecord[] = mockMohRecords.map((record) => ({ ...record, files: record.files.map((file) => ({ ...file })) }))

/** Object URLs of files uploaded through the Add popup this session, keyed by `${uuid}\n${fileName}`. */
const uploadedMedia = new Map<string, string>()
const mediaKey = (uuid: string, fileName: string) => `${uuid}\n${fileName}`

const apiError = (status: number, message: string): ApiError => ({ status, message })

let uuidCounter = 0
const nextUuid = () => `moh-${Date.now()}-${(uuidCounter += 1)}`

/**
 * The domain the list defaults to when Show All is off: the global current-domain store (reused
 * as-is), falling back to the mock default domain until the Add popup's bootstrap has seeded it.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockDefaultDomain

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`
}

const toCategory = (record: MohRecord): MohCategory => ({
  category_uuid: record.category_uuid,
  category_name: record.music_on_hold_name,
  music_on_hold_rate: record.music_on_hold_rate,
  category_shuffle: record.music_on_hold_shuffle,
  stereo: record.music_on_hold_channels === '2',
  items: record.files.map((file) => ({ ...file })),
})

/**
 * Mock implementation of the future Music On Hold API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * GET /api/moh/list?showAll&search (music-on-hold.md §12). The audit's list is NOT paginated
 * (the endpoint takes no page params, §12/§28), so the whole grouped set is returned. BACKEND
 * CONTRACT REQUIRED: the real call has no domain parameter (the backend scopes by the logged-in
 * user) and the search semantics are unconfirmed (§28). The mock scopes by the global current
 * domain when `showAll` is false and matches category and audio file names.
 */
export const fetchMusicOnHold = (query: MohListQuery = {}): Promise<MohGroup[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { showAll = false, search = '' } = query
      const currentDomain = getCurrentDomainName()
      const needle = search.trim().toLowerCase()

      const matched = records
        .filter((record) => showAll || record.domain_name === currentDomain)
        .filter(
          (record) =>
            !needle ||
            record.music_on_hold_name.toLowerCase().includes(needle) ||
            record.files.some((file) => file.audio_name.toLowerCase().includes(needle))
        )

      const groups = new Map<string, MohGroup>()
      matched.forEach((record) => {
        const key = `${record.domain_name}\n${record.music_on_hold_name}`
        const group = groups.get(key) ?? { maintitle: record.music_on_hold_name, domainName: record.domain_name, child: [] }
        group.child.push(toCategory(record))
        groups.set(key, group)
      })
      resolve([...groups.values()])
    }, 300)
  })

/** GET /api/moh/details?music_on_hold_uuid= (music-on-hold.md §12). Rejects with a 404 for an unknown id. */
export const getMusicOnHoldDetails = (categoryUuid: string): Promise<MohDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = records.find((record) => record.category_uuid === categoryUuid)
      if (!found) {
        reject(apiError(404, `Music on hold ${categoryUuid} not found.`))
        return
      }
      const { files, ...details } = found
      void files
      resolve({ ...details })
    }, 250)
  })

/** GET /api/moh/listChimeFile (music-on-hold.md §12). */
export const getChimeFileOptions = (): Promise<string[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve([...mockChimeFiles]), 200)
  })

/**
 * GET /api/hiveuser/details?module=MOH — domain options + default domain for the Add popup
 * (music-on-hold.md §12). Also feeds the global domain store (the multi-tenancy placeholder):
 * availableDomains from `domainOptions`, currentDomain seeded once and never overwriting a persisted choice.
 */
export const getMohDomains = (): Promise<MohDomainOptions> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      setAvailableDomains(mockMohDomainOptions.map((name) => ({ id: name, name })))
      if (!currentDomain) setCurrentDomain({ id: mockDefaultDomain, name: mockDefaultDomain })
      // Default to the shared current domain when it is one of the available options; otherwise fall back.
      const defaultDomain = currentDomain && mockMohDomainOptions.includes(currentDomain.name) ? currentDomain.name : mockDefaultDomain
      resolve({ defaultDomain, domainOptions: [...mockMohDomainOptions] })
    }, 250)
  })

/** GET /api/moh/listCategory?domain_name= — a domain's existing categories with their rate records (music-on-hold.md §27). */
export const getMohCategoryOptions = (domainName: string): Promise<MohCategoryOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const byName = new Map<string, MohCategoryOption>()
      records
        .filter((record) => record.domain_name === domainName)
        .forEach((record) => {
          const option = byName.get(record.music_on_hold_name) ?? { categoryName: record.music_on_hold_name, rates: [] }
          option.rates.push({ rate: record.music_on_hold_rate, music_on_hold_uuid: record.category_uuid })
          byName.set(record.music_on_hold_name, option)
        })
      resolve([...byName.values()])
    }, 250)
  })

/**
 * The multipart body of POST /api/moh/create (music-on-hold.md §11/§27): the real File under
 * `uploadFile`, never a JSON-serialized object. With an existing record's uuid the name and rate
 * are omitted — that uuid is what tells the backend to append to that category + rate.
 */
export const buildCreateFormData = (payload: CreateMohPayload): FormData => {
  const body = new FormData()
  body.append('domain_name', payload.domain_name)
  body.append('is_new_category', String(payload.is_new_category))
  if (payload.music_on_hold_uuid) {
    body.append('music_on_hold_uuid', payload.music_on_hold_uuid)
  } else {
    if (payload.music_on_hold_name) body.append('music_on_hold_name', payload.music_on_hold_name)
    if (payload.music_on_hold_rate) body.append('music_on_hold_rate', payload.music_on_hold_rate)
  }
  body.append('uploadFile', payload.file)
  return body
}

/**
 * POST /api/moh/create (multipart). The mock reads the request back out of the FormData it would
 * send, so the multipart contract is exercised, and keeps the uploaded file as an object URL so it
 * plays back and downloads in its real format for the rest of the session.
 *
 * Mock assumptions, UNCONFIRMED by the audit (§28 "duplicate uploads"): a new category whose
 * name + rate already exist in the domain, and a file name already present in the target record,
 * are rejected with a 409 instead of silently overwriting (delete is addressed by file name, so a
 * duplicate name would be ambiguous).
 */
export const createMusicOnHold = (payload: CreateMohPayload): Promise<void> =>
  new Promise((resolve, reject) => {
    const body = buildCreateFormData(payload)
    setTimeout(() => {
      const file = body.get('uploadFile')
      if (!(file instanceof File)) {
        reject(apiError(400, 'Audio file required.'))
        return
      }
      const domainName = String(body.get('domain_name'))
      if (!mockMohDomainOptions.includes(domainName)) {
        reject(apiError(400, `Unknown domain ${domainName}.`))
        return
      }
      const entry = { audio_name: file.name, file_size: formatFileSize(file.size), uploaded: dayjs().toISOString() }

      const existingUuid = body.get('music_on_hold_uuid')
      let targetUuid: string
      if (typeof existingUuid === 'string') {
        const target = records.find((record) => record.category_uuid === existingUuid)
        if (!target) {
          reject(apiError(404, 'The selected category no longer exists.'))
          return
        }
        if (target.files.some((existing) => existing.audio_name === file.name)) {
          reject(apiError(409, `A file named ${file.name} already exists in this category.`))
          return
        }
        records = records.map((record) => (record.category_uuid === existingUuid ? { ...record, files: [...record.files, entry] } : record))
        targetUuid = existingUuid
      } else {
        const name = String(body.get('music_on_hold_name')).trim()
        const rate = String(body.get('music_on_hold_rate')) as MohRate
        if (records.some((record) => record.domain_name === domainName && record.music_on_hold_name === name && record.music_on_hold_rate === rate)) {
          reject(apiError(409, 'This category already exists at the selected rate. Choose the existing category to add a file to it.'))
          return
        }
        targetUuid = nextUuid()
        records = [
          ...records,
          {
            category_uuid: targetUuid,
            music_on_hold_name: name,
            music_on_hold_path: `/usr/share/freeswitch/sounds/music/${domainName}/${name}/${rate}`,
            music_on_hold_rate: rate,
            music_on_hold_channels: '1',
            music_on_hold_interval: null,
            music_on_hold_timer_name: name,
            music_on_hold_chime_list: null,
            music_on_hold_chime_freq: null,
            music_on_hold_chime_max: null,
            music_on_hold_shuffle: false,
            domain_name: domainName,
            files: [entry],
          },
        ]
      }
      uploadedMedia.set(mediaKey(targetUuid, file.name), URL.createObjectURL(file))
      resolve()
    }, 500)
  })

/** PATCH /api/moh/update — only the editable settings are sent (music-on-hold.md §8/§27). */
export const updateMusicOnHold = (categoryUuid: string, payload: MohUpdatePayload): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!records.some((record) => record.category_uuid === categoryUuid)) {
        reject(apiError(404, `Music on hold ${categoryUuid} not found.`))
        return
      }
      records = records.map((record) => (record.category_uuid === categoryUuid ? { ...record, ...payload } : record))
      resolve()
    }, 300)
  })

/**
 * DELETE /api/moh/delete — { music_on_hold_uuid: category uuid, file_name } (music-on-hold.md §11/§27).
 * Deletes a single audio file; the category record itself stays (no folder delete is offered).
 */
export const deleteMohFile = ({ music_on_hold_uuid, file_name }: DeleteMohFilePayload): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const target = records.find((record) => record.category_uuid === music_on_hold_uuid)
      if (!target || !target.files.some((file) => file.audio_name === file_name)) {
        reject(apiError(404, `${file_name} no longer exists.`))
        return
      }
      const mediaUrl = uploadedMedia.get(mediaKey(music_on_hold_uuid, file_name))
      if (mediaUrl) URL.revokeObjectURL(mediaUrl)
      uploadedMedia.delete(mediaKey(music_on_hold_uuid, file_name))
      records = records.map((record) =>
        record.category_uuid === music_on_hold_uuid ? { ...record, files: record.files.filter((file) => file.audio_name !== file_name) } : record
      )
      resolve()
    }, 300)
  })

/**
 * GET /api/moh/playMusic?music_on_hold_uuid=&file_name= (music-on-hold.md §12). The audit treats the
 * response as a playable URL but does not confirm it (§28) — if the backend returns binary audio,
 * this boundary must convert it to an object URL. Seeded files resolve a silent placeholder;
 * session uploads resolve their real file.
 */
export const fetchMohAudio = (categoryUuid: string, fileName: string): Promise<MohAudio> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = records.find((record) => record.category_uuid === categoryUuid)?.files.some((file) => file.audio_name === fileName)
      if (!found) {
        reject(apiError(404, 'Audio file not found.'))
        return
      }
      resolve({ url: uploadedMedia.get(mediaKey(categoryUuid, fileName)) ?? mockSilentAudioUrl(), fileName })
    }, 250)
  })

/** PATCH /api/moh/MOHShuffle — { music_on_hold_uuid: [uuid] } (music-on-hold.md §11/§27). The mock reorders the files. */
export const shuffleMusicOnHold = (categoryUuid: string): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const target = records.find((record) => record.category_uuid === categoryUuid)
      if (!target) {
        reject(apiError(404, `Music on hold ${categoryUuid} not found.`))
        return
      }
      const files = [...target.files]
      for (let i = files.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[files[i], files[j]] = [files[j], files[i]]
      }
      records = records.map((record) => (record.category_uuid === categoryUuid ? { ...record, files } : record))
      resolve()
    }, 300)
  })
