import { defaultPageSize, recentCallsPageSize, searchableCallBlockFields } from './call-block.constants'
import {
  mockActionOptionsByDomain,
  mockCallBlocks as seedCallBlocks,
  mockExtensionOptionsByDomain,
  mockHiveCallBlockDetails,
  mockRecentCallsByDomain,
} from './call-block.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  BlockRecentCallsPayload,
  CallBlock,
  CallBlockDetails,
  CallBlockFormValues,
  CallBlockListQuery,
  CallBlockListResponse,
  HiveCallBlockDetails,
  RecentCallListQuery,
  RecentCallListResponse,
  SelectOption,
} from './call-block.types'

/**
 * The service's own working copy of the mock dataset. Kept private to this module so
 * call-block.service.ts is the single mutation point for the mock "backend" — pages, components,
 * and the hook never import call-block.mock.ts directly (CLAUDE.md's "a module's mock data lives
 * behind its service layer" rule). Resets on a real page reload since it's just a re-evaluated
 * module; no fake persistence across refresh.
 */
let callBlocks: CallBlockDetails[] = seedCallBlocks.map((record) => ({ ...record }))

/** Projects the rich stored record back into the lean list/table entity. */
const toListCallBlock = (details: CallBlockDetails): CallBlock => {
  const extensionOption = mockExtensionOptionsByDomain[details.domain_name]?.find((option) => option.value === details.extension_uuid)
  return {
    call_block_uuid: details.call_block_uuid,
    domain_name: details.domain_name,
    call_block_direction: details.call_block_direction,
    extension: extensionOption?.label,
    call_block_name: details.call_block_name,
    call_block_country_code: details.call_block_country_code,
    call_block_number: details.call_block_number,
    call_block_count: details.call_block_count,
    call_block_action: details.call_block_action,
    call_block_enabled: details.call_block_enabled,
    date_added: details.date_added,
    call_block_description: details.call_block_description,
  }
}

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveCallBlockDetails() has populated the store.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockHiveCallBlockDetails.defaultDomain

const cloneDetails = (details: CallBlockDetails): CallBlockDetails => ({ ...details })

/**
 * Mock implementation of the future call-block API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/callBlocks/list` needs a domain scope, a
 * `showAll` flag, server-side `search`, and server-side `pageNumber`/`pageSize` paging — the mock
 * emulates that here.
 */
export const fetchCallBlocks = (query: CallBlockListQuery = {}): Promise<CallBlockListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = callBlocks.map(toListCallBlock)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((callBlock) =>
            searchableCallBlockFields.some((field) => {
              const value = callBlock[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((callBlock) => callBlock.domain_name === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((callBlock) => ({ ...callBlock }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/** GET /api/callBlocks/details?call_block_uuid= (call-block.md §12). */
export const getCallBlockDetails = (callBlockUuid: string): Promise<CallBlockDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = callBlocks.find((record) => record.call_block_uuid === callBlockUuid)

      if (!details) {
        const notFound: ApiError = { status: 404, message: `Call block ${callBlockUuid} not found.` }
        reject(notFound)
        return
      }

      resolve({
        ...cloneDetails(details),
        call_block_description: details.call_block_description?.trim(),
      })
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=CallBlock&domain_name=... — Add/Edit bootstrap (domain
 * options), and the place where the mock feeds the global domain store (PepperPBX's
 * multi-tenancy placeholder): availableDomains come from the hive's domainOptions, and
 * currentDomain is seeded from the default domain the first time — never overwriting a choice
 * the user persisted.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current
 * domain on Add, the loaded record's domain on Edit) — matches the fix already established for
 * Gateways'/Outbound Routes'/Announcements' Edit screens.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's
 * accessible domains so the list's Show All scope can be derived from them.
 */
export const getHiveCallBlockDetails = (domainName?: string): Promise<HiveCallBlockDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      void domainName // the mock returns one shared option list regardless of domain
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = mockHiveCallBlockDetails.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: mockHiveCallBlockDetails.defaultDomain, name: mockHiveCallBlockDetails.defaultDomain })
      }
      resolve({ ...mockHiveCallBlockDetails, domainOptions: [...mockHiveCallBlockDetails.domainOptions] })
    }, 300)
  })

/**
 * GET .../callBlocks/extDropdown?domain_name=... — domain-scoped extension options
 * (call-block.md §8/§9/§12/§33).
 */
export const getCallBlockExtensionOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([...(mockExtensionOptionsByDomain[domainName ?? ''] ?? mockExtensionOptionsByDomain[mockHiveCallBlockDetails.defaultDomain])])
    }, 250)
  })

/**
 * GET .../callBlocks/actionDropdown?domain_name=... — domain-scoped call-block action options
 * (call-block.md §8/§9/§12/§33).
 */
export const getCallBlockActionOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([...(mockActionOptionsByDomain[domainName ?? ''] ?? mockActionOptionsByDomain[mockHiveCallBlockDetails.defaultDomain])])
    }, 250)
  })

/**
 * Maps form values into the stored/API details shape. `call_block_country_code` is kept as a
 * validated string throughout — the audit documents the real Axion payload coercing it to Number
 * on submit (call-block.md §26/§27), but PepperPBX keeps one consistent typed representation on
 * the frontend (matching the project-wide "no leaked string/boolean/number ambiguity" convention
 * already applied to every other module) and would only coerce at the real API boundary if a
 * confirmed backend contract requires it.
 */
