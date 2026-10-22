import { defaultPageSize, searchableVoicemailFields, voicemailCsvFields } from './voicemail.constants'
import {
  buildMockGreetings,
  buildMockMessages,
  mockAudioUrl,
  mockDestinationOptionsByDomain,
  mockGreetingOptions,
  mockHiveVoicemailByDomain,
  mockVoicemails as seedVoicemails,
} from './voicemail.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  HiveVoicemailDetails,
  ImportInfo,
  ImportVoicemailOptions,
  ImportVoicemailResult,
  Voicemail,
  VoicemailDetails,
  VoicemailFileMode,
  CreateGreetingPayload,
  GreetingEditValues,
  VoicemailChildListQuery,
  VoicemailGreeting,
  VoicemailGreetingDetails,
  VoicemailGreetingListResponse,
  VoicemailMessage,
  VoicemailMessageListResponse,
  VoicemailFormValues,
  VoicemailListQuery,
  VoicemailListResponse,
  VoicemailLookups,
  VoicemailOption,
} from './voicemail.types'

/**
 * The service's own working copy of the mock dataset. Kept private so voicemail.service.ts is the
 * single mutation point for the mock "backend" — pages, components and the hook never import
 * voicemail.mock.ts (CLAUDE.md's service-boundary rule). Resets on a real page reload.
 */
let voicemails: VoicemailDetails[] = seedVoicemails.map((record) => cloneDetails(record))

/**
 * Messages and greetings live in their own stores, keyed by mailbox uuid and seeded to match each
 * mailbox's seed counts. The list's `total_messages` / `total_greetings` are derived from them, so
 * deleting or uploading is reflected in the Voicemail list's Tools pills.
 */
let messagesByMailbox: Record<string, VoicemailMessage[]> = Object.fromEntries(
  seedVoicemails.map((record) => [record.voicemail_uuid, buildMockMessages(record.voicemail_uuid, record.total_messages)])
)
let greetingsByMailbox: Record<string, VoicemailGreetingDetails[]> = Object.fromEntries(
  seedVoicemails.map((record) => [record.voicemail_uuid, buildMockGreetings(record.voicemail_uuid, record.total_greetings)])
)

const withCounts = <T extends { voicemail_uuid: string; total_messages: number; total_greetings: number }>(record: T): T => ({
  ...record,
  total_messages: messagesByMailbox[record.voicemail_uuid]?.length ?? 0,
  total_greetings: greetingsByMailbox[record.voicemail_uuid]?.length ?? 0,
})

function cloneDetails(details: VoicemailDetails): VoicemailDetails {
  return {
    ...details,
    options: details.options.map((row) => ({ ...row })),
    addDestination: [...details.addDestination],
  }
}

/** Projects the stored record into the lean list row (voicemail.md §4.4). */
const toListVoicemail = (rawDetails: VoicemailDetails): Voicemail => {
  const details = withCounts(rawDetails)
  return {
  voicemail_uuid: details.voicemail_uuid,
  domain_name: details.domain_name,
  voicemail_id: details.voicemail_id,
  voicemail_mail_to: details.voicemail_mail_to || undefined,
  voicemail_file: details.voicemail_file,
  voicemail_local_after_email: details.voicemail_local_after_email,
  voicemail_transcription_enabled: details.voicemail_transcription_enabled,
  voicemail_enabled: details.voicemail_enabled,
  voicemail_description: details.voicemail_description || undefined,
  total_messages: details.total_messages,
  total_greetings: details.total_greetings,
  default: details.default,
  }
}

const defaultMockHive = Object.values(mockHiveVoicemailByDomain)[0]

