import { defaultPageSize, searchableCallCenterFields } from './call-center.constants'
import {
  mockAgentOptionsByDomain,
  mockAnnounceOptionsByDomain,
  mockCallCenters as seedCallCenters,
  mockGreetingOptionsByDomain,
  mockHiveCallCenterDetails,
  mockMusicOnHoldOptionsByDomain,
  mockTimeoutActionOptionsByDomain,
} from './call-center.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  CallCenter,
  CallCenterDetails,
  CallCenterFlagCommand,
  CallCenterFormValues,
  CallCenterListQuery,
  CallCenterListResponse,
  HiveCallCenterDetails,
  RemoveCallCenterTierPayload,
  SelectOption,
} from './call-center.types'

/**
 * The service's own working copy of the mock dataset. Kept private to this module so
 * call-center.service.ts is the single mutation point for the mock "backend" — pages, components,
 * and the hook never import call-center.mock.ts directly (CLAUDE.md's "a module's mock data lives
 * behind its service layer" rule). Resets on a real page reload since it's just a re-evaluated
 * module; no fake persistence across refresh.
 */
let callCenters: CallCenterDetails[] = seedCallCenters.map((record) => ({ ...record }))

/** Projects the rich stored record back into the lean list/table entity. */
const toListCallCenter = (details: CallCenterDetails): CallCenter => ({
  id: details.call_center_queue_uuid,
  domain: details.domain_name,
  name: details.queue_name,
  extension: details.queue_extension,
  strategy: details.queue_strategy,
  description: details.queue_description,
  tierRulesApply: details.queue_tier_rules_apply,
})

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveCallCenterDetails() has populated the store.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockHiveCallCenterDetails[Object.keys(mockHiveCallCenterDetails)[0]].defaultDomain

const cloneDetails = (details: CallCenterDetails): CallCenterDetails => ({ ...details, callcenter_tier: details.callcenter_tier.map((tier) => ({ ...tier })) })

/**
 * Mock implementation of the future call-center API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/callCenters/list` needs a domain scope, a
 * `showAll` flag, server-side `search`, and server-side `pageNumber`/`pageSize` paging (call-center.md
 * §12) — the mock emulates that here.
 */
export const fetchCallCenters = (query: CallCenterListQuery = {}): Promise<CallCenterListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = callCenters.map(toListCallCenter)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((callCenter) =>
            searchableCallCenterFields.some((field) => {
              const value = callCenter[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((callCenter) => callCenter.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((callCenter) => ({ ...callCenter }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/**
 * GET /api/callCenters/details?call_center_queue_uuid= (call-center.md §12). An unknown id rejects
 * with the same `ApiError` shape (status 404) the real apiClient produces, so EditCallCenterPage's
 * not-found handling keeps working unchanged once this becomes a real request.
 */
export const getCallCenterDetails = (queueUuid: string): Promise<CallCenterDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = callCenters.find((record) => record.call_center_queue_uuid === queueUuid)

      if (!details) {
        const notFound: ApiError = { status: 404, message: `Call center queue ${queueUuid} not found.` }
        reject(notFound)
        return
      }

      resolve({
        ...cloneDetails(details),
        queue_description: details.queue_description?.trim(),
      })
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=CallCenter&domain_name=... — Add/Edit/Copy bootstrap (domain
 * options, auto-extension, extension range) — and the place where the mock feeds the global
 * domain store (PepperPBX's multi-tenancy placeholder): availableDomains come from the hive's
 * domainOptions, and currentDomain is seeded from the default domain the first time — never
 * overwriting a choice the user persisted.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current domain
 * on Add, the loaded record's domain on Edit) — matches the fix already established for
 * Gateways'/Outbound Routes'/Announcements'/Call Block's Edit screens.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's accessible
 * domains, auto-extension suggestion, and extension range/exclusion list.
 */
export const getHiveCallCenterDetails = (domainName?: string): Promise<HiveCallCenterDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const fallbackKey = Object.keys(mockHiveCallCenterDetails)[0]
      const hive = mockHiveCallCenterDetails[domainName ?? ''] ?? mockHiveCallCenterDetails[fallbackKey]

      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = hive.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })
      }

      resolve({ ...hive, domainOptions: [...hive.domainOptions], extensionExclude: [...hive.extensionExclude] })
    }, 300)
  })

const domainScopedOptions = (byDomain: Record<string, SelectOption[]>, domainName?: string): SelectOption[] => {
  const fallbackKey = Object.keys(byDomain)[0]
  return [...(byDomain[domainName ?? ''] ?? byDomain[fallbackKey] ?? [])]
}

/** GET .../callCenters/listgreetings?domain_name=... (call-center.md §8/§9/§12/§33). */
export const getCallCenterGreetingOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => setTimeout(() => resolve(domainScopedOptions(mockGreetingOptionsByDomain, domainName)), 250))

