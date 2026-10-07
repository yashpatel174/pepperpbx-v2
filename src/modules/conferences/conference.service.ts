import { defaultPageSize, searchableConferenceFields } from './conference.constants'
import { mockConferenceProfileOptions, mockConferences as seedConferences, mockHiveConferenceDetails } from './conference.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  Conference,
  ConferenceDetails,
  ConferenceFormValues,
  ConferenceHiveDetails,
  ConferenceListParams,
  ConferenceListResult,
  ConferenceProfileOption,
} from './conference.types'

/**
 * The service's own working copy of the mock dataset. Kept private to this module so
 * conference.service.ts is the single mutation point for the mock "backend" — pages, components,
 * and the hook never import conference.mock.ts directly (CLAUDE.md's "a module's mock data lives
 * behind its service layer" rule) and never mutate this array directly (the explicit "do not
 * repeat the Extensions service bug" requirement for this module). Resets on a real page reload
 * since it's just a re-evaluated module; no fake persistence across refresh.
 */
let conferences: ConferenceDetails[] = seedConferences.map((record) => ({ ...record }))

/** Projects the rich stored record back into the lean list/table entity. */
const toListConference = (details: ConferenceDetails): Conference => ({
  id: details.conference_uuid,
  domain: details.domain_name,
  name: details.conference_name,
  extension: details.conference_extension,
  profile: details.conference_profile,
  order: details.conference_order,
  enabled: details.conference_enabled,
  description: details.conference_description,
})

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveConferenceDetails() has populated the store.
 */
const getCurrentDomainName = (): string =>
  useDomainStore.getState().currentDomain?.name ?? mockHiveConferenceDetails[Object.keys(mockHiveConferenceDetails)[0]].defaultDomain

const cloneDetails = (details: ConferenceDetails): ConferenceDetails => ({ ...details })

/**
 * Mock implementation of the future Conferences API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/conferences/list` needs a domain scope, a
 * `showAll` flag, server-side `search`, and server-side `pageNumber`/`pageSize` paging
 * (conferences.md §12) — the mock emulates that here.
 */
export const fetchConferences = (query: ConferenceListParams = {}): Promise<ConferenceListResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = conferences.map(toListConference)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((conference) =>
            searchableConferenceFields.some((field) => {
              const value = conference[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((conference) => conference.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((conference) => ({ ...conference }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/** GET /api/conferences/details?conference_uuid= (conferences.md §12). */
export const getConferenceById = (conferenceUuid: string): Promise<ConferenceDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = conferences.find((record) => record.conference_uuid === conferenceUuid)

      if (!details) {
        const notFound: ApiError = { status: 404, message: `Conference ${conferenceUuid} not found.` }
        reject(notFound)
        return
      }

      resolve({
        ...cloneDetails(details),
        conference_description: details.conference_description?.trim(),
      })
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=Conference&domain_name=... — Add/Edit/Copy bootstrap (domain
 * options, auto-extension, extension range, account code) — and the place where the mock feeds the
 * global domain store (PepperPBX's multi-tenancy placeholder): availableDomains come from the
 * hive's domainOptions, and currentDomain is seeded from the default domain the first time — never
 * overwriting a choice the user persisted.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current domain
 * on Add, the loaded record's domain on Edit/Copy) — matches the fix already established for every
 * other module's Edit screen, and deliberately does NOT reproduce the audit's confirmed Copy-mode
 * gap where `getHiveUserDetails()` is called with no domain filter at all (conferences.md §15/§28:
 * "may not use the source record's domain") — see CopyConferenceModal.tsx, which always passes the
 * source conference's own domain.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's accessible
 * domains, auto-extension suggestion, extension range/exclusion list, and account code.
 */
export const getHiveConferenceDetails = (domainName?: string): Promise<ConferenceHiveDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const fallbackKey = Object.keys(mockHiveConferenceDetails)[0]
      const hive = mockHiveConferenceDetails[domainName ?? ''] ?? mockHiveConferenceDetails[fallbackKey]

      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = hive.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })
      }

      resolve({ ...hive, domainOptions: [...hive.domainOptions], extensionExclude: [...hive.extensionExclude] })
    }, 300)
  })

/**
 * GET /api/conferences/profileOptions (conferences.md §8/§12) — a flat, non-domain-scoped options
 * list (see conference.mock.ts's own comment on why no domain parameter is threaded through here).
 */
export const getProfileOptions = (): Promise<ConferenceProfileOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve([...mockConferenceProfileOptions]), 250)
  })