/**
 * The domain the list defaults to when Show All is off. Reads the global current-domain store
 * (reused as-is, never modified here apart from the hive bootstrap seeding below) and falls back
 * to the mock default domain until getHiveVoicemailDetails() has populated the store.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? defaultMockHive.defaultDomain

const apiError = (status: number, message: string): ApiError => ({ status, message })

let uuidCounter = 0
const nextUuid = (prefix: string) => `${prefix}-${Date.now()}-${(uuidCounter += 1)}`

const normalizeOptions = (rows: VoicemailOption[]): VoicemailOption[] =>
  rows.map((row) => ({
    ...row,
    voicemail_option_uuid: row.voicemail_option_uuid ?? nextUuid('vmo'),
    voicemail_option_digits: row.voicemail_option_digits ?? '',
    voicemail_option_param: row.voicemail_option_param ?? '',
    voicemail_option_order: Number(row.voicemail_option_order) || 0,
    voicemail_option_description: row.voicemail_option_description ?? '',
  }))

/**
 * Mock implementation of the future voicemail API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * GET /api/voicemail/list?pageSize&pageNumber&showAll&search (voicemail.md §12).
 * BACKEND CONTRACT REQUIRED: the real call has no domain parameter (the backend scopes by the
 * logged-in user, voicemail.md §18) and the searched fields are unconfirmed (§4.2). The mock scopes
 * by the global current domain when `showAll` is false.
 */
export const fetchVoicemails = (query: VoicemailListQuery = {}): Promise<VoicemailListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const needle = search.trim().toLowerCase()

      const filtered = voicemails
        .map(toListVoicemail)
        .filter((voicemail) => showAll || voicemail.domain_name === currentDomain)
        .filter(
          (voicemail) =>
            !needle ||
            searchableVoicemailFields.some((field) => {
              const value = voicemail[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
        )

      const total_records = filtered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)
      const data = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/** GET /api/voicemail/view?voicemail_uuid= (voicemail.md §10/§12). Rejects with a 404 for an unknown id. */
export const getVoicemailDetails = (voicemailUuid: string): Promise<VoicemailDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = voicemails.find((record) => record.voicemail_uuid === voicemailUuid)
      if (!details) {
        reject(apiError(404, `Voicemail ${voicemailUuid} not found.`))
        return
      }
      resolve({ ...cloneDetails(withCounts(details)), voicemail_description: details.voicemail_description.trim() })
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=Voicemail&domain_name=... — Add/Edit/Copy bootstrap
 * (voicemail.md §8/§12/§18). Also feeds the global domain store (the multi-tenancy placeholder):
 * availableDomains from `domainOptions`, currentDomain seeded once and never overwriting a persisted choice.
 *
 * Always call it with the relevant domain once known (current domain on Add, the record's domain
 * on Edit, the row's domain on Copy). The audit documents that Axion's Edit may instead look
 * lookups up under `localStorage.defaultDomain` (voicemail.md §18 "Ambiguous") — PepperPBX uses the
 * record's own domain.
 */
export const getHiveVoicemailDetails = (domainName?: string): Promise<HiveVoicemailDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const hive = (domainName && mockHiveVoicemailByDomain[domainName]) || defaultMockHive
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      setAvailableDomains(hive.domainOptions.map((name) => ({ id: name, name })))
      if (!currentDomain) setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })
      resolve({ ...hive, domainOptions: [...hive.domainOptions], additionalExtExclude: [...hive.additionalExtExclude] })
    }, 300)
  })

/**
 * The three domain-scoped lookups VoicemailForm needs, fetched in parallel (voicemail.md §8):
 * GET listOptions (destinations), POST greetings (Default select), GET listVoicemail (forward
 * destinations — the domain's other voicemails, excluding the one being edited).
 */
export const getVoicemailLookups = (domainName: string, excludeVoicemailUuid?: string): Promise<VoicemailLookups> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        destinationOptions: (mockDestinationOptionsByDomain[domainName] ?? []).map((group) => ({
          label: group.label,
          options: group.options.map((entry) => ({ ...entry })),
        })),
        greetingOptions: mockGreetingOptions.map((entry) => ({ ...entry })),
        forwardOptions: voicemails
          .filter((record) => record.domain_name === domainName && record.voicemail_uuid !== excludeVoicemailUuid)
          .map((record) => ({ label: record.voicemail_id, value: record.voicemail_uuid })),
      })
    }, 250)
  })

