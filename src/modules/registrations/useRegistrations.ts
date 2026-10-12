import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRegistrations } from './registrations.service'
import { DEFAULT_PAGE_SIZE } from './registrations.constants'
import type { Registration } from './registrations.types'

/**
 * Axion has no debounce — search commits only on Enter/the search icon (registrations.md §6).
 * Typing here commits automatically this long after the last keystroke — the same 400ms every other
 * PepperPBX list hook uses (see useTimeGroups.ts, useVoicemails.ts); Enter/icon/clear still commit at once.
 */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Registrations list: server-side search + pagination and Show All (registrations.md §3/§6/§7).
 * `enabled` is false when the user lacks access — then nothing is fetched. Every query input lives in
 * state and one effect fetches on any change, so a state change never causes a second fetch (Axion's
 * reset icon fetched twice, §28). No polling, no sockets.
 */
export const useRegistrations = (enabled: boolean) => {
  const [data, setData] = useState<Registration[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [wildCardDomains, setWildCardDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAllState] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)
  /** Bumped to force a re-fetch when no query input changed (Reset on an untouched list, Retry). */
  const [reloadKey, setReloadKey] = useState(0)
  const requestRef = useRef(0)
  /** The last search value committed by any path — lets the debounce skip a value already committed. */
  const lastCommittedSearchRef = useRef('')

  useEffect(() => {
    if (!enabled) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    // True when this response is being discarded in favour of an immediate re-fetch of a valid page.
    let pageCorrected = false
    fetchRegistrations({ pageSize, pageNumber, search: committedSearch, showAll })
      .then((result) => {
        if (requestId !== requestRef.current) return
        // The requested page is past the end (e.g. rows disappeared) while records exist: jump to the
        // last page instead of showing an empty table. Only ever moves backwards, so it cannot loop.
        const lastPage = Math.max(1, Math.ceil(result.totalRecords / pageSize))
        if (result.data.length === 0 && result.totalRecords > 0 && lastPage < pageNumber) {
          pageCorrected = true
          setPageNumber(lastPage)
          return
        }
        setData(result.data)
        setTotalRecords(result.totalRecords)
        setWildCardDomains(result.wildCardDomains)
      })
      .catch(() => {
        if (requestId !== requestRef.current) return
        setError('Failed to load registrations.')
        setData([])
        setTotalRecords(0)
        // Don't leave domain metadata from an earlier, unrelated response applied after a failure.
        setWildCardDomains([])
      })
      .finally(() => {
        if (requestId === requestRef.current && !pageCorrected) setLoading(false)
      })
  }, [enabled, pageSize, pageNumber, committedSearch, showAll, reloadKey])

  /** Enter / search icon / clear — commits the search and returns to page 1 (§6). */
  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPageNumber(1)
  }, [])

  // Debounced commit while typing. The cleanup cancels the pending commit on every keystroke and on
  // unmount; the ref skips a value Enter/icon/clear/reset already committed, so no duplicate fetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPageNumber(1)
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

  /** Toggling Show All (either way) clears the search and returns to page 1 (§7). */
  const setShowAll = useCallback((value: boolean) => {
    setShowAllState(value)
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPageNumber(1)
  }, [])

  const setPageSize = useCallback((value: number) => {
    setPageSizeState(value)
    setPageNumber(1)
  }, [])

  /** Reset icon: clears the search, returns to page 1 and re-fetches once, keeping the Show All scope (§6). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setPageNumber(1)
    setReloadKey((key) => key + 1)
  }, [])

  const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

  return {
    data,
    totalRecords,
    loading,
    error,
    showAll,
    wildCardDomains,
    searchTerm: searchInput,
    /** True once a search is committed — separates "nothing registered" from "nothing matches". */
    hasSearch: committedSearch.trim() !== '',
    pageNumber,
    pageSize,
    setSearchTerm: changeSearchInput,
    commitSearch,
    setShowAll,
    setPageNumber,
    setPageSize,
    resetFilters,
    refresh,
  }
}

export default useRegistrations
