import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './conference-profile.constants'
import { getConferenceProfiles, toggleConferenceProfiles } from './conference-profile.service'
import type { ConferenceProfile } from './conference-profile.types'

/**
 * Owns the Conference Profiles list and its paging/search state. Every mutation goes through the
 * service and then re-fetches; the hook never edits `data` itself. There is no Show All / domain
 * scope for this module (§7/§15).
 *
 * Search follows the audit exactly: no debounce — typing only edits the draft, and the server-side
 * search is committed by Enter / the search icon (conference-profiles.md §3/§6).
 */
export const useConferenceProfiles = () => {
  const [data, setData] = useState<ConferenceProfile[]>([])
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
  /** Params a response already returned data for after the service corrected its page — not refetched. */
  const syncedParamsRef = useRef<{ page: number; pageSize: number; search: string } | null>(null)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await getConferenceProfiles({ page, pageSize, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      // The service clamps an out-of-range page — follow it so the pager never points past the end.
      // This response already holds that page's data, so the page sync must not trigger a refetch.
      if (result.page !== page) {
        syncedParamsRef.current = { page: result.page, pageSize, search: committedSearch }
        setPage(result.page)
      }
    } catch {
      if (requestId !== requestRef.current) return
      // Keep the current page: ErrorState's Retry re-requests it rather than an automatic page-1 refetch.
      setError('Failed to load conference profiles.')
      setData([])
      setTotalRecords(0)
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setInitialized(true)
      }
    }
  }, [page, pageSize, committedSearch])

  useEffect(() => {
    // Consumed on every run, so a stale mark can never skip a later, genuine change.
    const synced = syncedParamsRef.current
    syncedParamsRef.current = null
    if (synced && synced.page === page && synced.pageSize === pageSize && synced.search === committedSearch) return
    load()
  }, [load, page, pageSize, committedSearch])

  /**
   * Enter / search icon / clear icon — commits the search back to page 1 with the default page
   * size, exactly as Axion's commit does (`setPageNumber(1)` + `setPageSize(10)`, §3).
   */
  const commitSearch = useCallback((value: string) => {
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
    setSearchInput('')
    setCommittedSearch('')
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const toggleConferenceProfilesStatus = useCallback(
    async (uuids: string[]) => {
      await toggleConferenceProfiles({ conference_profile_uuids: uuids })
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
    toggleConferenceProfilesStatus,
  }
}

export default useConferenceProfiles
