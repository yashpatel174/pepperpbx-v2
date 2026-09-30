import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './conference-control.constants'
import { getConferenceControls, toggleConferenceControls } from './conference-control.service'
import type { ConferenceControl } from './conference-control.types'

/**
 * Same debounce as the sibling conference list hooks (see useConferenceRooms.ts). The Axion
 * reference has none — search only commits on Enter/the search icon (conference-controls.md §3/§6)
 * — so this is a PepperPBX addition on top of that: commitSearch (Enter/icon/clear) still commits
 * immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Conference Controls list and its paging/search state. Every mutation goes through the
 * service and then re-fetches; the hook never edits `data` itself. There is no Show All / domain
 * scope for this module (§7/§15).
 */
export const useConferenceControls = () => {
  const [data, setData] = useState<ConferenceControl[]>([])
  const [loading, setLoading] = useState(true)
  /** False until the first list request settles. */
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
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
      const result = await getConferenceControls({ page, pageSize, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      // The service clamps an out-of-range page — follow it so the pager never points past the end.
      if (result.page !== page) setPage(result.page)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load conference controls.')
      setData([])
      setTotalRecords(0)
      if (page > 1) setPage(1)
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setInitialized(true)
      }
    }
  }, [page, pageSize, committedSearch])

  useEffect(() => {
    load()
  }, [load])

  // Debounced commit while typing. The cleanup cancels the pending commit on every keystroke and on
  // unmount; the ref skips a commit Enter/icon/clear/reset already made, so no duplicate fetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPageSize(defaultPageSize)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /**
   * Enter / search icon / clear icon — commits the search immediately, bypassing the debounce wait,
   * back to page 1 with the default page size, exactly as Axion's commit does
   * (`setPageNumber(1)` + `setPageSize(10)`, §3).
   */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Reset icon: clears search, page size back to default, page 1 (§3/§6). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const toggleConferenceControlsStatus = useCallback(
    async (uuids: string[]) => {
      await toggleConferenceControls({ conference_control_uuids: uuids })
      await load()
    },
    [load]
  )

  return {
    data,
    loading,
    initialized,
    error,
    totalRecords,
    page,
    pageSize,
    searchTerm: searchInput,
    committedSearch,
    setSearchTerm: setSearchInput,
    commitSearch,
    setPage,
    setPageSize: changePageSize,
    resetFilters,
    refresh: load,
    toggleConferenceControlsStatus,
  }
}

export default useConferenceControls
