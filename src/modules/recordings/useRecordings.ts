import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './recordings.constants'
import { deleteRecordings, fetchRecordings } from './recordings.service'
import type { Recording } from './recordings.types'

/**
 * Owns the recordings dataset and its pagination/search/Show All state. RecordingsPage stays
 * composition-only; a future server-side swap only touches this hook and recordings.service.ts.
 *
 * Search: typing updates the draft immediately and a fetch is committed 400ms after typing stops
 * (the debounce every PepperPBX list module uses). Enter, the search icon and emptying the input
 * still commit immediately (recordings.md §6). Every mutation goes through the service and then
 * re-fetches, so the list is never mutated locally.
 */
const SEARCH_DEBOUNCE_MS = 400

export const useRecordings = () => {
  const [data, setData] = useState<Recording[]>([])
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
      const result = await fetchRecordings({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      // Page drift: deleting the last rows of the last page leaves `page` past the end; the
      // service clamps it, so follow the clamped page instead of showing an empty table.
      if (result.page !== page) setPage(result.page)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load recordings.')
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

  /** Typing handler — updates the draft; the debounce effect above commits it once typing settles. */
  const setSearchTerm = useCallback((value: string) => setSearchInput(value), [])

  /**
   * Enter / search icon / cleared input — commits the search and returns to page 1. An explicit
   * search always loads: when neither the term nor the page would change, no state update can
   * trigger the load effect, so it is invoked directly.
   */
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

  const setSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Show All / Show Less: page 1 and the search is cleared (recordings.md §3). */
  const setShowAllMode = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: page 1, empty search, showAll=false, pageSize=10 (recordings.md §3). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const refresh = useCallback(() => load(), [load])

  /** Single-row and bulk delete share one endpoint (recordings.md §11). */
  const removeRecordings = useCallback(
    async (recordingUuids: string[]) => {
      await deleteRecordings(recordingUuids)
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
    removeRecordings,
  }
}

export default useRecordings