const toDetails = (values: VoicemailFormValues, voicemailUuid: string, existing?: VoicemailDetails): VoicemailDetails => ({
  ...values,
  // Domain is locked after creation (voicemail.md §10).
  domain_name: existing?.domain_name ?? values.domain_name,
  voicemail_uuid: voicemailUuid,
  voicemail_description: (values.voicemail_description ?? '').trim(),
  options: normalizeOptions(values.options ?? []),
  addDestination: [...(values.addDestination ?? [])],
  total_messages: existing?.total_messages ?? 0,
  total_greetings: existing?.total_greetings ?? 0,
  default: existing?.default ?? false,
})

/**
 * No client-side duplicate-ID check exists in Axion (voicemail.md §11 — "presumably server-side").
 * This mock-only 409 keeps the in-memory dataset consistent; the real message/status is NOT CONFIRMED.
 */
const assertVoicemailIdAvailable = (domainName: string, voicemailId: string, ignoreUuid?: string) => {
  const taken = voicemails.some(
    (record) => record.domain_name === domainName && record.voicemail_id === voicemailId && record.voicemail_uuid !== ignoreUuid
  )
  if (taken) throw apiError(409, `Voicemail ID ${voicemailId} already exists in this domain.`)
}

/** POST /api/voicemail/create (voicemail.md §12/§13). */
export const createVoicemail = (values: VoicemailFormValues): Promise<VoicemailDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        assertVoicemailIdAvailable(values.domain_name, values.voicemail_id)
      } catch (err) {
        reject(err)
        return
      }
      const created = toDetails(values, nextUuid('vm'))
      voicemails = [...voicemails, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/**
 * PATCH /api/voicemail/update (voicemail.md §12/§13). The real payload sends the Forward
 * Destinations as separate `addDestination` / `removeDestination` diffs against the loaded record;
 * the mock simply stores the resulting set, so that diff belongs to the real API boundary.
 */
export const updateVoicemail = (voicemailUuid: string, values: VoicemailFormValues): Promise<VoicemailDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = voicemails.findIndex((record) => record.voicemail_uuid === voicemailUuid)
      if (index === -1) {
        reject(apiError(404, `Voicemail ${voicemailUuid} not found.`))
        return
      }
      const existing = voicemails[index]
      try {
        assertVoicemailIdAvailable(existing.domain_name, values.voicemail_id, voicemailUuid)
      } catch (err) {
        reject(err)
        return
      }
      const updated = toDetails(values, voicemailUuid, existing)
      voicemails = [...voicemails.slice(0, index), updated, ...voicemails.slice(index + 1)]
      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/voicemail/delete — { voicemail_uuid: string[] }. Single-row and bulk delete both use it (voicemail.md §14). */
export const deleteVoicemails = (voicemailUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      // Referential cleanup: a voicemail uuid is referenced by other voicemails' Forward
      // Destinations (`addDestination`) and owns its message and greeting stores.
      voicemails = voicemails
        .filter((record) => !voicemailUuids.includes(record.voicemail_uuid))
        .map((record) =>
          record.addDestination.some((uuid) => voicemailUuids.includes(uuid))
            ? { ...record, addDestination: record.addDestination.filter((uuid) => !voicemailUuids.includes(uuid)) }
            : record
        )
      messagesByMailbox = Object.fromEntries(Object.entries(messagesByMailbox).filter(([uuid]) => !voicemailUuids.includes(uuid)))
      greetingsByMailbox = Object.fromEntries(Object.entries(greetingsByMailbox).filter(([uuid]) => !voicemailUuids.includes(uuid)))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/voicemail/toggle — { voicemail_uuid: string[] }, no explicit status field (voicemail.md
 * §7/§12): flips each targeted record's own `voicemail_enabled`. Used identically by the inline
 * Status button (one element, no confirmation) and the confirmed bulk Toggle. Records flagged
 * `default` are never toggled by the UI, but the mock does not enforce that — it is a UI rule in Axion.
 */
export const toggleVoicemails = (voicemailUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      voicemails = voicemails.map((record) =>
        voicemailUuids.includes(record.voicemail_uuid) ? { ...record, voicemail_enabled: !record.voicemail_enabled } : record
      )
      resolve()
    }, 200)
  })

