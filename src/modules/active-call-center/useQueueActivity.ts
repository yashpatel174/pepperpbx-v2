import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchQueueActivity } from './active-call-center.service'
import { buildAgentRows, buildMemberRows, countQueueStates } from './active-call-center.utils'
import type { QueueActivityPayload, QueueSelection } from './active-call-center.types'

interface Snapshot {
  payload: QueueActivityPayload
  /** Epoch seconds the snapshot arrived — the fixed reference for the displayed durations. */
  loadedAtSeconds: number
}

/**
 * One queue's activity snapshot (active-call-center.md §3). Axion streams this over a socket and
 * re-derives the durations every second; this module does neither — it loads the snapshot once
 * (and again on `refresh`) and computes the durations against the moment it arrived. A new
 * selection discards the old snapshot and loads the new queue.
 */
export const useQueueActivity = (selection: QueueSelection | null, enabled: boolean) => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const { queueExtension, domainName, queueUuid, queueName } = selection ?? { queueExtension: '', domainName: '', queueUuid: '', queueName: '' }
  const hasSelection = selection !== null

  const load = useCallback(async () => {
    if (!enabled || !hasSelection) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const payload = await fetchQueueActivity({ queueExtension, domainName, queueUuid, queueName })
      if (requestId !== requestRef.current) return
      setSnapshot({ payload, loadedAtSeconds: Math.floor(Date.now() / 1000) })
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load the queue activity.')
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [enabled, hasSelection, queueExtension, domainName, queueUuid, queueName])

  useEffect(() => {
    setSnapshot(null)
    load()
  }, [load])

  const agents = useMemo(() => (snapshot ? buildAgentRows(snapshot.payload, snapshot.loadedAtSeconds) : []), [snapshot])
  const members = useMemo(() => (snapshot ? buildMemberRows(snapshot.payload, snapshot.loadedAtSeconds) : []), [snapshot])
  const counts = useMemo(() => countQueueStates(members), [members])

  return {
    agents,
    members,
    counts,
    queueName: snapshot?.payload.data.callCenterQueueName || queueName,
    queueUuid: snapshot?.payload.data.callCenterQueueUUid || queueUuid,
    loaded: snapshot !== null,
    loading,
    error,
    refresh: load,
  }
}

export default useQueueActivity
