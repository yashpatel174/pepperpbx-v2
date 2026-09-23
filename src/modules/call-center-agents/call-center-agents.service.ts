import { defaultPageSize, searchableAgentFields } from './call-center-agents.constants'
import { mockCallCenterAgents as seedAgents, mockContactOptionsByDomain, mockHiveCallCenterAgentDetails } from './call-center-agents.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  AgentStatusEntry,
  AgentStatusUpdate,
  CallCenterAgent,
  CallCenterAgentDetails,
  CallCenterAgentFormValues,
  CallCenterAgentListQuery,
  CallCenterAgentListResponse,
  HiveCallCenterAgentDetails,
  SelectOption,
} from './call-center-agents.types'

/**
 * The service's own working copy of the mock dataset. Kept private to this module so
 * call-center-agents.service.ts is the single mutation point for the mock "backend" — pages,
 * components, and the hook never import call-center-agents.mock.ts directly (CLAUDE.md's "a
 * module's mock data lives behind its service layer" rule). Resets on a real page reload since
 * it's just a re-evaluated module; no fake persistence across refresh.
 */
let agents: CallCenterAgentDetails[] = seedAgents.map((record) => ({ ...record }))

/** Projects the rich stored record back into the lean list/table entity. */
const toListAgent = (details: CallCenterAgentDetails): CallCenterAgent => ({
  id: details.call_center_agent_uuid,
  domain: details.domain_name,
  name: details.agent_name,
  agentId: details.agent_id,
  type: details.agent_type,
  callTimeout: details.agent_call_timeout,
  contact: details.agent_contact,
  maxNoAnswer: details.agent_max_no_answer,
  status: details.agent_status,
})

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveCallCenterAgentDetails() has populated the store.
 */
const getCurrentDomainName = (): string =>
  useDomainStore.getState().currentDomain?.name ?? mockHiveCallCenterAgentDetails[Object.keys(mockHiveCallCenterAgentDetails)[0]].defaultDomain

const cloneDetails = (details: CallCenterAgentDetails): CallCenterAgentDetails => ({ ...details })

/**
 * Mock implementation of the future Call Center Agent API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/callCentersAgents/list` needs a domain scope, a
 * `showAll` flag, server-side `search`, and server-side `pageNumber`/`pageSize` paging
 * (call-center.md §25) — the mock emulates that here.
 */
export const fetchCallCenterAgents = (query: CallCenterAgentListQuery = {}): Promise<CallCenterAgentListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = agents.map(toListAgent)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((agent) =>
            searchableAgentFields.some((field) => {
              const value = agent[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((agent) => agent.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((agent) => ({ ...agent }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/**
 * GET /api/callCentersAgents/details?call_center_agent_uuid= (call-center.md §25). An unknown id
 * rejects with the same `ApiError` shape (status 404) the real apiClient produces.
 */
export const getCallCenterAgentDetails = (agentUuid: string): Promise<CallCenterAgentDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = agents.find((record) => record.call_center_agent_uuid === agentUuid)

      if (!details) {
        const notFound: ApiError = { status: 404, message: `Call center agent ${agentUuid} not found.` }
        reject(notFound)
        return
      }

      resolve(cloneDetails(details))
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=CallCenterAgent&domain_name=... — Add/Edit bootstrap (domain
 * options) — and the place where the mock feeds the global domain store (PepperPBX's
 * multi-tenancy placeholder): availableDomains come from the hive's domainOptions, and
 * currentDomain is seeded from the default domain the first time — never overwriting a choice the
 * user persisted.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current domain
 * on Add, the loaded record's domain on Edit) — matches the fix already established across every
 * other module's Edit screen.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's accessible domains.
 */
export const getHiveCallCenterAgentDetails = (domainName?: string): Promise<HiveCallCenterAgentDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const fallbackKey = Object.keys(mockHiveCallCenterAgentDetails)[0]
      const hive = mockHiveCallCenterAgentDetails[domainName ?? ''] ?? mockHiveCallCenterAgentDetails[fallbackKey]

      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = hive.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: hive.defaultDomain, name: hive.defaultDomain })
      }

      resolve({ ...hive, domainOptions: [...hive.domainOptions] })
    }, 300)
  })

