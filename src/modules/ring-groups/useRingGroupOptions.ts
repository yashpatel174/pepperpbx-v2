import { useCallback, useEffect, useRef, useState } from 'react'
import { getRingGroupOptionSets } from './ring-group.service'
import type { RingGroupOptionSets } from './ring-group.types'

const emptyOptionSets: RingGroupOptionSets = {
  destinationOptions: [],
  timeoutDestinationOptions: [],
  greetingOptions: [],
  ringBackOptions: [],
}

/**
 * Domain-scoped Destination / Timeout Destination / Greeting / Ring Back options for the Add/Edit
 * form (ring-groups.md §3/§9/§12), re-fetched whenever the form's domain changes.
 *
 * A failure never blocks the form: the selects stay empty and `error` + `retry` surface Axion's
 * "Some data couldn't be loaded" notice (§16/§18).
 */
export const useRingGroupOptions = (domainName: string | undefined) => {
  const [optionSets, setOptionSets] = useState<RingGroupOptionSets>(emptyOptionSets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  // Only the latest request may apply — a slow response for a previous domain never wins.
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!domainName) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(false)
    try {
      const result = await getRingGroupOptionSets(domainName)
      if (requestId === requestRef.current) setOptionSets(result)
    } catch {
      if (requestId !== requestRef.current) return
      setOptionSets(emptyOptionSets)
      setError(true)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [domainName])

  useEffect(() => {
    load()
  }, [load])

  return { ...optionSets, loading, error, retry: load }
}

export default useRingGroupOptions