const toDetails = (values: CallBlockFormValues, callBlockUuid: string, existing?: CallBlockDetails): CallBlockDetails => ({
  ...values,
  call_block_uuid: callBlockUuid,
  call_block_count: existing?.call_block_count ?? 0,
  date_added: existing?.date_added ?? new Date().toISOString(),
  call_block_name: values.call_block_name?.trim() || undefined,
  call_block_number: values.call_block_number || undefined,
  call_block_country_code: values.call_block_country_code || undefined,
  call_block_description: values.call_block_description?.trim() || undefined,
})

/** POST /api/callBlocks/create */
export const createCallBlock = (values: CallBlockFormValues): Promise<CallBlockDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `cb-${Date.now()}`)
      callBlocks = [...callBlocks, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/** PATCH /api/callBlocks/update */
export const updateCallBlock = (callBlockUuid: string, values: CallBlockFormValues): Promise<CallBlockDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = callBlocks.findIndex((record) => record.call_block_uuid === callBlockUuid)

      if (index === -1) {
        reject(new Error(`Call block ${callBlockUuid} not found.`))
        return
      }

      const updated = toDetails(values, callBlockUuid, callBlocks[index])

      callBlocks = [...callBlocks.slice(0, index), updated, ...callBlocks.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/callBlocks/delete — { call_block_uuid: string[] }. Used by both single-row and bulk delete. */
export const deleteCallBlocks = (callBlockUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      callBlocks = callBlocks.filter((record) => !callBlockUuids.includes(record.call_block_uuid))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/callBlocks/toggle — { call_block_uuid: string[] }, no explicit status field per the
 * audit (call-block.md §11/§12/§21) — flips each targeted record's own current
 * `call_block_enabled` state. Used identically for the inline row Status pill (one-element array,
 * no confirmation — call-block.md §3/§25) and the bulk Toggle popup (many, confirmed).
 *
 * INTENTIONAL FIX vs the Axion reference: the audit documents `call_block_enabled` compared as
 * the literal string `'true'` on the frontend (call-block.md §27/§28/§33/§400/§452), suggesting
 * the backend may return it as a string. PepperPBX keeps `call_block_enabled` a real boolean
 * throughout the frontend — matching the same fix already applied to every other module's
 * analogous Axion string/boolean ambiguity. If a real backend does return a string, that
 * normalization belongs at this service boundary, not leaked into the UI.
 */
export const toggleCallBlocks = (callBlockUuids: string[]): Promise<CallBlockDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: CallBlockDetails[] = []
      callBlocks = callBlocks.map((record) => {
        if (!callBlockUuids.includes(record.call_block_uuid)) return record
        const next = { ...record, call_block_enabled: !record.call_block_enabled }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 200)
  })

/**
 * PATCH /api/callBlocks/copy — { call_block_uuid: [uuid] }. Confirmation-only clone, no
 * user-provided override fields — matches the audit's documented Copy flow exactly (call-block.md
 * §3/§8/§20/§26: "Do you really want to copy this call block?", no inline form for new
 * name/extension, unlike Fax Servers).
 */
export const copyCallBlock = (callBlockUuid: string): Promise<CallBlockDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = callBlocks.find((record) => record.call_block_uuid === callBlockUuid)

      if (!source) {
        reject(new Error(`Call block ${callBlockUuid} not found.`))
        return
      }

      const clonedRecord: CallBlockDetails = {
        ...cloneDetails(source),
        call_block_uuid: `cb-copy-${Date.now()}`,
        call_block_count: 0,
        date_added: new Date().toISOString(),
      }

      callBlocks = [...callBlocks, clonedRecord]

      resolve(cloneDetails(clonedRecord))
    }, 300)
  })

/**
 * GET .../callBlocks/listRecentCalls?domainName=&call_block_name=&call_block_number= — the
 * Edit-only Recent Calls sub-table (call-block.md §3/§5/§12/§21/§33). Filters this domain's mock
 * call-log entries by a loose match against the block's own name/number — a real backend would
 * source this from the actual call log (CDR), which PepperPBX has no module for yet.
 *
 * BACKEND CONTRACT REQUIRED. The real matching semantics (exact vs fuzzy, name-or-number vs
 * name-and-number) aren't confirmed by the audit.
 */
export const fetchRecentCalls = (query: RecentCallListQuery): Promise<RecentCallListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = recentCallsPageSize, domainName, name, number } = query

      const domainCalls = mockRecentCallsByDomain[domainName] ?? []

      const filtered =
        !name && !number
          ? domainCalls
          : domainCalls.filter(
              (call) =>
                (!!name && call.callerIdName === name) || (!!number && call.callerIdNumber === number)
            )

      const total_records = filtered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map((call) => ({ ...call }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/**
 * PATCH /api/callBlocks/blockRecentCalls — { direction, extension_uuid, action, uuids }
 * (call-block.md §3/§12). Per the audit, success just resets the bulk-action selections and
 * re-fetches the Recent Calls list (call-block.md §19) — it does not remove/mutate the call-log
 * entries themselves, so this mock resolves without touching `mockRecentCallsByDomain`.
 */
export const blockRecentCalls = (payload: BlockRecentCallsPayload): Promise<void> =>
  new Promise((resolve) => {
    void payload // the mock doesn't need to inspect the payload — see the comment above
    setTimeout(() => resolve(), 300)
  })