/** The list-row flags the inline Attached / Keep Local / Transcribe pills can change. */
export type VoicemailFlagPatch = Partial<Pick<VoicemailFormValues, 'voicemail_file' | 'voicemail_local_after_email' | 'voicemail_transcription_enabled'>>

/**
 * Persists a single-field change from the list. The audit documents a dedicated toggle endpoint
 * only for `voicemail_enabled` (voicemail.md §7); these three fields are saved through
 * PATCH /api/voicemail/update, whose payload is the full record (§13). A real implementation
 * should therefore GET /view, merge `patch`, and PATCH the whole record — NOT CONFIRMED whether
 * the backend accepts partial updates. The mock merges the patch into the stored record.
 */
export const updateVoicemailFlags = (voicemailUuid: string, patch: VoicemailFlagPatch): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!voicemails.some((record) => record.voicemail_uuid === voicemailUuid)) {
        reject(apiError(404, `Voicemail ${voicemailUuid} not found.`))
        return
      }
      voicemails = voicemails.map((record) => (record.voicemail_uuid === voicemailUuid ? { ...record, ...patch } : record))
      resolve()
    }, 200)
  })

/**
 * PATCH /api/voicemail/copyVoicemailMessage — { new_voicemail_id, extension_uuid (the SOURCE
 * voicemail uuid), domain_uuid } (voicemail.md §15). What gets copied is decided by the backend;
 * the mock clones the settings and options and starts with no messages/greetings.
 */
export const copyVoicemail = (sourceUuid: string, newVoicemailId: string): Promise<VoicemailDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = voicemails.find((record) => record.voicemail_uuid === sourceUuid)
      if (!source) {
        reject(apiError(404, `Voicemail ${sourceUuid} not found.`))
        return
      }
      try {
        assertVoicemailIdAvailable(source.domain_name, newVoicemailId)
      } catch (err) {
        reject(err)
        return
      }
      const cloned: VoicemailDetails = {
        ...cloneDetails(source),
        voicemail_uuid: nextUuid('vm'),
        voicemail_id: newVoicemailId,
        options: source.options.map((row) => ({ ...row, voicemail_option_uuid: nextUuid('vmo') })),
        total_messages: 0,
        total_greetings: 0,
        default: false,
      }
      voicemails = [...voicemails, cloned]
      resolve(cloneDetails(cloned))
    }, 300)
  })

/**
 * DELETE /api/voicemail/deleteOptions — { voicemail_option_uuid: string[] } (voicemail.md §9 note 5).
 * Called IMMEDIATELY when an existing option row's trash icon is clicked, with no confirmation and
 * not deferred to Save — an Axion behavior preserved on purpose.
 */
export const deleteVoicemailOptions = (optionUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      voicemails = voicemails.map((record) => ({
        ...record,
        options: record.options.filter((row) => !row.voicemail_option_uuid || !optionUuids.includes(row.voicemail_option_uuid)),
      }))
      resolve()
    }, 200)
  })

// ---------------------------------------------------------------------------------------------
// Import / Import-match (voicemail.md §16) — parsed client-side by the mock.
// ---------------------------------------------------------------------------------------------

/** Splits one CSV line honoring the chosen delimiter and enclosure character. */
const splitCsvLine = (line: string, delimiter: string, enclosure: string): string[] => {
  const fields: string[] = []
  let current = ''
  let insideEnclosure = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (enclosure.trim() && char === enclosure) {
      if (insideEnclosure && line[i + 1] === enclosure) {
        current += enclosure
        i += 1
      } else {
        insideEnclosure = !insideEnclosure
      }
      continue
    }
    if (char === delimiter && !insideEnclosure) {
      fields.push(current)
      current = ''
      continue
    }
    current += char
  }
  fields.push(current)
  return fields.map((field) => field.trim())
}

const parseCsv = (text: string, delimiter: string, enclosure: string): string[][] =>
  text
    .split(/\r\n|\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => splitCsvLine(line, delimiter, enclosure))

const normalizeHeader = (value: string): string => value.trim().toLowerCase().replace(/[\s-]+/g, '_')

