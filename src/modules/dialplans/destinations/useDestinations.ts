import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './destination.constants'
import { deleteDestinations, fetchDestinations, setDestinationEnabled } from './destination.service'
import type { Destination, DestinationType } from './destination.types'

/**
 * Delay before a typed-but-uncommitted search value auto-commits to a fetch. The Axion
 * reference itself has no debounce at the list level — search only commits on Enter/the search
 * icon (destinations.md §3 item 5) — this is a deliberate PepperPBX addition on top of that
 * documented behavior, not a replacement for it: commitSearch (Enter/icon-click) still commits
 * immediately, matching Extensions' own debounce constant/pattern (useExtensions.ts).
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the destinations dataset and its pagination/search/type-filter/domain-scope state —
 * mirrors the shape established by Gateways' useGateways.ts (page/pageSize/showAll, a
 * commit-on-search term, server-style refetch on any of them changing), applied independently
 * here. DestinationsPage stays composition-only; a future server-side swap only touches this
 * hook and destination.service.ts.
 */
export const useDestinations = () => {
  const [data, setData] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [destinationType, setDestinationType] = useState<DestinationType | undefined>(undefined)
  // searchInput reflects what's typed (always immediately responsive); committedSearch is what's
  // actually fetched with. Promoted to committedSearch either immediately (Enter/icon-click, via
  // commitSearch) or automatically after SEARCH_DEBOUNCE_MS of no typing (the effect below).
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)
  // Tracks the last value that was actually committed (by either path), so the debounce timeout
  // below can tell "this value was already committed early via Enter/icon-click" apart from
  // "this value genuinely hasn't been searched yet" — without it, a debounce timer started before
  // an Enter-commit would still fire ~400ms later and redundantly reset the page back to 1, even
  // if the user had since paged forward through the (already-fetched) committed results.
  const lastCommittedSearchRef = useRef('')

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDestinations({ page, pageSize, showAll, search: committedSearch, destinationType })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load destinations.')
      setData([])
      setTotalRecords(0)
      if (page > 1) setPage(1)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [page, pageSize, showAll, committedSearch, destinationType])

  useEffect(() => {
    load()
  }, [load])

  // Auto-commits the typed search value SEARCH_DEBOUNCE_MS after the user stops typing, so a
  // fetch doesn't fire on every keystroke. Restarts on every searchInput change (the standard
  // debounce cleanup — clearTimeout cancels a stale, not-yet-fired timer whenever a newer
  // keystroke arrives, so an outdated value can never win a race against a newer one). Skips the
  // commit if this exact value was already committed early via commitSearch (Enter/icon-click)
  // — see lastCommittedSearchRef above.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /** Typing handler (DestinationFilters' onChange) — always updates immediately; the debounce
   * effect above commits it to a fetch once typing settles. */
  const setSearchTerm = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  /** Enter/icon-click/clear in DestinationFilters — commits immediately, bypassing the debounce wait. */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPage(1)
  }, [])

  const setSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  const setTypeFilter = useCallback((value: DestinationType | undefined) => {
    setDestinationType(value)
    setPage(1)
  }, [])

  // Matches the Axion reference: toggling Show All (either direction) also clears the search.
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /**
   * Reset icon: search, showAll, and page size all return to their defaults; page resets to 1.
   * The type filter is deliberately NOT reset — matches the Axion reference's documented reset
   * behavior (destinations.md §6).
   */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const refresh = useCallback(() => load(), [load])

  /** Used by both single-row (one-element array) and bulk delete. */
  const removeDestinations = useCallback(
    async (destinationUuids: string[]) => {
      await deleteDestinations(destinationUuids)
      await load()
    },
    [load]
  )

  /**
   * Flips the stored `destination_enabled` flag through the service boundary (so a later
   * refetch sees the new value) and updates the visible row in place, keeping pagination/sort/
   * search state exactly as it was — mirrors Extensions' toggleExtensionStatus (useExtensions.ts).
   */
  const toggleDestinationStatus = useCallback(async (id: string, enabled: boolean) => {
    await setDestinationEnabled(id, enabled)
    setData((prev) => prev.map((destination) => (destination.id === id ? { ...destination, enabled } : destination)))
  }, [])

  return {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    destinationType,
    searchTerm: searchInput,
    committedSearch,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize: setSize,
    setShowAll: setShowAllMode,
    setTypeFilter,
    resetFilters,
    refresh,
    removeDestinations,
    toggleDestinationStatus,
  }
}

export default useDestinations