/**
 * Maps form values into the stored/API details shape. `conference_order` is already numeric on
 * the form (see conference.types.ts's ConferenceFormValues doc comment), so no submit-time
 * `Number()` coercion is needed here — the audit's own documented coercion (conferences.md §11/§27)
 * is a no-op under this module's chosen field typing, not a required transform.
 */
const toDetails = (values: ConferenceFormValues, conferenceUuid: string, existing?: ConferenceDetails): ConferenceDetails => ({
  ...values,
  conference_uuid: conferenceUuid,
  conference_pin_number: values.conference_pin_number || undefined,
  conference_flags: values.conference_flags || undefined,
  conference_email_address: values.conference_email_address || undefined,
  conference_description: values.conference_description?.trim() || undefined,
  // Account Code is always read-only/server-derived (conferences.md §8/§26) — never take a
  // user-submitted override, always keep whatever the record already has (or the hive-provided
  // value passed in as the form's own read-only display value on create).
  conference_account_code: existing?.conference_account_code ?? values.conference_account_code,
})

/** POST /api/conferences/create */
export const createConference = (values: ConferenceFormValues): Promise<ConferenceDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `conf-${Date.now()}`)
      conferences = [...conferences, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/** PATCH /api/conferences/update */
export const updateConference = (conferenceUuid: string, values: ConferenceFormValues): Promise<ConferenceDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = conferences.findIndex((record) => record.conference_uuid === conferenceUuid)

      if (index === -1) {
        reject(new Error(`Conference ${conferenceUuid} not found.`))
        return
      }

      const updated = toDetails(values, conferenceUuid, conferences[index])
      conferences = [...conferences.slice(0, index), updated, ...conferences.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/conferences/delete — { conference_uuids: string[] }. Used by both single-row and bulk delete. */
export const deleteConferences = (conferenceUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      conferences = conferences.filter((record) => !conferenceUuids.includes(record.conference_uuid))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/conferences/copy — { conference_name, conference_extension, conference_uuids: [uuid] }
 * (conferences.md §3/§9/§12/§20/§27). Copies within the source record's own domain (not
 * user-selectable), with a new name and extension supplied via the Copy modal's inline mini-form.
 */
export const copyConference = (sourceUuid: string, newName: string, newExtension: string): Promise<ConferenceDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = conferences.find((record) => record.conference_uuid === sourceUuid)

      if (!source) {
        reject(new Error(`Conference ${sourceUuid} not found.`))
        return
      }

      const clonedRecord: ConferenceDetails = {
        ...cloneDetails(source),
        conference_uuid: `conf-copy-${Date.now()}`,
        conference_name: newName,
        conference_extension: newExtension,
      }

      conferences = [...conferences, clonedRecord]

      resolve(cloneDetails(clonedRecord))
    }, 300)
  })

/**
 * PATCH /api/conferences/toggle — { conference_uuids: string[] } (conferences.md §3/§11/§12/§21/
 * §26). Flips each targeted record's own current `conference_enabled` state. Used identically for
 * the inline row Status Tag (one-element array, no confirmation — conferences.md §3/§25/§28's
 * documented "single click flips the enabled state, no popup") and the bulk Toggle modal (many,
 * confirmed) — matching Outbound Routes' identical single-endpoint-two-UX-patterns convention.
 *
 * `conference_enabled` is kept as a real boolean throughout this service (never compared as the
 * string `'true'`) — the audit's own §28 flags Axion's `row.original?.conference_enabled ===
 * 'true'` string comparison as a confirmed, likely type-mismatch bug; PepperPBX's own
 * ConferenceFormValues/ConferenceDetails types declare `conference_enabled: boolean` and this mock
 * never produces a string value for it, so that bug class isn't reproducible here.
 */
export const toggleConferences = (conferenceUuids: string[]): Promise<ConferenceDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: ConferenceDetails[] = []
      conferences = conferences.map((record) => {
        if (!conferenceUuids.includes(record.conference_uuid)) return record
        const next = { ...record, conference_enabled: !record.conference_enabled }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 200)
  })
