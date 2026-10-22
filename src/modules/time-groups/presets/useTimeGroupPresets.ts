import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from '../time-group.constants'
import {
  copyTimeGroupPreset,
  deleteTimeGroupPresets,
  getTimeGroupPresets,
  toggleTimeGroupPresets,
} from './time-group-preset.service'
import type { TimeGroupPreset } from './time-group-preset.types'

interface ListQuery {
  page: number
  pageSize: number
  showAll: boolean
  search: string
}

const sameQuery = (a: ListQuery, b: ListQuery) =>
  a.page === b.page && a.pageSize === b.pageSize && a.showAll === b.showAll && a.search === b.search

/** Same debounce as the Time Groups list (Axion commits search only on Enter/icon). */
const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the Presets list and its paging / search / Show All state — the same behaviour as
 * `useTimeGroups` (Axion's presets `index.js` is a copy of the Time Group list container). Every
 * mutation goes through time-group-preset.service.ts and is followed by a re-fetch.
 */
export const useTimeGroupPresets = () => {
  const [data, setData] = useState<TimeGroupPreset[]>([])
  const [loading, setLoading] = useState(true)
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
  const lastCommittedSearchRef = useRef('')
  const syncedQueryRef = useRef<ListQuery | null>(null)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await getTimeGroupPresets({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      setWildCardDomains(result.wildCardDomains)
      if (result.page !== page) {
        syncedQueryRef.current = { page: result.page, pageSize, showAll, search: committedSearch }
        setPage(result.page)
      }
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load presets.')
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
    const synced = syncedQueryRef.current
    syncedQueryRef.current = null
    if (synced && sameQuery(synced, { page, pageSize, showAll, search: committedSearch })) return
    load()
  }, [load, page, pageSize, showAll, committedSearch])

  const commitSearch = useCallback((value: string) => {
    lastCommittedSearchRef.current = value
    setSearchInput(value)
    setCommittedSearch(value)
    setPage(1)
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

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

  /** Show All / Show Less: page 1 and the search cleared. */
  const changeShowAll = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(value)
    setPage(1)
  }, [])

  /** Reset icon: search cleared, Show All off, page size 10, page 1. */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const removePresets = useCallback(
    async (uuids: string[]) => {
      await deleteTimeGroupPresets(uuids)
      const remaining = Math.max(0, totalRecords - uuids.length)
      const lastPage = Math.max(1, Math.ceil(remaining / pageSize))
      if (page > lastPage) setPage(lastPage)
      else await load()
    },
    [load, page, pageSize, totalRecords]
  )

  /** Row Status pill (one uuid) and bulk Toggle (many). */
  const togglePresets = useCallback(
    async (uuids: string[]) => {
      await toggleTimeGroupPresets(uuids)
      await load()
    },
    [load]
  )

  const duplicatePreset = useCallback(
    async (sourceUuid: string, name: string) => {
      await copyTimeGroupPreset(sourceUuid, name)
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
    removePresets,
    togglePresets,
    duplicatePreset,
  }
}

export default useTimeGroupPresets