interface PendingImport {
  header: string[]
  dataRows: string[][]
}

/** Parsed-but-not-yet-committed imports, keyed by csvId (the CSV_id of voicemail.md §16). */
const pendingImports = new Map<string, PendingImport>()

/**
 * POST /api/voicemail/import (multipart) — returns { CSV_id, matches, nonMatches, remaining }.
 * The audit documents that response but not the backend's matching rules; header-label / db-key
 * matching here is a mock-only approximation. CSV text comes from the file, else the pasted raw data.
 */
export const importVoicemails = async (options: ImportVoicemailOptions): Promise<ImportVoicemailResult> => {
  const text = options.file ? await options.file.text() : (options.rawData ?? '')

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const rows = parseCsv(text, options.delimiter, options.enclosure)
      if (rows.length === 0) {
        reject(apiError(400, 'The uploaded CSV has no rows.'))
        return
      }

      const header = rows[0]
      const dataRows = rows.slice(Math.max(1, options.fromRow - 1))

      const matchedFields: Record<string, string> = {}
      header.forEach((column) => {
        const normalized = normalizeHeader(column)
        const field = voicemailCsvFields.find((entry) => entry.key === normalized || normalizeHeader(entry.header) === normalized)
        if (field && !matchedFields[field.key]) matchedFields[field.key] = column
      })

      const csvId = nextUuid('csv')
      pendingImports.set(csvId, { header, dataRows })

      resolve({
        csvId,
        csvColumns: header,
        matchedFields,
        unmatchedDbFields: voicemailCsvFields.map((entry) => entry.key).filter((key) => !(key in matchedFields)),
        rowCount: dataRows.length,
      })
    }, 400)
  })
}

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === '') return fallback
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase())
}

const fileModes: VoicemailFileMode[] = ['attach', 'listen_link', 'download_link']

/**
 * POST /api/voicemail/bulkIn — { CSV_id, mapField } → { add_count, invalid_count, duplicate_data }
 * (voicemail.md §13/§16). Row validity and duplicate rules here are mock-only: an invalid row has a
 * non-numeric Voicemail ID, no password, or an unknown domain; a duplicate repeats an existing
 * (domain, Voicemail ID) pair.
 */
export const createImportMatch = (csvId: string, mapField: Record<string, string>): Promise<ImportInfo> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const pending = pendingImports.get(csvId)
      if (!pending) {
        reject(apiError(404, 'Import data not found. Please import the CSV file again.'))
        return
      }

      const { header, dataRows } = pending
      const knownDomains = mockHiveVoicemailByDomain[getCurrentDomainName()]?.domainOptions ?? defaultMockHive.domainOptions
      const info: ImportInfo = { add_count: 0, invalid_count: 0, duplicate_data: [] }
      const created: VoicemailDetails[] = []

      dataRows.forEach((row) => {
        const read = (field: string): string | undefined => {
          const column = mapField[field]
          const index = column ? header.indexOf(column) : -1
          return index >= 0 ? row[index] : undefined
        }

        const voicemailId = (read('voicemail_id') ?? '').trim()
        const password = (read('voicemail_password') ?? '').trim()
        const domainName = (read('domain_name') ?? '').trim()

        if (!/^(?:\*\*\d+|\d+)$/.test(voicemailId) || !password || /\s/.test(password) || !knownDomains.includes(domainName)) {
          info.invalid_count += 1
          return
        }

        const isDuplicate = [...voicemails, ...created].some((record) => record.domain_name === domainName && record.voicemail_id === voicemailId)
        if (isDuplicate) {
          info.duplicate_data.push({ voicemail_id: voicemailId, domain_name: domainName })
          return
        }

        const rawFile = (read('voicemail_file') ?? '').trim() as VoicemailFileMode
        created.push({
          voicemail_uuid: nextUuid('vm'),
          voicemail_id: voicemailId,
          voicemail_password: password,
          greeting_id: (read('greeting_id') ?? '').trim() || '0',
          domain_name: domainName,
          voicemail_alternate_greet_id: (read('voicemail_alternate_greet_id') ?? '').trim(),
          voicemail_mail_to: (read('voicemail_mail_to') ?? '').trim(),
          voicemail_file: fileModes.includes(rawFile) ? rawFile : 'attach',
          voicemail_description: (read('voicemail_description') ?? '').trim(),
          voicemail_tutorial: parseBoolean(read('voicemail_tutorial'), false),
          voicemail_transcription_enabled: parseBoolean(read('voicemail_transcription_enabled'), true),
          voicemail_local_after_email: parseBoolean(read('voicemail_local_after_email'), true),
          voicemail_enabled: parseBoolean(read('voicemail_enabled'), true),
          options: [],
          addDestination: [],
          total_messages: 0,
          total_greetings: 0,
          default: false,
        })
        info.add_count += 1
      })

      voicemails = [...voicemails, ...created]
      pendingImports.delete(csvId)
      resolve(info)
    }, 400)
  })

