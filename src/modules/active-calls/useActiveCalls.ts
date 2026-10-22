import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchActiveCalls } from './active-calls.service'
import { filterActiveCalls } from './active-calls.utils'
import type { ActiveCall } from './active-calls.types'

/**
 * Axion has no debounce — search commits only on Enter/the search icon (active-calls.md §6).
 * Debounce is a PepperPBX addition matching the other modules; Enter/icon/clear still commit
 * immediately. Search stays client-side either way.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Active Calls list: the one-shot snapshot, Show All, and client-side search. `enabled`
 * is false when the user lacks access — then nothing is fetched. No polling, no sockets.
 */
export const useActiveCalls = (enabled: boolean) => {
  const [data, setData] = useState<ActiveCall[]>([])
  const [wildCardDomains, setWildCardDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchActiveCalls({ showAll })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setWildCardDomains(result.wildCardDomains)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load active calls.')
      setData([])
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [enabled, showAll])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handle = setTimeout(() => setCommittedSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /** Enter / search icon — commits immediately, bypassing the debounce wait. */
  const commitSearch = useCallback((value: string) => {
    setSearchInput(value)
    setCommittedSearch(value)
  }, [])

  /** Toggling Show All (either way) clears the search and re-fetches (§3). */
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
  }, [])

  /** Reset icon: clears the search and re-fetches with the current Show All scope (§3). */
  const resetFilters = useCallback(() => {
    setSearchInput('')
    setCommittedSearch('')
    load()
  }, [load])

  const filteredData = useMemo(() => filterActiveCalls(data, committedSearch, showAll), [data, committedSearch, showAll])

  /** True while typed text is waiting out the debounce; the table keeps the last results under its spinner. */
  const searching = searchInput !== committedSearch

  return {
    data: filteredData,
    /** Loaded (unfiltered) count — separates "nothing active" from "nothing matches the search". */
    totalCount: data.length,
    loading,
    searching,
    error,
    showAll,
    wildCardDomains,
    searchTerm: searchInput,
    setSearchTerm: setSearchInput,
    commitSearch,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh: load,
  }
}

export default useActiveCalls
