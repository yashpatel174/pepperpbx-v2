import { defaultPageSize, searchableExtensionFields } from './extension.constants'
import { mockExtensions as seedExtensions, mockHiveUserDetails, mockHoldMusicOptions } from './extension.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  Extension,
  ExtensionDetails,
  ExtensionFormValues,
  ExtensionListQuery,
  ExtensionListResponse,
  HiveUserDetails,
} from './extension.types'

/**
 * The service's own working copy of the mock dataset, stored in the rich create/update
 * shape (ExtensionDetails) so create/update persist every form field. Kept private to this
 * module so extension.service.ts is the single mutation point for the mock "backend" —
 * pages and components never import extension.mock.ts directly. Resets on a real page reload
 * since it's just a re-evaluated module; no fake persistence across refresh.
 */
let extensions: ExtensionDetails[] = seedExtensions.map((extension) => ({ ...extension }))

/** Projects the rich stored record back into the lean list/table entity. */
const toListExtension = (details: ExtensionDetails): Extension => ({
  id: details.extension_uuid,
  extension: details.extension,
  effectiveCallerIdName: details.effective_caller_id_name,
  outboundCallerIdName: details.outbound_caller_id_name,
  callGroup: details.call_group,
  domain: details.domain_name,
  description: details.description,
  status: details.enabled ? 'enabled' : 'disabled',
  voicemailEnabled: details.voicemail_enabled,
  voicemailEmail: details.voicemail_mail_to,
  directoryListing: details.directory_visible,
  callRecording: false,
  default: details.default === 'true',
})

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads
 * the global current-domain store (pepperpbx's multi-tenancy placeholder) and falls back to
 * the mock's default domain until getHiveUserDetails() has populated the store — i.e. the
 * three line list/detail calls behave exactly like a later real API that is domain-scoped.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockHiveUserDetails.defaultDomain

/**
 * Mock implementation of the future extensions API boundary — swap for a real call through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real endpoint needs all four of: a `domain_name` scope
 * (the current tenant domain), a `show_all` flag that widens the scope to every domain the
 * caller may access, server-side `search`, and server-side `page`/`page_size` paging. The
 * mock emulates that here: search narrows first, then the domain scope is applied (all
 * domains when show_all, else only the current domain), and paging always slices the
 * resulting set — showAll is a domain-scope flag, never a "one giant page" mode.
 */
export const fetchExtensions = (query: ExtensionListQuery = {}): Promise<ExtensionListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = extensions.map(toListExtension)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((extension) =>
            searchableExtensionFields.some((field) => {
              const value = extension[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll
        ? searchFiltered
        : searchFiltered.filter((extension) => extension.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((extension) => ({
        ...extension,
      }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/**
 * Looks up by the user-facing extension number (e.g. "101"). Kept for list-side lookups;
 * the Edit page resolves records by extension_uuid via getExtensionDetails instead.
 */
export const getExtensionById = (extension: string): Promise<ExtensionDetails | undefined> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(extensions.find((record) => record.extension === extension)), 300)
  })

export const isExtensionNumberTaken = (extension: string, excludeUuid?: string): Promise<boolean> =>
  Promise.resolve(
    extensions.some((record) => record.extension === extension && record.extension_uuid !== excludeUuid)
  )

const cloneDetails = (details: ExtensionDetails): ExtensionDetails => ({ ...details })

/**
 * GET /api/hiveuser/details — Add-mode defaults (auto extension, account, domain, range bounds).
 * Also the place where the mock feeds the global domain store (pepperpbx's multi-tenancy):
 * availableDomains come from the hive's domainOptions, and the currentDomain is seeded from
 * the default domain the first time — never overwriting a choice the user persisted.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's
 * accessible domains so the list's Show All scope can be derived from them. `domainName`
 * mirrors Axion's `getHiveUserDetails({domain_name})` (used by Copy to fetch the source
 * domain's autoExt/range rules); the mock returns one shared set of rules for every domain.
 */
export const getHiveUserDetails = (domainName?: string): Promise<HiveUserDetails> => {
  // The mock ignores the domain; a real implementation threads it into the query param.
  void domainName
  return new Promise((resolve) => {
    setTimeout(() => {
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = mockHiveUserDetails.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: mockHiveUserDetails.defaultDomain, name: mockHiveUserDetails.defaultDomain })
      }
      resolve({ ...mockHiveUserDetails, domainOptions: [...mockHiveUserDetails.domainOptions] })
    }, 300)
  })
}

/**
 * GET /api/destinations/list/holdMusic?domain_name=... — options are never hardcoded in the
 * form, and the domain is threaded through the service boundary so a real backend can serve
 * different hold music per tenant.
 *
 * BACKEND CONTRACT REQUIRED. The real endpoint must accept a `domain_name` query param and
 * return the list of hold music labels for that domain; the mock returns one shared list for
 * every domain.
 */
export const getHoldMusicOptions = (domainName?: string): Promise<string[]> => {
  // The mock ignores the domain; a real implementation threads it into the query param.
  void domainName
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockHoldMusicOptions]), 300)
  })
}

