import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './call-center.constants'
import { deleteCallCenters, fetchCallCenters, toggleCallCenterTierRules } from './call-center.service'
import type { CallCenter } from './call-center.types'

/**
 * The Axion reference itself has no debounce at the list level — search only commits on
 * Enter/the search icon (call-center.md §3/§6) — this is a deliberate PepperPBX addition on top
 * of that documented behavior, not a replacement for it: commitSearch (Enter/icon-click) still
 * commits immediately, matching every other module's identical pattern.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the call-center queue dataset and its pagination/search/domain-scope state — mirrors the
 * shape established by Call Block's/Announcements' own list hooks. CallCentersPage stays
 * composition-only; a future server-side swap only touches this hook and call-center.service.ts.
 */
export const useCallCenters = () => {
  const [data, setData] = useState<CallCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)
  const lastCommittedSearchRef = useRef('')

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCallCenters({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load call center queues.')
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

  /** Typing handler (CallCenterFilters' onChange) — always updates immediately; the debounce
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

  /** Reset icon: search, showAll, and page size all return to their defaults; page resets to 1 — matches call-center.md §3/§6/§7. */
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
  const removeCallCenters = useCallback(
    async (queueUuids: string[]) => {
      await deleteCallCenters(queueUuids)
      await load()
    },
    [load]
  )

  /** Used by the inline "Tier Rules Apply" Tag click on the list — single record only, matching
   * the requested behavior (no bulk toggle for this field). */
  const toggleTierRulesApply = useCallback(
    async (queueUuid: string) => {
      await toggleCallCenterTierRules(queueUuid)
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
    removeCallCenters,
    toggleTierRulesApply,
  }
}

export default useCallCenters
