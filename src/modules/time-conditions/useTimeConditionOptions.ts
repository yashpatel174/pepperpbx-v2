import { useCallback, useEffect, useRef, useState } from 'react'
import { getDestinationActionOptions, getTimeGroupOptions } from './time-condition.service'
import type { TimeConditionDestinationOption, TimeGroupOption } from './time-condition.types'

/**
 * Domain-scoped Time Group presets + destination action options for the Add/Edit form, fetched in
 * parallel as Axion's `ModalForm` does (time-conditions.md §3/§9/§12).
 *
 * Deliberately separate from the page's record/bootstrap loading: Axion's Edit page lets the
 * selects appear empty until these settle (§16). Here the form renders as soon as the record is
 * ready, the selects show their own loading state, and a failure surfaces `error` + `retry`.
 */
export const useTimeConditionOptions = (domainName: string | undefined) => {
  const [timeGroupOptions, setTimeGroupOptions] = useState<TimeGroupOption[]>([])
  const [destinationOptions, setDestinationOptions] = useState<TimeConditionDestinationOption[]>([])
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
      const [timeGroups, destinations] = await Promise.all([
        getTimeGroupOptions(domainName),
        getDestinationActionOptions(domainName),
      ])
      if (requestId !== requestRef.current) return
      setTimeGroupOptions(timeGroups)
      setDestinationOptions(destinations)
    } catch {
      if (requestId !== requestRef.current) return
      setTimeGroupOptions([])
      setDestinationOptions([])
      setError(true)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [domainName])

  useEffect(() => {
    load()
  }, [load])

  return { timeGroupOptions, destinationOptions, loading, error, retry: load }
}

export default useTimeConditionOptions