/**
 * GET .../callCentersAgents/listOptions?domain_name=... — domain-scoped Contact dropdown options
 * (call-center.md §8/§13/§25). NOT the same endpoint as the Call Center Queue module's
 * `getCallCenterAgentOptions` (`GET .../callCenters/getAgent`) — that one populates the Tier
 * assignment select on the Queue form; this one populates the Contact field on the Agent's own
 * Add/Edit form. Keeping them as two separate service functions in two separate modules matches
 * the audit's explicit instruction not to confuse the two (call-center.md §5/§23).
 */
export const getCallCenterAgentContactOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const fallbackKey = Object.keys(mockContactOptionsByDomain)[0]
      resolve([...(mockContactOptionsByDomain[domainName ?? ''] ?? mockContactOptionsByDomain[fallbackKey] ?? [])])
    }, 250)
  })

/**
 * Maps form values into the stored/API details shape. Numeric fields stay validated strings on
 * the form; no submit-time coercion to `Number` is applied here since the audit never documents
 * one for Agent fields (unlike the Call Center Queue module's confirmed §27 coercion) — kept as
 * strings throughout to avoid inventing an unconfirmed transformation.
 */
const toDetails = (values: CallCenterAgentFormValues, agentUuid: string, existing?: CallCenterAgentDetails): CallCenterAgentDetails => ({
  ...values,
  call_center_agent_uuid: agentUuid,
  agent_password: values.agent_password || undefined,
  agent_id: values.agent_id || undefined,
  call_flow_enabled: existing?.call_flow_enabled,
  call_flow_status: existing?.call_flow_status,
  call_flow_context: existing?.call_flow_context,
})

/** POST /api/callCentersAgents/create */
export const createCallCenterAgent = (values: CallCenterAgentFormValues): Promise<CallCenterAgentDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `agent-${Date.now()}`)
      agents = [...agents, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/** PATCH /api/callCentersAgents/update */
export const updateCallCenterAgent = (agentUuid: string, values: CallCenterAgentFormValues): Promise<CallCenterAgentDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = agents.findIndex((record) => record.call_center_agent_uuid === agentUuid)

      if (index === -1) {
        reject(new Error(`Call center agent ${agentUuid} not found.`))
        return
      }

      const updated = toDetails(values, agentUuid, agents[index])
      agents = [...agents.slice(0, index), updated, ...agents.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/callCentersAgents/delete — { call_center_agent_uuid: string[] }. Used by both single-row and bulk delete. */
export const deleteCallCenterAgents = (agentUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      agents = agents.filter((record) => !agentUuids.includes(record.call_center_agent_uuid))
      resolve()
    }, 300)
  })

/**
 * GET .../callCentersAgents/listAgentStatus?showAll= (call-center.md §16/§17/§25/§26). Returns
 * every agent's current `agent_status` (domain-scoped by default, all domains when `showAll`) —
 * the same underlying field as the list's Status column, just bootstrapped for the dedicated bulk
 * Status page.
 */
export const fetchAgentStatuses = (showAll = false): Promise<AgentStatusEntry[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const currentDomain = getCurrentDomainName()
      const scoped = showAll ? agents : agents.filter((record) => record.domain_name === currentDomain)
      resolve(
        scoped.map((record) => ({
          call_center_agent_uuid: record.call_center_agent_uuid,
          agent_name: record.agent_name,
          domain: record.domain_name,
          status: record.agent_status ?? 'logged-out',
        }))
      )
    }, 300)
  })

/**
 * PATCH .../callCentersAgents/setStatus — { agents: [{call_center_agent_uuid, status}] }
 * (call-center.md §17/§26: "submits only changed agents"). The page itself is responsible for
 * only including changed entries in `updates`; this function just applies whatever it's given.
 */
export const updateAgentStatuses = (updates: AgentStatusUpdate[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const byUuid = new Map(updates.map((update) => [update.call_center_agent_uuid, update.status]))
      agents = agents.map((record) => {
        const nextStatus = byUuid.get(record.call_center_agent_uuid)
        return nextStatus ? { ...record, agent_status: nextStatus } : record
      })
      resolve()
    }, 300)
  })
