import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './outbound-route.constants'
import { deleteOutboundRoutes, fetchOutboundRoutes, toggleOutboundRoutes } from './outbound-route.service'
import type { OutboundRoute } from './outbound-route.types'

/**
 * The Axion reference itself has no debounce at the list level — search only commits on
 * Enter/the search icon (outbound-routes.md §3 item 5/§6) — this is a deliberate PepperPBX
 * addition on top of that documented behavior, not a replacement for it: commitSearch
 * (Enter/icon-click) still commits immediately, matching Destinations'/Extensions' own
 * debounce constant/pattern.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the outbound-routes dataset and its pagination/search/domain-scope state — mirrors the
 * shape established by Destinations' useDestinations.ts (page/pageSize/showAll, a commit-on-search
 * term, server-style refetch on any of them changing), applied independently here. OutboundRoutesPage
 * stays composition-only; a future server-side swap only touches this hook and
 * outbound-route.service.ts.
 */
export const useOutboundRoutes = () => {
  const [data, setData] = useState<OutboundRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  // searchInput reflects what's typed (always immediately responsive); committedSearch is what's
  // actually fetched with. Promoted to committedSearch either immediately (Enter/icon-click, via
  // commitSearch) or automatically after SEARCH_DEBOUNCE_MS of no typing (the effect below).
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)
  // Tracks the last value that was actually committed (by either path) — see useDestinations.ts's
  // identical lastCommittedSearchRef for the full rationale (avoids a stale debounce timer
  // redundantly resetting the page back to 1 after an early Enter-commit).
  const lastCommittedSearchRef = useRef('')

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOutboundRoutes({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load outbound routes.')
      setData([])
      setTotalRecords(0)
      if (page > 1) setPage(1)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [page, pageSize, showAll, committedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /** Typing handler (OutboundRouteFilters' onChange) — always updates immediately; the debounce
   * effect above commits it to a fetch once typing settles. */
  const setSearchTerm = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  /** Enter/icon-click/clear — commits immediately, bypassing the debounce wait. */
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

  // Matches the Axion reference: toggling Show All (either direction) also clears the search.
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: search, showAll, and page size all return to their defaults; page resets to 1 — matches outbound-routes.md §3/§6/§7. */
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
  const removeOutboundRoutes = useCallback(
    async (dialplanUuids: string[]) => {
      await deleteOutboundRoutes(dialplanUuids)
      await load()
    },
    [load]
  )

  /** Used by both the inline row Status pill (one-element array, no confirmation) and the bulk Toggle popup (many, confirmed). */
  const toggleOutboundRoutesStatus = useCallback(
    async (dialplanUuids: string[]) => {
      await toggleOutboundRoutes(dialplanUuids)
      await load()
    },
    [load]
  )

  return {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm: searchInput,
    committedSearch,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize: setSize,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh,
    removeOutboundRoutes,
    toggleOutboundRoutesStatus,
  }
}

export default useOutboundRoutes