// ---------------------------------------------------------------------------------------------
// Messages (voicemail.md §12, §23a)
// ---------------------------------------------------------------------------------------------

const paginate = <T>(rows: T[], page: number, pageSize: number) => {
  const total_records = rows.length
  const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
  const safePage = Math.min(Math.max(1, page), total_pages)
  return { data: rows.slice((safePage - 1) * pageSize, safePage * pageSize), page: safePage, pageSize, total_records, total_pages }
}

const requireMailbox = (voicemailUuid: string) => {
  if (!voicemails.some((record) => record.voicemail_uuid === voicemailUuid)) {
    throw apiError(404, `Voicemail ${voicemailUuid} not found.`)
  }
}

/** GET /api/voicemail/listMessage?pageSize&pageNumber&voicemailUuid&voicemailId. */
export const listMessages = (query: VoicemailChildListQuery): Promise<VoicemailMessageListResponse> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        requireMailbox(query.voicemailUuid)
      } catch (err) {
        reject(err)
        return
      }
      const rows = (messagesByMailbox[query.voicemailUuid] ?? []).map((row) => ({ ...row }))
      resolve(paginate(rows, query.page ?? 1, query.pageSize ?? defaultPageSize))
    }, 300)
  })

/** GET /api/voicemail/playmessage?voicemail_message_uuid&voicemail_uuid — resolves the audio URL. */
export const playMessage = (voicemailMessageUuid: string, voicemailUuid: string): Promise<string> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const message = messagesByMailbox[voicemailUuid]?.find((row) => row.voicemail_message_uuid === voicemailMessageUuid)
      if (!message || !message.message_base64) {
        reject(apiError(404, 'Message audio not found.'))
        return
      }
      resolve(mockAudioUrl())
    }, 250)
  })

/** DELETE /api/voicemail/deleteVoicemailMessage — { voicemail_message_uuid: string[] }. */
export const deleteMessages = (voicemailUuid: string, messageUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      messagesByMailbox = {
        ...messagesByMailbox,
        [voicemailUuid]: (messagesByMailbox[voicemailUuid] ?? []).filter((row) => !messageUuids.includes(row.voicemail_message_uuid)),
      }
      resolve()
    }, 300)
  })

// ---------------------------------------------------------------------------------------------
// Greetings (voicemail.md §12, §23b)
// ---------------------------------------------------------------------------------------------

const toListGreeting = (details: VoicemailGreetingDetails): VoicemailGreeting => ({
  voicemail_greeting_uuid: details.voicemail_greeting_uuid,
  greeting_id: details.greeting_id,
  greeting_name: details.greeting_name,
  greeting_filename: details.greeting_filename,
  size: details.size,
  date: details.date,
  greeting_description: details.greeting_description,
})

const findGreeting = (greetingUuid: string): VoicemailGreetingDetails | undefined =>
  Object.values(greetingsByMailbox)
    .flat()
    .find((row) => row.voicemail_greeting_uuid === greetingUuid)

