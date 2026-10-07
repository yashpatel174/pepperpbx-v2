import { defaultPageSize, searchableAnnouncementFields } from './announcement.constants'
import {
  mockAnnouncements as seedAnnouncements,
  mockExecuteActionOptionsByDomain,
  mockHiveAnnouncementDetails,
  mockPlayActionOptionsByDomain,
} from './announcement.mock'
import useDomainStore from '../../store/domain'
import { request } from '../../services/api/apiClient'
import type { ApiError } from '../../services/api/apiError'
import { isMockMode } from '../../services/auth/auth.mock'
import type {
  ActionOptionGroup,
  ActionOptionsResponse,
  Announcement,
  AnnouncementDetails,
  AnnouncementFormValues,
  AnnouncementListQuery,
  AnnouncementListResponse,
  HiveAnnouncementDetails,
} from './announcement.types'

/**
 * The service's own working copy of the mock dataset, stored in the rich create/update shape
 * (AnnouncementDetails) so create/update persist every form field. Kept private to this module so
 * announcement.service.ts is the single mutation point for the mock "backend" — pages, components,
 * and the hook never import announcement.mock.ts directly (CLAUDE.md's "a module's mock data lives
 * behind its service layer" rule). Resets on a real page reload since it's just a re-evaluated
 * module; no fake persistence across refresh.
 */
let announcements: AnnouncementDetails[] = seedAnnouncements.map((record) => ({ ...record, phrase_details: [...record.phrase_details] }))

/** Projects the rich stored record back into the lean list/table entity. */
const toListAnnouncement = (details: AnnouncementDetails): Announcement => ({
  id: details.phrase_uuid,
  domain: details.domain_name,
  name: details.phrase_name,
  languageCode: details.phrase_language,
  enabled: details.phrase_enabled,
  description: details.phrase_description,
})

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveAnnouncementDetails() has populated the store.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockHiveAnnouncementDetails.defaultDomain

const cloneDetails = (details: AnnouncementDetails): AnnouncementDetails => ({ ...details, phrase_details: [...details.phrase_details] })

/**
 * Mock implementation of the future announcements ("phrases") API boundary — swap for real calls
 * through services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/phrases/list` needs a domain scope, a `showAll`
 * flag, server-side `search`, and server-side `pageNumber`/`pageSize` paging — the mock emulates
 * that here. Unlike the Axion reference's documented trailing `&` in the query string
 * (announcements.md §28), this mock's future real-request builder should not reproduce it.
 */
export const fetchAnnouncements = (query: AnnouncementListQuery = {}): Promise<AnnouncementListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = announcements.map(toListAnnouncement)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((announcement) =>
            searchableAnnouncementFields.some((field) => {
              const value = announcement[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((announcement) => announcement.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((announcement) => ({ ...announcement }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/** GET /api/phrases/details/${phrase_uuid} (announcements.md §12). */
export const getAnnouncementDetails = (phraseUuid: string): Promise<AnnouncementDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = announcements.find((record) => record.phrase_uuid === phraseUuid)

      if (!details) {
        const notFound: ApiError = { status: 404, message: `Announcement ${phraseUuid} not found.` }
        reject(notFound)
        return
      }

      resolve({
        ...cloneDetails(details),
        phrase_description: details.phrase_description?.trim(),
      })
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=Phrases&domain_name=... — Add/Edit bootstrap (domain options),
 * and the place where the mock feeds the global domain store (PepperPBX's multi-tenancy
 * placeholder): availableDomains come from the hive's domainOptions, and currentDomain is seeded
 * from the default domain the first time — never overwriting a choice the user persisted.
 *
 * The bootstrap module param `Phrases` (not `Announcements`) is confirmed real, not an Axion bug
 * (announcements.md §3/§26) — unlike Outbound Routes' equivalent, this is reproduced as-is.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current domain
 * on Add, the loaded record's domain on Edit) — matches the fix already established for
 * Gateways/Outbound Routes' Edit screens.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's
 * accessible domains so the list's Show All scope can be derived from them.
 */
export const getHiveAnnouncementDetails = (domainName?: string): Promise<HiveAnnouncementDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      void domainName // the mock returns one shared option list regardless of domain
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = mockHiveAnnouncementDetails.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: mockHiveAnnouncementDetails.defaultDomain, name: mockHiveAnnouncementDetails.defaultDomain })
      }
      resolve({ ...mockHiveAnnouncementDetails, domainOptions: [...mockHiveAnnouncementDetails.domainOptions] })
    }, 300)
  })

