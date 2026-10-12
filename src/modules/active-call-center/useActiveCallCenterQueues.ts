import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './active-call-center.constants'
import { fetchActiveCallCenterQueues } from './active-call-center.service'
import type { ActiveCallCenterQueue } from './active-call-center.types'

/**
 * Typing commits a search this long after it settles — the debounce every PepperPBX list module
 * uses on top of Axion's Enter/icon-only commit (active-call-center.md §6). Enter, the search icon
 * and emptying the input still commit immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Queue List: server-side search, paging and Show All (active-call-center.md §3/§6/§7).
 * `enabled` is false when the user lacks access — then nothing is fetched. Single request per
 * state change; no polling and no realtime connection.
 */
export const useActiveCallCenterQueues = (enabled: boolean) => {
  const [data, setData] = useState<ActiveCallCenterQueue[]>([])
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
    if (!enabled) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchActiveCallCenterQueues({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      // The service clamps an out-of-range page; follow it instead of showing an empty page.
      if (result.page !== page) setPage(result.page)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load active call center queues.')
      setData([])
      setTotalRecords(0)
      if (page > 1) setPage(1)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [enabled, page, pageSize, showAll, committedSearch])

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

  /** Enter / search icon / cleared input: commits now. An unchanged term re-runs the fetch directly. */
  const commitSearch = useCallback(
    (value: string) => {
      lastCommittedSearchRef.current = value
      setSearchInput(value)
      if (value === committedSearch && page === 1) {
        void load()
        return
      }
      setCommittedSearch(value)
      setPage(1)
    },
    [committedSearch, page, load]
  )

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Show All / Show Less: page 1 and the search is cleared (§3). */
  const setShowAllMode = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: page 1, empty search, showAll=false, pageSize=10 (§3). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

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
    setSearchTerm: setSearchInput,
    commitSearch,
    setPage,
    setPageSize: changePageSize,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh: load,
  }
}

export default useActiveCallCenterQueues
