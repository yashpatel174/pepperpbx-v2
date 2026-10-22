import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './call-flows.constants'
import { copyCallFlow, deleteCallFlows, getCallFlows, toggleCallFlows } from './call-flows.service'
import type { CallFlow, CallFlowToggleKey } from './call-flows.types'

interface ListQuery {
  page: number
  pageSize: number
  showAll: boolean
  search: string
}

const sameQuery = (a: ListQuery, b: ListQuery) =>
  a.page === b.page && a.pageSize === b.pageSize && a.showAll === b.showAll && a.search === b.search

/**
 * Same debounce as the Conferences list (useConferences.ts). Axion has none — search only commits
 * on Enter/the search icon (call-flows.md §6) — so this is a PepperPBX addition on top of that:
 * Enter/icon/clear still commit immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Call Flows list and its paging / search / Show All state. Every mutation goes through
 * call-flows.service.ts and is followed by a re-fetch; the hook never edits `data` itself.
 *
 * Search: typing commits after SEARCH_DEBOUNCE_MS; Enter / the search icon / clear commit at once.
 * Either way a commit goes back to page 1 with page size 10 (call-flows.md §3/§6).
 */
export const useCallFlows = () => {
  const [data, setData] = useState<CallFlow[]>([])
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
      const result = await getCallFlows({ page, pageSize, showAll, search: committedSearch })
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
      setError('Failed to load call flows.')
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

  // Debounced commit while typing. The cleanup cancels the pending commit on every keystroke and on
  // unmount; the ref skips a value Enter/icon/clear/reset already committed, so no duplicate fetch.
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

  /** Enter / search icon / clear icon: commit immediately, page 1, page size 10 (§3/§6). */
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

  /** Show All / Show Less: page 1, search kept (§3). */
  const changeShowAll = useCallback((value: boolean) => {
    setShowAll(value)
    setPage(1)
  }, [])

  /** Reset icon: search cleared, Show All off, page size 10, page 1 (§3/§6). */
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
   * that still has rows first (Axion stays on the empty page, §28) — the page change itself
   * triggers the fetch. The service's page clamp is a second safety net.
   */
  const removeCallFlows = useCallback(
    async (uuids: string[]) => {
      await deleteCallFlows(uuids)
      const remaining = Math.max(0, totalRecords - uuids.length)
      const lastPage = Math.max(1, Math.ceil(remaining / pageSize))
      if (page > lastPage) setPage(lastPage)
      else await load()
    },
    [load, page, pageSize, totalRecords]
  )

  const toggleCallFlowsKey = useCallback(
    async (uuids: string[], toggleKey: CallFlowToggleKey) => {
      await toggleCallFlows(uuids, toggleKey)
      await load()
    },
    [load]
  )

  const duplicateCallFlow = useCallback(
    async (sourceUuid: string, values: { name: string; extension: string; featureCode: string }) => {
      await copyCallFlow(sourceUuid, values)
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
    setSearchTerm: setSearchInput,
    commitSearch,
    setPage,
    setPageSize: changePageSize,
    setShowAll: changeShowAll,
    resetFilters,
    refresh: load,
    removeCallFlows,
    toggleCallFlowsKey,
    duplicateCallFlow,
  }
}

export default useCallFlows
