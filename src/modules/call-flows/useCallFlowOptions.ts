import { useCallback, useEffect, useRef, useState } from 'react'
import { getDestinationOptions, getSoundOptions } from './call-flows.service'
import type { CallFlowDestinationOption, CallFlowSoundOption } from './call-flows.types'

/**
 * Domain-scoped Destination + Sound options for the Add/Edit form (call-flows.md §3/§9/§12).
 *
 * Deliberately separate from the page's record/bootstrap loading: Axion keeps the whole Edit form
 * on a spinner until these options settle, forever if they never do (§16/§28). Here the form
 * renders as soon as the record is ready, the option selects show their own loading state, and a
 * failure surfaces `error` + `retry` (Axion's "Some data couldn't be loaded" notice, §18).
 */
export const useCallFlowOptions = (domainName: string | undefined) => {
  const [destinationOptions, setDestinationOptions] = useState<CallFlowDestinationOption[]>([])
  const [soundOptions, setSoundOptions] = useState<CallFlowSoundOption[]>([])
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
      const [destinations, sounds] = await Promise.all([getDestinationOptions(domainName), getSoundOptions(domainName)])
      if (requestId !== requestRef.current) return
      setDestinationOptions(destinations)
      setSoundOptions(sounds)
    } catch {
      if (requestId !== requestRef.current) return
      setDestinationOptions([])
      setSoundOptions([])
      setError(true)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [domainName])

  useEffect(() => {
    load()
  }, [load])

  return { destinationOptions, soundOptions, loading, error, retry: load }
}

export default useCallFlowOptions
