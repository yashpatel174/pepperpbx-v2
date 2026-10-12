import { ABANDONED_MEMBER_STATE, ACTIVE_CALL_CENTER_ACTIVITY_PATH } from './active-call-center.constants'
import type {
  AgentRow,
  MemberRow,
  QueueActivityPayload,
  QueueAgent,
  QueueSelection,
  QueueStateCounts,
  QueueTier,
} from './active-call-center.types'

/** `h:mm:ss` from elapsed seconds (active-call-center.md §27). Negative input (clock skew) clamps to 0. */
export const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

/**
 * Extension out of a FreeSWITCH-style contact (`sofia/internal/<ext>@…` or `user/<ext>@…`) —
 * the audit's regexes (§27). The contact format itself is backend-defined (§28), so a miss returns ''.
 */
export const getExtension = (contact: string): string => {
  const match = /sofia\/internal\/([^@;]+)/i.exec(contact) ?? /user\/([^@;]+)/i.exec(contact)
  return match ? match[1] : ''
}

/** Domain out of the contact's `domain_name=` parameter (§27). */
export const getDomainName = (contact: string): string => /domain_name=([^,}]+)/.exec(contact)?.[1] ?? ''

/** Agents deduplicated by name, tiers by `agent-level-position` (§26 — the Map-based dedupe, first one wins). */
const dedupeBy = <T>(items: T[], keyOf: (item: T) => string): T[] => {
  const seen = new Map<string, T>()
  items.forEach((item) => {
    const key = keyOf(item)
    if (!seen.has(key)) seen.set(key, item)
  })
  return [...seen.values()]
}

/**
 * One row per tier, merged with its agent by name (§27). A tier whose agent is not in the payload
 * still renders (blank agent fields) rather than silently dropping the tier. Durations are
 * computed once against `nowSeconds` — there is deliberately no ticking clock in this module.
 */
export const buildAgentRows = (payload: QueueActivityPayload, nowSeconds: number): AgentRow[] => {
  const agentByName = new Map(dedupeBy(payload.data.agents, (agent) => agent.name).map((agent) => [agent.name, agent] as const))
  const tiers = dedupeBy(payload.data.tiers, (tier: QueueTier) => `${tier.agent}-${tier.level}-${tier.position}`)

  return tiers.map((tier) => {
    const agent: QueueAgent | undefined = agentByName.get(tier.agent)
    const contact = agent?.contact ?? ''
    return {
      key: `${tier.agent}-${tier.level}-${tier.position}`,
      call_center_agent_uuid: agent?.call_center_agent_uuid ?? '',
      name: agent?.agent_name ?? agent?.name ?? tier.agent,
      extension: getExtension(contact),
      domain_name: getDomainName(contact),
      status: agent?.status ?? '',
      state: agent?.state ?? '',
      last_status_change: agent?.last_status_change ?? 0,
      status_change: agent ? formatDuration(nowSeconds - agent.last_status_change) : '',
      missed: agent?.no_answer_count ?? 0,
      answered: agent?.calls_answered ?? 0,
      tier_state: tier.state,
      tier_level: tier.level,
      tier_position: tier.position,
    }
  })
}

export const buildMemberRows = (payload: QueueActivityPayload, nowSeconds: number): MemberRow[] =>
  payload.data.members.map((member) => ({
    key: member.uuid,
    joined_epoch: member.joined_epoch,
    time: formatDuration(nowSeconds - member.joined_epoch),
    name: member.cid_name,
    number: member.cid_number,
    status: member.state,
    agent: member.serving_agent_name || member.serving_agent,
    session_uuid: member.session_uuid,
  }))

/** Exact string comparison on `Trying` / `Waiting` / `Answered` (§27). */
export const countQueueStates = (members: MemberRow[]): QueueStateCounts =>
  members.reduce<QueueStateCounts>(
    (counts, member) => {
      if (member.status === 'Waiting') counts.waiting += 1
      else if (member.status === 'Trying') counts.trying += 1
      else if (member.status === 'Answered') counts.answered += 1
      return counts
    },
    { waiting: 0, trying: 0, answered: 0 }
  )

export const canEavesdropMember = (member: MemberRow): boolean => member.status !== ABANDONED_MEMBER_STATE

/** Server-side key of a queue: `<extension>@<domain>` (§15). */
export const toQueueKey = (selection: Pick<QueueSelection, 'queueExtension' | 'domainName'>): string =>
  `${selection.queueExtension}@${selection.domainName}`

/** URL for the Activity screen. The queue travels in the query string so a reload keeps it (the job Axion's `window` globals did). */
export const buildActivityUrl = (selection: QueueSelection): string => {
  const params = new URLSearchParams({
    queue_extension: selection.queueExtension,
    domain_name: selection.domainName,
    queue_uuid: selection.queueUuid,
    queue_name: selection.queueName,
  })
  return `${ACTIVE_CALL_CENTER_ACTIVITY_PATH}?${params.toString()}`
}

/** The audit's `queue_extension` guard (§3): without an extension (and its domain) there is nothing to show → null. */
export const parseQueueSelection = (params: URLSearchParams): QueueSelection | null => {
  const queueExtension = params.get('queue_extension')?.trim()
  const domainName = params.get('domain_name')?.trim()
  if (!queueExtension || !domainName) return null
  return {
    queueExtension,
    domainName,
    queueUuid: params.get('queue_uuid') ?? '',
    queueName: params.get('queue_name') ?? '',
  }
}
