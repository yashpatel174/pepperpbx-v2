import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './time-condition.constants'
import { deleteTimeConditions, getTimeConditions, toggleTimeConditions } from './time-condition.service'
import type { TimeCondition } from './time-condition.types'

interface ListQuery {
  page: number
  pageSize: number
  showAll: boolean
  search: string
}

const sameQuery = (a: ListQuery, b: ListQuery) =>
  a.page === b.page && a.pageSize === b.pageSize && a.showAll === b.showAll && a.search === b.search

/**
 * PepperPBX improvement over Axion: Axion's list search commits only on Enter/the search icon and
 * never debounces (time-conditions.md §3/§6). Here typing commits automatically SEARCH_DEBOUNCE_MS
 * after the last keystroke — same value as every sibling list — while Enter/icon/clear still
 * commit immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Time Conditions list and its paging / search / Show All state. Every mutation goes through
 * time-condition.service.ts and is followed by a re-fetch; the hook never edits `data` itself.
 *
 * - Search commit (typed + debounced, or Enter/icon/clear): page 1 (§3 step 5).
 * - Show All / Show Less: page 1, search cleared (§3 step 6).
 * - Reset: search cleared, Show All off, page size 10, page 1 (§3 step 7).
 * - Only the latest request may update the list, so a slow response for an older search never wins.
 */
export const useTimeConditions = () => {
  const [data, setData] = useState<TimeCondition[]>([])
  const [loading, setLoading] = useState(true)
  /** False until the first list request settles. */
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [wildCardDomains, setWildCardDomains] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)
  /** The last search value committed by any path — lets the debounce skip a value already committed. */
  const lastCommittedSearchRef = useRef('')
  /** A query a response already returned data for after the service corrected its page — not refetched. */
  const syncedQueryRef = useRef<ListQuery | null>(null)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await getTimeConditions({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      setWildCardDomains(result.wildCardDomains)
      // The service clamps an out-of-range page; follow it without a second request.
      if (result.page !== page) {
        syncedQueryRef.current = { page: result.page, pageSize, showAll, search: committedSearch }
        setPage(result.page)
      }
    } catch {
      if (requestId !== requestRef.current) return
      // Keep the current page; ErrorState's Retry re-requests it.
      setError('Failed to load time conditions.')
      setData([])
      setTotalRecords(0)
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setInitialized(true)
      }
    }
  }, [page, pageSize, showAll, committedSearch])

  useEffect(() => {
    // Consumed on every run, so a stale mark can never skip a later, genuine change.
    const synced = syncedQueryRef.current
    syncedQueryRef.current = null
    if (synced && sameQuery(synced, { page, pageSize, showAll, search: committedSearch })) return
    load()
  }, [load, page, pageSize, showAll, committedSearch])

  /** Commits a search value at once: page 1 (§3 step 5). */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPage(1)
  }, [])

  // Debounced commit while typing. The cleanup cancels the pending commit on every keystroke and on
  // unmount; the ref skips a value Enter/icon/clear/reset already committed, so no duplicate fetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /** Typing handler — the input updates immediately; emptying it commits at once (no wait for the unfiltered list). */
  const changeSearchInput = useCallback(
    (value: string) => {
      if (value === '') commitSearch('')
      else setSearchInput(value)
    },
    [commitSearch]
  )

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Show All / Show Less: page 1 and the search cleared, as Axion does (§3 step 6). */
  const changeShowAll = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(value)
    setPage(1)
  }, [])

  /** Reset icon: search cleared, Show All off, page size 10, page 1 (§3 step 7). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  /**
   * Delete, then re-fetch. If the deletion empties the current page, step back to the last page
   * that still has rows first — the page change itself triggers the fetch. The service's page
   * clamp is a second safety net.
   */
  const removeTimeConditions = useCallback(
    async (uuids: string[]) => {
      await deleteTimeConditions(uuids)
      const remaining = Math.max(0, totalRecords - uuids.length)
      const lastPage = Math.max(1, Math.ceil(remaining / pageSize))
      if (page > lastPage) setPage(lastPage)
      else await load()
    },
    [load, page, pageSize, totalRecords]
  )

  /** Row Status pill: toggle one record, then re-fetch (§3 Toggle). */
  const toggleTimeCondition = useCallback(
    async (uuid: string) => {
      await toggleTimeConditions([uuid])
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
    wildCardDomains,
    page,
    pageSize,
    showAll,
    searchTerm: searchInput,
    committedSearch,
    setSearchTerm: changeSearchInput,
    commitSearch,
    setPage,
    setPageSize: changePageSize,
    setShowAll: changeShowAll,
    resetFilters,
    refresh: load,
    removeTimeConditions,
    toggleTimeCondition,
  }
}

export default useTimeConditions