/** GET .../callCenters/timeoutActions?domain_name=... (call-center.md §8/§9/§12/§33). */
export const getCallCenterTimeoutActionOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => setTimeout(() => resolve(domainScopedOptions(mockTimeoutActionOptionsByDomain, domainName)), 250))

/**
 * GET .../callCenters/getAgent?domain_name=... — options for the Agent tier assignment select
 * (call-center.md §8/§9/§12/§33). The Agent entity's own CRUD lives in the separate
 * `call-center-agents` module.
 */
export const getCallCenterAgentOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => setTimeout(() => resolve(domainScopedOptions(mockAgentOptionsByDomain, domainName)), 250))

/** GET .../callCenters/getAnnouncedDropDown?domain_name=... (call-center.md §8/§9/§12/§33). */
export const getCallCenterAnnounceOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => setTimeout(() => resolve(domainScopedOptions(mockAnnounceOptionsByDomain, domainName)), 250))

/** GET .../callCenters/mohDropdown?domain_name=... (call-center.md §8/§9/§12/§33). */
export const getCallCenterMusicOnHoldOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => setTimeout(() => resolve(domainScopedOptions(mockMusicOnHoldOptionsByDomain, domainName)), 250))

/** Empty → `undefined`; anything else → `Number(value)`, so '0' stays 0. */
const toOptionalNumber = (value?: string): number | undefined => (value === undefined || value.trim() === '' ? undefined : Number(value))

/**
 * Maps form values into the stored/API details shape. Numeric fields stay validated strings on
 * the form and are coerced to `Number` here at the service boundary (call-center.md §27's
 * documented submit-time coercion), matching Gateways'/Extensions' identical convention.
 *
 * On Save, the whole `callcenter_tier` array (including any rows unaffected by
 * `removeCallCenterTier` below) is still submitted atomically with the rest of the queue record —
 * `removeCallCenterTier` only handles the *immediate* removal of an existing, persisted row when
 * its Delete button is clicked, matching call-center.md §11/§27/§33's documented separate
 * `/api/callCenters/agentsTier` call.
 */
const toDetails = (values: CallCenterFormValues, queueUuid: string): CallCenterDetails => ({
  ...values,
  call_center_queue_uuid: queueUuid,
  // Type-level only: the form's required rule guarantees a value by submit time.
  queue_moh_sound: values.queue_moh_sound ?? '',
  queue_description: values.queue_description?.trim() || undefined,
  queue_distinctive_ring: values.queue_distinctive_ring || undefined,
  queue_cid_prefix: values.queue_cid_prefix || undefined,
  queue_cc_exit_keys: values.queue_cc_exit_keys || undefined,
  queue_outbound_caller_id_name: values.queue_outbound_caller_id_name || undefined,
  queue_outbound_caller_id_number: values.queue_outbound_caller_id_number || undefined,
  queue_greeting: values.queue_greeting || undefined,
  queue_timeout_action: values.queue_timeout_action || undefined,
  queue_announce_sound: values.queue_announce_sound || undefined,
  queue_max_wait_time: toOptionalNumber(values.queue_max_wait_time),
  queue_tier_rule_wait_second: toOptionalNumber(values.queue_tier_rule_wait_second),
  queue_discard_abandoned_after: toOptionalNumber(values.queue_discard_abandoned_after),
  queue_time_base_score_sec: toOptionalNumber(values.queue_time_base_score_sec),
  queue_max_wait_time_with_no_agent: toOptionalNumber(values.queue_max_wait_time_with_no_agent),
  queue_max_wait_time_with_no_agent_time_reached: toOptionalNumber(values.queue_max_wait_time_with_no_agent_time_reached),
  queue_announce_frequency: toOptionalNumber(values.queue_announce_frequency),
  callcenter_tier: values.callcenter_tier.filter((tier) => !!tier.call_center_agent_uuid),
})

