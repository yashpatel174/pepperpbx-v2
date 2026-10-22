import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './ivr-menu.constants'
import { copyIVRMenu, deleteIVRMenus, getIVRMenus, toggleIVRMenus } from './ivr-menu.service'
import type { IVRMenu } from './ivr-menu.types'

interface ListQuery {
  page: number
  pageSize: number
  showAll: boolean
  search: string
}

const sameQuery = (a: ListQuery, b: ListQuery) =>
  a.page === b.page && a.pageSize === b.pageSize && a.showAll === b.showAll && a.search === b.search

/**
 * Same debounce as the Call Flows / Conferences lists. Axion has none — search only commits on
 * Enter/the search icon (ivr-menus.md §6) — so this is a PepperPBX addition on top of that:
 * Enter/icon/clear still commit immediately.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the IVR Menus list: paging, server-side search, Show All, row selection, and the
 * delete/toggle/copy mutations. Every mutation goes through ivr-menu.service.ts and is followed by
 * a re-fetch — the hook never edits `data` itself.
 *
 * Search: typing commits after SEARCH_DEBOUNCE_MS; Enter / the search icon / clear commit at once.
 * Either way a commit returns to page 1 (§3/§6).
 */
export const useIVRMenus = () => {
  const [data, setData] = useState<IVRMenu[]>([])
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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
      const result = await getIVRMenus({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      // An empty result ("No data found") arrives here as a normal empty page, not an error.
      setData(result.data)
      setTotalRecords(result.total_records)
      // Keep the last known domains when a response omits them, so Show All doesn't vanish mid-search.
      if (result.wildCardDomains) setWildCardDomains(result.wildCardDomains)
      // The service clamps an out-of-range page; follow it without a second request.
      if (result.page !== page) {
        syncedQueryRef.current = { page: result.page, pageSize, showAll, search: committedSearch }
        setPage(result.page)
      }
    } catch {
      // Only genuine failures reach here — the service resolves "No data found" as an empty page.
      if (requestId !== requestRef.current) return
      setError('Failed to load IVR menus.')
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
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  /** Enter / search icon / clear icon: commit the search immediately and go to page 1 (§3/§6). */
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

  /** Show All / Show Less: page 1 and the search cleared, as Axion does (§3 step 6). */
  const changeShowAll = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: search cleared, Show All off, page size back to the default, page 1 (§3/§6). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  /**
   * Delete, clear the selection (Axion's `setRowDeSelect(true)`, §3), then re-fetch. If the
   * deletion empties the current page, step back to the last page that still has rows — the page
   * change triggers the fetch.
   */
  const removeIVRMenus = useCallback(
    async (uuids: string[]) => {
      await deleteIVRMenus(uuids)
      setSelectedIds([])
      const remaining = Math.max(0, totalRecords - uuids.length)
      const lastPage = Math.max(1, Math.ceil(remaining / pageSize))
      if (page > lastPage) setPage(lastPage)
      else await load()
    },
    [load, page, pageSize, totalRecords]
  )

  /** Bulk Toggle: toggle, clear the selection, re-fetch (§3). */
  const toggleSelected = useCallback(
    async (uuids: string[]) => {
      await toggleIVRMenus(uuids)
      setSelectedIds([])
      await load()
    },
    [load]
  )

  /** Inline Status pill: toggle one row and re-fetch; an unrelated selection is left alone. */
  const toggleRow = useCallback(
    async (uuid: string) => {
      await toggleIVRMenus([uuid])
      await load()
    },
    [load]
  )

  /** Copy: create the copy, clear the selection, re-fetch (§3). */
  const duplicateIVRMenu = useCallback(
    async (sourceUuid: string, values: { name: string; extension: string }) => {
      await copyIVRMenu(sourceUuid, values)
      setSelectedIds([])
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
    selectedIds,
    setSelectedIds,
    clearSelection,
    removeIVRMenus,
    toggleSelected,
    toggleRow,
    duplicateIVRMenu,
  }
}

export default useIVRMenus
