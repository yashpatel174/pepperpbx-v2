import type { CallCenter, CallCenterListQuery, CallCenterListResponse } from '../call-center/call-center.types'

/**
 * BACKEND CONTRACT REQUIRED. Every shape below comes from the Axion functional audit only
 * (active-call-center.md §5/§23/§27) — the fields Axion reads or renders — not from a confirmed
 * PepperPBX backend contract. Don't add fields speculatively.
 */

/**
 * The Queue List reuses Call Center's own list entity and endpoint, exactly as Axion does
 * (active-call-center.md §3/§12/§30: `getCallCenterList` imported from the callCenter module).
 */
export type ActiveCallCenterQueue = CallCenter
export type ActiveCallCenterListQuery = CallCenterListQuery
export type ActiveCallCenterListResponse = CallCenterListResponse

/** The queue the Activity screen shows, carried in the URL (replaces Axion's `window` globals). */
export interface QueueSelection {
  queueExtension: string
  domainName: string
  queueUuid: string
  queueName: string
}

/** An agent as delivered in the `queueDataUpdated` payload (§23/§27). `contact` carries the extension and domain. */
export interface QueueAgent {
  name: string
  agent_name?: string
  call_center_agent_uuid: string
  contact: string
  status: string
  state: string
  /** Epoch seconds. */
  last_status_change: number
  no_answer_count: number
  calls_answered: number
}

/** A tier row linking an agent (by name) to the queue (§27). */
export interface QueueTier {
  agent: string
  level: number
  position: number
  state: string
}

/** A caller waiting in / being served by the queue (§27). `state` is Trying / Waiting / Answered / Abandoned. */
export interface QueueMember {
  uuid: string
  session_uuid: string
  cid_name: string
  cid_number: string
  state: string
  /** Epoch seconds. */
  joined_epoch: number
  serving_agent: string
  serving_agent_name: string
}

/** Plain-object payload of one queue snapshot (§23). */
export interface QueueActivityPayload {
  queueName: string
  data: {
    agents: QueueAgent[]
    tiers: QueueTier[]
    members: QueueMember[]
    callCenterQueueName: string
    callCenterQueueUUid: string
  }
}

/** Agent table row: a tier merged with its agent (§5/§27). `status_change` is derived at render time. */
export interface AgentRow {
  key: string
  call_center_agent_uuid: string
  name: string
  extension: string
  domain_name: string
  status: string
  state: string
  last_status_change: number
  status_change: string
  missed: number
  answered: number
  tier_state: string
  tier_level: number
  tier_position: number
}

/** Queue members table row (§5/§27). `time` is derived at render time. */
export interface MemberRow {
  key: string
  joined_epoch: number
  time: string
  name: string
  number: string
  status: string
  agent: string
  session_uuid: string
}

export interface QueueStateCounts {
  waiting: number
  trying: number
  answered: number
}

/** Query of `agentBridge` — GET with `extension` + `domain_name` (§12). */
export interface AgentBridgeParams {
  extension: string
  domain_name: string
}

/** Query of `agentTransfer` — GET with `agent_uuid` (§12). */
export interface AgentTransferParams {
  agent_uuid: string
}

/** Query of `eavesdrop` — GET with `caller_id_number` + `uuid` (§12). */
export interface EavesdropParams {
  caller_id_number: string
  uuid: string
}

/** What a mock action resolves. Real PBX commands are backend-only, so the mock never claims one happened. */
export interface MockActionResult {
  message: string
}
