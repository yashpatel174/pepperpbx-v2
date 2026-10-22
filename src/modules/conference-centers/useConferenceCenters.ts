import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './conference-center.constants'
import { deleteConferenceCenters, getConferenceCenters, toggleConferenceCenters } from './conference-center.service'
import type { ConferenceCenter } from './conference-center.types'

/**
 * Same debounce as every other module's list hook (see useConferences.ts). The Axion reference has
 * none — search only commits on Enter/the search icon (conference-centers.md §6) — so this is a
 * PepperPBX addition on top of that: commitSearch (Enter/icon/clear) still commits immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Conference Centers list and its paging/search/domain-scope state. Every mutation goes
 * through the service and then re-fetches; the hook never edits `data` itself.
 */
export const useConferenceCenters = () => {
  const [data, setData] = useState<ConferenceCenter[]>([])
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
      const result = await getConferenceCenters({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      // The service clamps an out-of-range page (e.g. after deleting the last rows of the last
      // page) — follow it so the pager never points at a page that no longer exists.
      if (result.page !== page) setPage(result.page)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load conference centers.')
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

  /** Typing handler — updates the input immediately; the debounce effect above commits it. */
  const setSearchTerm = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  /** Enter / search icon / clear icon — commits immediately, bypassing the debounce wait. */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPage(1)
  }, [])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Show All / Show Less: resets page and clears search (conference-centers.md §3). */
  const changeShowAll = useCallback((value: boolean) => {
    setShowAll(value)
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: search, Show All and page size back to defaults, page 1 (conference-centers.md §6). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const removeConferenceCenters = useCallback(
    async (uuids: string[]) => {
      await deleteConferenceCenters({ conference_center_uuids: uuids })
      await load()
    },
    [load]
  )

  const toggleConferenceCentersStatus = useCallback(
    async (uuids: string[]) => {
      await toggleConferenceCenters({ conference_center_uuids: uuids })
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
    setPageSize: changePageSize,
    setShowAll: changeShowAll,
    resetFilters,
    refresh: load,
    removeConferenceCenters,
    toggleConferenceCentersStatus,
  }
}

export default useConferenceCenters