/** GET /api/voicemail/listGreetings?voicemailUuid&voicemailId&pageSize&pageNumber. */
export const listGreetings = (query: VoicemailChildListQuery): Promise<VoicemailGreetingListResponse> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        requireMailbox(query.voicemailUuid)
      } catch (err) {
        reject(err)
        return
      }
      const rows = (greetingsByMailbox[query.voicemailUuid] ?? []).map(toListGreeting)
      resolve(paginate(rows, query.page ?? 1, query.pageSize ?? defaultPageSize))
    }, 300)
  })

/**
 * POST /api/voicemail/createGreetings (multipart) — { domain_name, voicemail_id, voicemail_uuid,
 * uploadFile }. The mock assigns the next greeting id and keeps only the file metadata.
 */
export const createGreeting = (payload: CreateGreetingPayload): Promise<VoicemailGreeting> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        requireMailbox(payload.voicemail_uuid)
      } catch (err) {
        reject(err)
        return
      }
      const existing = greetingsByMailbox[payload.voicemail_uuid] ?? []
      const greetingId = existing.reduce((max, row) => Math.max(max, row.greeting_id), 0) + 1
      // Upload accepts file names with spaces and dots (voicemail.md §11), but the greeting NAME must
      // pass the Edit rule (letters, numbers, dashes, underscores). So the stored name is derived from
      // the file name with any other run of characters normalised to "_"; `greeting_filename` keeps
      // the original file name.
      const normalizedName = payload.uploadFile.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
      const created: VoicemailGreetingDetails = {
        voicemail_greeting_uuid: nextUuid('greet'),
        greeting_id: greetingId,
        greeting_name: normalizedName || `greeting_${greetingId}`,
        greeting_filename: payload.uploadFile.name,
        size: `${Math.max(1, Math.round(payload.uploadFile.size / 1024))} KB`,
        date: new Date().toISOString(),
        greeting_base64: 'audio',
      }
      greetingsByMailbox = { ...greetingsByMailbox, [payload.voicemail_uuid]: [...existing, created] }
      resolve(toListGreeting(created))
    }, 400)
  })

/** GET /api/voicemail/viewGreetings?voicemail_greeting_uuid. */
export const getGreeting = (greetingUuid: string): Promise<VoicemailGreetingDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const found = findGreeting(greetingUuid)
      if (!found) {
        reject(apiError(404, `Greeting ${greetingUuid} not found.`))
        return
      }
      resolve({ ...found })
    }, 250)
  })

/**
 * PATCH /api/voicemail/updateGreetings — the edit-form values with `greeting_base64` removed
 * before sending (voicemail.md §12). The strip lives here, at the API boundary.
 */
export const updateGreeting = (details: VoicemailGreetingDetails, values: GreetingEditValues): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const { greeting_base64, ...payload } = { ...details, ...values }
      void greeting_base64
      if (!findGreeting(payload.voicemail_greeting_uuid)) {
        reject(apiError(404, `Greeting ${payload.voicemail_greeting_uuid} not found.`))
        return
      }
      greetingsByMailbox = Object.fromEntries(
        Object.entries(greetingsByMailbox).map(([mailbox, rows]) => [
          mailbox,
          rows.map((row) =>
            row.voicemail_greeting_uuid === payload.voicemail_greeting_uuid
              ? { ...row, greeting_name: payload.greeting_name, greeting_description: payload.greeting_description?.trim() || undefined }
              : row
          ),
        ])
      )
      resolve()
    }, 300)
  })

/** DELETE /api/voicemail/deleteGreetings — { voicemail_greeting_uuid: string[] }. */
export const deleteGreetings = (greetingUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      greetingsByMailbox = Object.fromEntries(
        Object.entries(greetingsByMailbox).map(([mailbox, rows]) => [mailbox, rows.filter((row) => !greetingUuids.includes(row.voicemail_greeting_uuid))])
      )
      resolve()
    }, 300)
  })

/** GET /api/voicemail/playGreeting?voicemail_greeting_uuid&voicemail_id — resolves the audio URL. */
export const playGreeting = (greetingUuid: string, voicemailId: string): Promise<string> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      void voicemailId
      if (!findGreeting(greetingUuid)) {
        reject(apiError(404, 'Greeting audio not found.'))
        return
      }
      resolve(mockAudioUrl())
    }, 250)
  })
