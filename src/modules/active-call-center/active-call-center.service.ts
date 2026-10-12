import { fetchCallCenters } from '../call-center/call-center.service'
import { buildMockQueueActivity } from './active-call-center.mock'
import { toQueueKey } from './active-call-center.utils'
import type { ApiError } from '../../services/api/apiError'
import type {
  ActiveCallCenterListQuery,
  ActiveCallCenterListResponse,
  AgentBridgeParams,
  AgentTransferParams,
  EavesdropParams,
  MockActionResult,
  QueueActivityPayload,
  QueueSelection,
} from './active-call-center.types'

/**
 * Mock implementation of the future Active Call Center API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed. Active Call Center is a
 * read-only monitor: nothing here mutates stored data, and no realtime (Socket.IO) connection or
 * polling exists in this module — every read is a one-shot request.
 */

const apiError = (status: number, message: string): ApiError => ({ status, message })

/**
 * Queue List — GET /api/callCenters/list?page_size&page_number&show_all&search (active-call-center.md
 * §3/§12). Axion imports the Call Center module's own list call for this screen; so does this one,
 * so the queues, domain scoping, server-side search and paging stay identical to Call Center's.
 */
export const fetchActiveCallCenterQueues = (query: ActiveCallCenterListQuery = {}): Promise<ActiveCallCenterListResponse> =>
  fetchCallCenters(query)

/**
 * One queue's snapshot — the payload Axion receives over the `queueDataUpdated` event after
 * `subscribeQueue` (§23). Here it is a single request; the data never updates by itself. A queue
 * with no seeded activity resolves an empty, valid snapshot (an idle queue).
 */
export const fetchQueueActivity = (selection: QueueSelection): Promise<QueueActivityPayload> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const key = toQueueKey(selection)
      const seeded = buildMockQueueActivity(Math.floor(Date.now() / 1000))[key]
      resolve(
        seeded ?? {
          queueName: key,
          data: { agents: [], tiers: [], members: [], callCenterQueueName: selection.queueName, callCenterQueueUUid: selection.queueUuid },
        }
      )
    }, 350)
  })

/**
 * The three agent actions are fire-and-forget GETs in Axion (§11/§12). There is no PBX behind this
 * mock, so each one only validates its parameters and says so in its result — none of them claims a
 * call was bridged, transferred or monitored.
 */
const mockAction = (description: string, required: Record<string, string>): Promise<MockActionResult> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const missing = Object.entries(required).filter(([, value]) => !value.trim())
      if (missing.length > 0) {
        reject(apiError(400, `Missing ${missing.map(([name]) => name).join(', ')}.`))
        return
      }
      resolve({ message: `${description} — mock mode: no PBX is connected, so nothing was performed.` })
    }, 250)
  })

/** GET /api/activeCallCenters/agentBridge?extension&domain_name (§12) — "Call". */
export const agentBridge = ({ extension, domain_name }: AgentBridgeParams): Promise<MockActionResult> =>
  mockAction(`Call to extension ${extension}`, { extension, domain_name })

/** GET /api/activeCallCenters/agentTransfer?agent_uuid (§12) — "Transfer". */
export const agentTransfer = ({ agent_uuid }: AgentTransferParams): Promise<MockActionResult> =>
  mockAction('Transfer', { agent_uuid })

/** GET /api/activeCallCenters/eavesDrop?caller_id_number&uuid (§12) — "Eavesdrop". */
export const eavesdrop = ({ caller_id_number, uuid }: EavesdropParams): Promise<MockActionResult> =>
  mockAction(`Eavesdrop on ${caller_id_number}`, { caller_id_number, uuid })
