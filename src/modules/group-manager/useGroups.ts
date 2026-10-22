import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './group-manager.constants'
import { deleteGroup, fetchGroups } from './group-manager.service'
import type { Group } from './group-manager.types'

const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the group list and its paging/search/scope state, same shape as the other modules' list
 * hooks (e.g. useCallBlocks). GroupManagerPage stays composition-only.
 */
export const useGroups = () => {
  const [data, setData] = useState<Group[]>([])
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
      const result = await fetchGroups({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      // Deleting the last row of the last page leaves it empty — step back instead of showing "no groups".
      if (result.data.length === 0 && result.total_records > 0 && page > 1) {
        setPage(Math.max(1, Math.ceil(result.total_records / pageSize)))
        return
      }
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load groups.')
      setData([])
      setTotalRecords(0)
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

  // Show All changes the record scope only: the search term and page size are kept (page resets,
  // since the dataset under it changed).
  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    setPage(1)
  }, [])

  /** Reset icon: search, Show All and page size return to their defaults and the page to 1. The domain store is not touched. */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const removeGroup = useCallback(
    async (groupId: string) => {
      await deleteGroup(groupId)
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
    setSearchTerm: setSearchInput,
    commitSearch,
    setPage,
    setPageSize: setSize,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh: load,
    removeGroup,
  }
}

export default useGroups
