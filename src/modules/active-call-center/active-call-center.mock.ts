import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { QueueActivityPayload, QueueAgent, QueueMember, QueueTier } from './active-call-center.types'

/**
 * Invented sample data — only the field NAMES come from the audit (active-call-center.md §23/§27).
 * The Queue List itself is NOT mocked here: it comes from the Call Center module's own service, as
 * in Axion (§3), so these activity snapshots are keyed to the extensions that mock already seeds.
 * Epochs are offsets from the moment a snapshot is built, so durations look plausible when loaded.
 */
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

const contact = (domain: string, extension: string) => `{domain_name=${domain},presence_id=${extension}@${domain}}user/${extension}@${domain}`

const agent = (domain: string, extension: string, name: string, state: string, status: string, ago: number, now: number, missed: number, answered: number): QueueAgent => ({
  name: `${extension}@${domain}`,
  agent_name: name,
  call_center_agent_uuid: `agent-${extension}-${domain}`,
  contact: contact(domain, extension),
  status,
  state,
  last_status_change: now - ago,
  no_answer_count: missed,
  calls_answered: answered,
})

const tier = (agentRef: QueueAgent, level: number, position: number, state: string): QueueTier => ({ agent: agentRef.name, level, position, state })

const member = (id: string, name: string, number: string, state: string, waited: number, now: number, servedBy?: QueueAgent): QueueMember => ({
  uuid: `member-${id}`,
  session_uuid: `session-${id}`,
  cid_name: name,
  cid_number: number,
  state,
  joined_epoch: now - waited,
  serving_agent: servedBy?.name ?? '',
  serving_agent_name: servedBy?.agent_name ?? '',
})

/** Activity snapshots keyed by `<extension>@<domain>`. A queue with no entry is a valid, idle queue. */
export const buildMockQueueActivity = (nowSeconds: number): Record<string, QueueActivityPayload> => {
  const d = MOCK_DEFAULT_DOMAIN

  const supportA = agent(d, '1001', 'Asha Verma', 'Waiting', 'Available', 540, nowSeconds, 2, 31)
  const supportB = agent(d, '1002', 'Ravi Nair', 'In a queue call', 'Available', 95, nowSeconds, 0, 27)
  const supportC = agent(d, '1003', 'Meera Iyer', 'Idle', 'On Break', 1320, nowSeconds, 4, 12)
  const salesA = agent(d, '1004', 'Kabir Shah', 'In a queue call', 'Available', 40, nowSeconds, 1, 19)
  const salesB = agent(d, '1005', 'Divya Rao', 'Waiting', 'Available', 210, nowSeconds, 0, 22)
  const branchA = agent(BRANCH_DOMAIN, '2101', 'Nikhil Das', 'Waiting', 'Available', 75, nowSeconds, 1, 8)
  const axionA = agent(AXION_SAMPLE_DOMAIN, '3101', 'Priya Menon', 'In a queue call', 'Available', 33, nowSeconds, 0, 14)

  return {
    [`2001@${d}`]: {
      queueName: `2001@${d}`,
      data: {
        callCenterQueueName: 'Support Queue',
        callCenterQueueUUid: 'queue-2001',
        agents: [supportA, supportB, supportC],
        tiers: [
          tier(supportA, 0, 0, 'Ready'),
          tier(supportB, 0, 1, 'Active Inbound'),
          tier(supportC, 1, 0, 'Offering'),
        ],
        members: [
          member('s1', 'John Carter', '+14155550101', 'Answered', 188, nowSeconds, supportB),
          member('s2', 'Lena Fischer', '+14155550102', 'Waiting', 64, nowSeconds),
          member('s3', 'Unknown Caller', '+14155550103', 'Trying', 9, nowSeconds),
          member('s4', 'Omar Haddad', '+14155550104', 'Abandoned', 142, nowSeconds),
        ],
      },
    },
    [`2002@${d}`]: {
      queueName: `2002@${d}`,
      data: {
        callCenterQueueName: 'Sales Queue',
        callCenterQueueUUid: 'queue-2002',
        agents: [salesA, salesB],
        tiers: [tier(salesA, 0, 0, 'Active Inbound'), tier(salesB, 0, 1, 'Ready')],
        members: [
          member('b1', 'Grace Lin', '+14155550111', 'Answered', 305, nowSeconds, salesA),
          member('b2', 'Samir Patel', '+14155550112', 'Waiting', 21, nowSeconds),
        ],
      },
    },
    [`2005@${BRANCH_DOMAIN}`]: {
      queueName: `2005@${BRANCH_DOMAIN}`,
      data: {
        callCenterQueueName: 'Branch Reception Queue',
        callCenterQueueUUid: 'queue-2005',
        agents: [branchA],
        tiers: [tier(branchA, 0, 0, 'Ready')],
        members: [member('r1', 'Walk-in Line', '+14155550121', 'Waiting', 47, nowSeconds)],
      },
    },
    [`2006@${AXION_SAMPLE_DOMAIN}`]: {
      queueName: `2006@${AXION_SAMPLE_DOMAIN}`,
      data: {
        callCenterQueueName: 'Axion Support Queue',
        callCenterQueueUUid: 'queue-2006',
        agents: [axionA],
        tiers: [tier(axionA, 0, 0, 'Active Inbound')],
        members: [member('x1', 'Dana Kim', '+14155550131', 'Answered', 120, nowSeconds, axionA)],
      },
    },
  }
}