/**
 * GET /api/phrases/playActionOptions?domain_name=... — domain-scoped, grouped music-on-hold file
 * options for Structure rows whose Function is Play (announcements.md §8/§9/§12). Mock mode keeps
 * returning the module's mock groups; real mode calls through apiClient (same isMockMode() gate as
 * Destinations' option lookups) and returns the response body's `data` groups as-is.
 *
 * BACKEND CONTRACT REQUIRED — endpoint and `{ data: [...] }` body are from the Axion audit only.
 */
export const getPlayActionOptions = (domainName?: string): Promise<ActionOptionGroup[]> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...(mockPlayActionOptionsByDomain[domainName ?? ''] ?? mockPlayActionOptionsByDomain[mockHiveAnnouncementDetails.defaultDomain])])
      }, 250)
    })
  }

  return request
    .get<ActionOptionsResponse>('/phrases/playActionOptions', { params: { domain_name: domainName } })
    .then((response) => response.data)
}

/**
 * GET /api/phrases/executeActionOptions?domain_name=... — domain-scoped, grouped dialplan-action
 * options for Structure rows whose Function is Execute (announcements.md §8/§9/§12). Same mock /
 * apiClient split as getPlayActionOptions.
 *
 * BACKEND CONTRACT REQUIRED — endpoint and `{ data: [...] }` body are from the Axion audit only;
 * the option labels/values themselves come from the backend and are never hardcoded here.
 */
export const getExecuteActionOptions = (domainName?: string): Promise<ActionOptionGroup[]> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...(mockExecuteActionOptionsByDomain[domainName ?? ''] ?? mockExecuteActionOptionsByDomain[mockHiveAnnouncementDetails.defaultDomain])])
      }, 250)
    })
  }

  return request
    .get<ActionOptionsResponse>('/phrases/executeActionOptions', { params: { domain_name: domainName } })
    .then((response) => response.data)
}

/**
 * Maps form values into the stored/API details shape. `phrase_description` is trimmed; every
 * other field (including `phrase_details`) passes through as-is — Structure rows are already
 * fully validated (all three fields required per row) before Save is reachable, so no blank-row
 * filtering is needed here, unlike Outbound Routes' Gateways array.
 */
const toDetails = (values: AnnouncementFormValues, phraseUuid: string): AnnouncementDetails => ({
  ...values,
  phrase_uuid: phraseUuid,
  phrase_description: values.phrase_description?.trim() || undefined,
  phrase_details: values.phrase_details.map((item) => ({ ...item })),
})

/** POST /api/phrases/create */
export const createAnnouncement = (values: AnnouncementFormValues): Promise<AnnouncementDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `ann-${values.phrase_name}-${Date.now()}`)
      announcements = [...announcements, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/** PATCH /api/phrases/update/${phrase_uuid} */
export const updateAnnouncement = (phraseUuid: string, values: AnnouncementFormValues): Promise<AnnouncementDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = announcements.findIndex((record) => record.phrase_uuid === phraseUuid)

      if (index === -1) {
        reject(new Error(`Announcement ${phraseUuid} not found.`))
        return
      }

      const updated = toDetails(values, phraseUuid)

      announcements = [...announcements.slice(0, index), updated, ...announcements.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/phrases/delete — { phrase_uuids: string[] }. Used by both single-row and bulk delete. */
export const deleteAnnouncements = (phraseUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      announcements = announcements.filter((record) => !phraseUuids.includes(record.phrase_uuid))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/phrases/toggle — { phrase_uuids: string[] }, no explicit status field per the audit
 * (announcements.md §12/§21) — flips each targeted record's own current `phrase_enabled` state.
 * Used identically for the inline row Status pill (one-element array, no confirmation —
 * announcements.md §3/§26) and the bulk Toggle popup (many, confirmed).
 */
export const toggleAnnouncements = (phraseUuids: string[]): Promise<AnnouncementDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: AnnouncementDetails[] = []
      announcements = announcements.map((record) => {
        if (!phraseUuids.includes(record.phrase_uuid)) return record
        const next = { ...record, phrase_enabled: !record.phrase_enabled }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 200)
  })
