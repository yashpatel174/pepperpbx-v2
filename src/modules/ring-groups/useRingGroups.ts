import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './ring-group.constants'
import { copyRingGroup, deleteRingGroups, getRingGroups, toggleRingGroups } from './ring-group.service'
import type { RingGroup } from './ring-group.types'

/**
 * Same debounce as the sibling list hooks (useCallFlows.ts, useConferenceControls.ts). Axion has
 * none — search only commits on Enter/the search icon (ring-groups.md §3/§6) — so this is a
 * PepperPBX addition on top of that: Enter/icon/clear still commit immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Ring Groups list and its paging / search / Show All state. Every mutation goes through
 * ring-group.service.ts and is followed by a re-fetch; the hook never edits `data` itself.
 *
 * Search: typing commits after SEARCH_DEBOUNCE_MS; Enter / the search icon / clearing the box
 * commit at once. Either way a commit goes back to page 1 and keeps the page size — only Reset
 * returns to page size 10 (ring-groups.md §3).
 */
export const useRingGroups = () => {
  const [data, setData] = useState<RingGroup[]>([])
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

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await getRingGroups({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      const { data: rows, total_pages, total_records } = result.data
      setData(rows)
      setTotalRecords(total_records)
      setWildCardDomains(result.wildCardDomains)
      // The response carries no page (§12), so the requested page stays ours. If it is now past the
      // last page, step back to it — the page change re-fetches.
      if (total_records > 0 && page > total_pages) setPage(total_pages)
    } catch {
      if (requestId !== requestRef.current) return
      // Keep the current page; ErrorState's Retry re-requests it.
      setError('Failed to load ring groups.')
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
    load()
  }, [load])

  /** Enter / search icon / clear: commit immediately and go back to page 1; page size is kept (§3). */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPage(1)
  }, [])

  // Debounced commit while typing. One timer at most: the cleanup cancels the pending commit on
  // every keystroke and on unmount; the ref skips a value another path already committed.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /**
   * Typing handler. Emptying the box (backspacing it clear) commits straight away so the full list
   * comes back without waiting out the debounce; any other value waits for it.
   */
  const changeSearchInput = useCallback(
    (value: string) => {
      if (value === '' && lastCommittedSearchRef.current !== '') commitSearch('')
      else setSearchInput(value)
    },
    [commitSearch]
  )

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
   * that still has rows first — the page change itself triggers the fetch.
   */
  const removeRingGroups = useCallback(
    async (uuids: string[]) => {
      await deleteRingGroups(uuids)
      const remaining = Math.max(0, totalRecords - uuids.length)
      const lastPage = Math.max(1, Math.ceil(remaining / pageSize))
      if (page > lastPage) setPage(lastPage)
      else await load()
    },
    [load, page, pageSize, totalRecords]
  )

  const toggleRingGroupsEnabled = useCallback(
    async (uuids: string[]) => {
      await toggleRingGroups(uuids)
      await load()
    },
    [load]
  )

  const duplicateRingGroup = useCallback(
    async (sourceUuid: string, values: { name: string; extension: string }) => {
      await copyRingGroup(sourceUuid, values)
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
    removeRingGroups,
    toggleRingGroupsEnabled,
    duplicateRingGroup,
  }
}

export default useRingGroups
