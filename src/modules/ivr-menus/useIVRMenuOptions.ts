import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getDestinationOptions,
  getExitActionOptions,
  getGreetOptions,
  getParentMenuOptions,
  getRingbackOptions,
  getSoundOptions,
} from './ivr-menu.service'
import type { IVRMenuFormOptions } from './ivr-menu.types'

const emptyOptions: IVRMenuFormOptions = {
  destinationOptions: [],
  exitActionOptions: [],
  greetOptions: [],
  parentMenuOptions: [],
  soundOptions: [],
  ringbackOptions: [],
}

/**
 * The six domain-scoped dropdown lists for the Add/Edit form, fetched in parallel (ivr-menus.md
 * §3/§9/§12). Re-runs whenever the domain changes.
 *
 * `excludeUuid` (Edit) removes the record itself from Parent Menu so an IVR can't be its own parent (§9/§26).
 *
 * Kept apart from the page's record/bootstrap loading: the form renders as soon as the record is
 * ready, the selects show their own loading state, and a failure surfaces `error` + `retry`
 * (Axion's "Some data couldn't be loaded, Please refresh" notice, §18).
 */
export const useIVRMenuOptions = (domainName: string | undefined, excludeUuid?: string) => {
  const [options, setOptions] = useState<IVRMenuFormOptions>(emptyOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  // Only the latest request may apply — a slow response for a previous domain never wins.
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!domainName) return
    const requestId = ++requestRef.current
    // Drop the previous domain's lists at once, so none of them can be picked while the new ones load.
    setOptions(emptyOptions)
    setLoading(true)
    setError(false)
    try {
      const [destinationOptions, exitActionOptions, greetOptions, parentMenuOptions, soundOptions, ringbackOptions] = await Promise.all([
        getDestinationOptions(domainName),
        getExitActionOptions(domainName),
        getGreetOptions(domainName),
        getParentMenuOptions(domainName),
        getSoundOptions(domainName),
        getRingbackOptions(domainName),
      ])
      if (requestId !== requestRef.current) return
      setOptions({
        destinationOptions,
        exitActionOptions,
        greetOptions,
        parentMenuOptions: excludeUuid ? parentMenuOptions.filter((option) => option.value !== excludeUuid) : parentMenuOptions,
        soundOptions,
        ringbackOptions,
      })
    } catch {
      if (requestId !== requestRef.current) return
      setOptions(emptyOptions)
      setError(true)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [domainName, excludeUuid])

  useEffect(() => {
    load()
  }, [load])

  return { ...options, loading, error, retry: load }
}

export default useIVRMenuOptions
