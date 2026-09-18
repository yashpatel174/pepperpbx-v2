import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './announcement.constants'
import { deleteAnnouncements, fetchAnnouncements, toggleAnnouncements } from './announcement.service'
import type { Announcement } from './announcement.types'

/**
 * The Axion reference itself has no debounce at the list level — search only commits on
 * Enter/the search icon (announcements.md §3 item 5/§6/§28) — this is a deliberate PepperPBX
 * addition on top of that documented behavior, not a replacement for it: commitSearch
 * (Enter/icon-click) still commits immediately, matching every other module's identical pattern.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the announcements dataset and its pagination/search/domain-scope state — mirrors the shape
 * established by Outbound Routes'/Destinations' own list hooks. AnnouncementsPage stays
 * composition-only; a future server-side swap only touches this hook and announcement.service.ts.
 */
export const useAnnouncements = () => {
  const [data, setData] = useState<Announcement[]>([])
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
      const result = await fetchAnnouncements({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load announcements.')
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

  /** Typing handler (AnnouncementFilters' onChange) — always updates immediately; the debounce
   * effect above commits it to a fetch once typing settles. */
  const setSearchTerm = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  /** Enter/icon-click/clear — commits immediately, bypassing the debounce wait. */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPage(1)
  }, [])

  const setSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  // Matches the Axion reference: toggling Show All (either direction) also clears the search.
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: search, showAll, and page size all return to their defaults; page resets to 1 — matches announcements.md §3/§6/§7. */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const refresh = useCallback(() => load(), [load])

  /** Used by both single-row (one-element array) and bulk delete. */
  const removeAnnouncements = useCallback(
    async (phraseUuids: string[]) => {
      await deleteAnnouncements(phraseUuids)
      await load()
    },
    [load]
  )

  /** Used by both the inline row Status pill (one-element array, no confirmation) and the bulk Toggle popup (many, confirmed). */
  const toggleAnnouncementsStatus = useCallback(
    async (phraseUuids: string[]) => {
      await toggleAnnouncements(phraseUuids)
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
    removeAnnouncements,
    toggleAnnouncementsStatus,
  }
}

export default useAnnouncements
