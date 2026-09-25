import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchActiveConferences } from './active-conferences.service'
import { filterActiveConferences } from './active-conferences.utils'
import type { ActiveConference } from './active-conferences.types'

/**
 * Axion has no debounce — search commits only on Enter/the search icon (active-conferences.md §6).
 * This is a PepperPBX addition on top of that, matching the other modules: typing commits once it
 * settles, while Enter/icon/clear still commit immediately. Search stays client-side either way.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Active Conferences list: the REST snapshot, Show All, and client-side search. `enabled`
 * is false when the user lacks access — then nothing is fetched.
 */
export const useActiveConferences = (enabled: boolean) => {
  const [data, setData] = useState<ActiveConference[]>([])
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
      const result = await fetchActiveConferences({ showAll })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setWildCardDomains(result.wildCardDomains)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load active conferences.')
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

  /** Enter / search icon / clear icon — commits immediately, bypassing the debounce wait. */
  const commitSearch = useCallback((value: string) => {
    setSearchInput(value)
    setCommittedSearch(value)
  }, [])

  /** Toggling Show All (either way) clears the search and re-fetches (§7). */
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
  }, [])

  /** Reset icon: clears the search and re-fetches with the current Show All scope (§6/§7). */
  const resetFilters = useCallback(() => {
    setSearchInput('')
    setCommittedSearch('')
    load()
  }, [load])

  const filteredData = useMemo(() => filterActiveConferences(data, committedSearch, showAll), [data, committedSearch, showAll])

  /**
   * True while typed text is waiting out the debounce. The table keeps the last committed results
   * under its spinner until the timer commits — the same thing the server-searched modules show
   * while their fetch is in flight. Derived, so rapid typing just keeps it true until the last
   * keystroke settles, and there's no stale result to race against (filtering is synchronous).
   */
  const searching = searchInput !== committedSearch

  return {
    data: filteredData,
    /** Loaded (unfiltered) record count — separates "nothing active" from "nothing matches the search". */
    totalCount: data.length,
    loading,
    searching,
    error,
    showAll,
    wildCardDomains,
    searchTerm: searchInput,
    committedSearch,
    setSearchTerm: setSearchInput,
    commitSearch,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh: load,
  }
}

export default useActiveConferences