/** GET /api/extensions/details?extension_uuid=... */
export const getExtensionDetails = (extensionUuid: string): Promise<ExtensionDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = extensions.find((record) => record.extension_uuid === extensionUuid)
      if (!details) {
        const notFound: ApiError = { status: 404, message: `Extension ${extensionUuid} not found.` }
        reject(notFound)
        return
      }
      resolve(cloneDetails(details))
    }, 300)
  })

/**
 * Maps form values into the stored/API details shape. The numeric form strings are converted
 * to numbers only here — the form itself keeps them as validated strings. Empty optional
 * strings are normalized to undefined (optional API fields are omitted, not sent blank).
 */
const toDetails = (values: ExtensionFormValues, extension: string, extensionUuid: string): ExtensionDetails => ({
  extension_uuid: extensionUuid,
  extension,
  domain_name: values.user_context,
  user_context: values.user_context,
  accountcode: values.accountcode,
  password: values.password || undefined,
  effective_caller_id_name: values.effective_caller_id_name || undefined,
  effective_caller_id_number: values.effective_caller_id_number || undefined,
  outbound_caller_id_name: values.outbound_caller_id_name || undefined,
  outbound_caller_id_number: values.outbound_caller_id_number || undefined,
  emergency_caller_id_name: values.emergency_caller_id_name || undefined,
  emergency_caller_id_number: values.emergency_caller_id_number || undefined,
  directory_first_name: values.directory_first_name || undefined,
  directory_last_name: values.directory_last_name || undefined,
  max_registrations: values.max_registrations || undefined,
  limit_max: Number(values.limit_max),
  limit_destination: values.limit_destination,
  missed_call_app: values.missed_call_app,
  missed_call_data: values.missed_call_app === 'email' ? values.missed_call_data || undefined : undefined,
  toll_allow: values.toll_allow || undefined,
  call_timeout: Number(values.call_timeout),
  call_group: values.call_group || undefined,
  user_record: values.user_record,
  hold_music: values.hold_music || undefined,
  auth_acl: values.auth_acl || undefined,
  cidr: values.cidr || undefined,
  sip_force_contact: values.sip_force_contact,
  sip_force_expires: values.sip_force_expires ? Number(values.sip_force_expires) : undefined,
  mwi_account: values.mwi_account || undefined,
  sip_bypass_media: values.sip_bypass_media,
  absolute_codec_string: values.absolute_codec_string || undefined,
  dial_string: values.dial_string || undefined,
  description: values.description || undefined,
  call_screen_enabled: values.call_screen_enabled,
  force_ping: values.force_ping,
  directory_visible: values.directory_visible,
  directory_exten_visible: values.directory_exten_visible,
  voicemail_transcription_enabled: values.voicemail_transcription_enabled,
  voicemail_local_after_email: values.voicemail_local_after_email,
  voicemail_enabled: values.voicemail_enabled,
  enabled: values.enabled,
  voicemail_mail_to: values.voicemail_enabled ? values.voicemail_mail_to || undefined : undefined,
  voicemail_file: values.voicemail_file,
  voicemail_password: values.voicemail_enabled ? values.voicemail_password || undefined : undefined,
})

/** POST /api/extensions/create — creates `range` consecutive records starting at the base number. */
export const createExtension = (values: ExtensionFormValues): Promise<ExtensionDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const countsAsRange = /^\d+$/.test(values.extension)
      const createdDetails: ExtensionDetails[] = []
      for (let index = 0; index < (countsAsRange ? values.range : 1); index += 1) {
        const extension = countsAsRange ? String(Number(values.extension) + index) : values.extension
        const details = toDetails(values, extension, `ext-${extension}-${Date.now()}-${index}`)
        createdDetails.push(details)
      }
      extensions = [...extensions, ...createdDetails]
      resolve(cloneDetails(createdDetails[0]))
    }, 300)
  })

/** PATCH /api/extensions/update — `old_extension` is added only when the extension number changed. */
export const updateExtension = (
  extensionUuid: string,
  values: ExtensionFormValues,
  oldExtension?: string
): Promise<ExtensionDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = extensions.findIndex((record) => record.extension_uuid === extensionUuid)
      if (index === -1) {
        reject(new Error(`Extension ${extensionUuid} not found.`))
        return
      }
      const existing = extensions[index]
      const updated: ExtensionDetails = {
        ...toDetails(values, values.extension, extensionUuid),
        // Blank password in Edit means "keep the current one" (see Edit page placeholder).
        password: values.password || existing.password || undefined,
        ...(oldExtension !== undefined && oldExtension !== values.extension
          ? { old_extension: oldExtension }
          : {}),
      }
      extensions = [...extensions.slice(0, index), updated, ...extensions.slice(index + 1)]
      resolve(cloneDetails(updated))
    }, 300)
  })

