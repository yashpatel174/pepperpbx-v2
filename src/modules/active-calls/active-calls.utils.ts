import dayjs from 'dayjs'
import { CREATED_DATE_FORMAT } from './active-calls.constants'
import type { ActiveCall } from './active-calls.types'

/** `created` display (§5): empty string when the value is missing. */
export const formatCreated = (created?: string): string => (created ? dayjs(created).format(CREATED_DATE_FORMAT) : '')

/**
 * Client-side search (§6): case-insensitive substring over callState, direction, cid_name, cid_num,
 * destination, ip_addr and hostname — plus domain only under Show All.
 */
export const filterActiveCalls = (calls: ActiveCall[], search: string, showAll: boolean): ActiveCall[] => {
  const needle = search.trim().toLowerCase()
  if (!needle) return calls

  return calls.filter((call) => {
    const fields = [
      call.callState,
      call.direction,
      call.cid_name,
      call.cid_num,
      call.destination,
      call.ip_addr,
      call.hostname,
      ...(showAll ? [call.domain] : []),
    ]
    return fields.some((value) => String(value ?? '').toLowerCase().includes(needle))
  })
}
