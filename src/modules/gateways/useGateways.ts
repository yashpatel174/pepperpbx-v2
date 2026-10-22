import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './gateway.constants'
import { copyGateway as copyGatewayRequest, deleteGateways, fetchGateways, startStopGateways, toggleGateways } from './gateway.service'
import type { StartStopAction } from './gateway.service'
import type { Gateway } from './gateway.types'

/** Delay before a typed search value is committed to a fetch — matches Extensions' useExtensions.ts. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the gateways dataset and its pagination/search/domain-scope state — mirrors the shape
 * established by Extensions' useExtensions.ts (page/pageSize/showAll, a debounced search term,
 * server-style refetch on any of them changing), but is entirely Gateway-owned; nothing here
 * imports from or depends on the Extensions module.
 */
export const useGateways = () => {
  const [data, setData] = useState<Gateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  // searchInput reflects what's typed (for the controlled filter input); debouncedSearchTerm
  // is what's actually fetched with, so a fetch only fires once typing settles.
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const requestRef = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchTerm(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  // Reset to page 1 once the debounced term actually commits, not on every keystroke.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearchTerm])

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchGateways({ page, pageSize, showAll, search: debouncedSearchTerm })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load gateways.')
      // Matches the Axion reference's documented error recovery: clear stale data/counts and,
      // if the current page is now out of range, fall back to page 1 for the next attempt.
      setData([])
      setTotalRecords(0)
      if (page > 1) setPage(1)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [page, pageSize, showAll, debouncedSearchTerm])

  useEffect(() => {
    load()
  }, [load])

  /** Typing handler (GatewayFilters' onChange) — updates immediately; the debounce effect
   * above commits it to a fetch once typing settles. */
  const setSearchTerm = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  /** Enter/icon-click/clear in GatewayFilters — commits immediately, bypassing the debounce wait. */
  const commitSearch = useCallback((value: string) => {
    setSearchInput(value)
    setDebouncedSearchTerm(value)
  }, [])

  const setSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  // Matches the Axion reference: toggling Show All (either direction) also clears the search —
  // clearing searchInput here cancels any in-flight debounce timer too (the debounce effect's
  // cleanup fires when searchInput changes), so a stale typed value can't slip through afterward.
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    setSearchInput('')
    setDebouncedSearchTerm('')
    setPage(1)
  }, [])

  /** Reset icon: search, showAll, and page size all return to their defaults; page resets to 1. */
  const resetFilters = useCallback(() => {
    setSearchInput('')
    setDebouncedSearchTerm('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const refresh = useCallback(() => load(), [load])

  /** Used by both single-row (one-element array) and bulk delete. */
  const removeGateways = useCallback(async (gatewayUuids: string[]) => {
    await deleteGateways(gatewayUuids)
    await load()
  }, [load])

  /** Used by both the inline Enabled/Disabled pill (one-element array) and bulk Toggle. */
  const toggleGatewaysStatus = useCallback(async (gatewayUuids: string[]) => {
    await toggleGateways(gatewayUuids)
    await load()
  }, [load])

  /** Used by both the inline Gateway Action pill (one-element array) and bulk Start/Stop. */
  const startStopSelected = useCallback(async (gatewayUuids: string[], action: StartStopAction) => {
    await startStopGateways(gatewayUuids, action)
    await load()
  }, [load])

  /** Row action only — a simple UUID-based clone, no bulk equivalent (see gateway.service.ts). */
  const copyGateway = useCallback(async (gatewayUuid: string) => {
    const created = await copyGatewayRequest(gatewayUuid)
    await load()
    return created
  }, [load])

  return {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm: searchInput,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize: setSize,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh,
    removeGateways,
    toggleGatewaysStatus,
    startStopSelected,
    copyGateway,
  }
}

export default useGateways