/** POST /api/callCenters/create */
export const createCallCenter = (values: CallCenterFormValues): Promise<CallCenterDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `cc-${Date.now()}`)
      callCenters = [...callCenters, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/** PATCH /api/callCenters/update */
export const updateCallCenter = (queueUuid: string, values: CallCenterFormValues): Promise<CallCenterDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = callCenters.findIndex((record) => record.call_center_queue_uuid === queueUuid)

      if (index === -1) {
        reject(new Error(`Call center queue ${queueUuid} not found.`))
        return
      }

      const updated = toDetails(values, queueUuid)
      callCenters = [...callCenters.slice(0, index), updated, ...callCenters.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/callCenters/delete — { call_center_queue_uuid: string[] }. Used by both single-row and bulk delete. */
export const deleteCallCenters = (queueUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      callCenters = callCenters.filter((record) => !queueUuids.includes(record.call_center_queue_uuid))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/callCenters/copy — { call_center_queue_copy: [{call_center_queue_uuid, extension,
 * name}] } (call-center.md §3/§9/§12/§20). Copies within the source record's own domain (not
 * user-selectable), with a new name and extension supplied via the Copy popup's inline mini-form.
 */
export const copyCallCenter = (queueUuid: string, newName: string, newExtension: string): Promise<CallCenterDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = callCenters.find((record) => record.call_center_queue_uuid === queueUuid)

      if (!source) {
        reject(new Error(`Call center queue ${queueUuid} not found.`))
        return
      }

      const clonedRecord: CallCenterDetails = {
        ...cloneDetails(source),
        call_center_queue_uuid: `cc-copy-${Date.now()}`,
        queue_name: newName,
        queue_extension: newExtension,
      }

      callCenters = [...callCenters, clonedRecord]

      resolve(cloneDetails(clonedRecord))
    }, 300)
  })

/**
 * Inline "Tier Rules Apply" toggle for the queue list's clickable Tag — flips a single record's
 * own current `queue_tier_rules_apply` value. Matches every sibling module's inline row-toggle
 * pattern (e.g. call-block.service.ts's toggleCallBlocks), scoped to a single record since this
 * is a per-row click, not a bulk action — no bulk toggle for this field is requested or documented.
 *
 * BACKEND CONTRACT REQUIRED. No real endpoint is confirmed for this in call-center.md; this mock
 * updates the record's own `queue_tier_rules_apply` field, the same field the Add/Edit form's
 * "Tier Rules Apply" switch (CallCenterSwitchSection.tsx) already reads/writes, so both stay
 * consistent with each other.
 */
export const toggleCallCenterTierRules = (queueUuid: string): Promise<CallCenterDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = callCenters.findIndex((record) => record.call_center_queue_uuid === queueUuid)

      if (index === -1) {
        reject(new Error(`Call center queue ${queueUuid} not found.`))
        return
      }

      const updated = { ...callCenters[index], queue_tier_rules_apply: !callCenters[index].queue_tier_rules_apply }
      callCenters = [...callCenters.slice(0, index), updated, ...callCenters.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 200)
  })

/**
 * PATCH /api/callCenters/agentsTier — removes only the Tier (queue-agent membership) relationship
 * for an *existing, already-persisted* row; the Call Center Agent entity itself is never touched
 * (call-center.md §8/§11/§12/§27/§33). Distinct from:
 * - `deleteCallCenters` (deletes whole queues), and
 * - any Agent-entity delete (`DELETE /api/callCentersAgents/delete`) — owned by the separate
 *   `call-center-agents` module.
 *
 * Called only for rows that already have a `call_center_tier_uuid` (i.e. loaded from an existing
 * queue's details, never a newly-added unsaved row) — see CallCenterTierSection.tsx's delete
 * handler, which is the only caller.
 *
 * BACKEND CONTRACT REQUIRED. No real endpoint is confirmed; this mock removes the matching tier
 * row(s) from the queue's own `callcenter_tier` array directly, so a subsequent Save/refresh
 * reflects the removal even though the row was already dropped from the form locally.
 */
export const removeCallCenterTier = (payload: RemoveCallCenterTierPayload): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = callCenters.findIndex((record) => record.call_center_queue_uuid === payload.call_center_queue_uuid)

      if (index === -1) {
        reject(new Error(`Call center queue ${payload.call_center_queue_uuid} not found.`))
        return
      }

      const record = callCenters[index]
      const updated = {
        ...record,
        callcenter_tier: record.callcenter_tier.filter((tier) => !payload.call_center_tier_uuid.includes(tier.call_center_tier_uuid ?? '')),
      }
      callCenters = [...callCenters.slice(0, index), updated, ...callCenters.slice(index + 1)]

      resolve()
    }, 200)
  })

/**
 * PATCH /api/callCenters/toggle — { call_center_queue_uuid, flagCommand } (call-center.md
 * §11/§12/§26/§33). `flagCommand` is 'load' (Start), 'unload' (Stop), or 'reload' (Restart) —
 * preserved verbatim per the audit's explicit instruction. The mock has no real queue-lifecycle
 * state to flip (no confirmed backend contract for one — call-center.md's Table Audit documents
 * no queue "current running state" field), so this resolves as a no-op acknowledgement, matching
 * the audit's own documented success behavior (toast + in-place Edit refresh, not a state change
 * visible anywhere else in the UI).
 */
export const startStopRestartCallCenter = (queueUuid: string, flagCommand: CallCenterFlagCommand): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = callCenters.some((record) => record.call_center_queue_uuid === queueUuid)
      if (!exists) {
        reject(new Error(`Call center queue ${queueUuid} not found.`))
        return
      }
      void flagCommand
      resolve()
    }, 300)
  })