/**
 * PATCH /api/extensions/copy — `{ new_extension, extension_uuid }`. Matches the Axion reference
 * Copy contract (extension.md §3/§11): the client sends only the source uuid and the new number,
 * and the backend creates the copy within the source record's own domain. The mock behaves like
 * that backend: the stored record is cloned in full under a new uuid and number, without the
 * protected `default` flag or `old_extension` update metadata.
 *
 * BACKEND CONTRACT REQUIRED. Axion sends only the source UUID and new extension number — the
 * backend determines how sensitive fields (SIP password, voicemail password) are copied/reset.
 * The mock copies them as stored rather than inventing a reset rule.
 */
export const copyExtension = (extensionUuid: string, newExtension: string): Promise<ExtensionDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = extensions.find((record) => record.extension_uuid === extensionUuid)
      if (!source) {
        reject(new Error(`Extension ${extensionUuid} not found.`))
        return
      }
      if (source.default === 'true') {
        reject(new Error(`Extension ${source.extension} is a default extension and cannot be copied.`))
        return
      }
      if (extensions.some((record) => record.extension === newExtension)) {
        reject(new Error(`Extension ${newExtension} already exists.`))
        return
      }
      const copied: ExtensionDetails = {
        ...source,
        extension_uuid: `ext-${newExtension}-${Date.now()}`,
        extension: newExtension,
      }
      delete copied.default
      delete copied.old_extension
      extensions = [...extensions, copied]
      resolve(cloneDetails(copied))
    }, 300)
  })

/**
 * PATCH /api/extensions/update — flips the `enabled` flag for the list Enable/Disable toggle.
 *
 * BACKEND CONTRACT REQUIRED. The real update endpoint must accept `enabled` alongside the
 * other changed fields; the mock applies the flag directly to the stored record so the list
 * refetches the new status.
 */
export const setExtensionEnabled = (extensionUuid: string, enabled: boolean): Promise<ExtensionDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = extensions.findIndex((record) => record.extension_uuid === extensionUuid)
      if (index === -1) {
        reject(new Error(`Extension ${extensionUuid} not found.`))
        return
      }
      const updated = { ...extensions[index], enabled }
      extensions = [...extensions.slice(0, index), updated, ...extensions.slice(index + 1)]
      resolve(cloneDetails(updated))
    }, 200)
  })

/**
 * PATCH /api/extensions/toggle — flips each targeted record's OWN current `enabled` state.
 * Matches the Axion reference contract: `{ extension_uuid: string[] }`, no status field — the
 * backend decides the new value per record, it is never told what to set. This is deliberately
 * separate from setExtensionEnabled (an explicit target used by the single-row click, which
 * stays unchanged) — bulk Toggle is a real "flip," not a "set all to X."
 *
 * BACKEND CONTRACT REQUIRED — endpoint, method, and payload shape are assumed from the Axion
 * reference only; not verified against a real PepperPBX backend. Protected/default records are
 * defensively skipped here even if their uuid is passed, mirroring what a real backend should do.
 */
export const toggleExtensions = (extensionUuids: string[]): Promise<ExtensionDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: ExtensionDetails[] = []
      extensions = extensions.map((record) => {
        if (!extensionUuids.includes(record.extension_uuid) || record.default === 'true') return record
        const next = { ...record, enabled: !record.enabled }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 300)
  })

/**
 * DELETE /api/extensions/delete — removes one or more records. Matches the Axion reference
 * contract: `{ extension_uuids: string[], delete_voice_mail: boolean }`. Used by both the
 * single-row and bulk delete flows (both go through DeleteExtensionsModal; single is just a
 * one-element array) — this replaces the previous local-only `removeExtension` that never
 * reached this service (see CLAUDE.md's note on that inconsistency).
 *
 * BACKEND CONTRACT REQUIRED — endpoint, method, and payload shape are assumed from the Axion
 * reference only. `deleteVoicemail` has nowhere else to act on in this mock (there is no
 * separate voicemail store to selectively keep) but is accepted and threaded through so the
 * call shape already matches what a real endpoint will expect. Protected/default records are
 * defensively kept even if their uuid is passed.
 */
export const deleteExtensions = (extensionUuids: string[], deleteVoicemail: boolean): Promise<void> => {
  void deleteVoicemail
  return new Promise((resolve) => {
    setTimeout(() => {
      extensions = extensions.filter(
        (record) => !(extensionUuids.includes(record.extension_uuid) && record.default !== 'true')
      )
      resolve()
    }, 300)
  })
}