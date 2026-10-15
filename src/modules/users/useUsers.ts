import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './users.constants'
import { getUsers, setUserEnabled } from './users.service'
import type { User } from './users.types'

const SEARCH_DEBOUNCE_MS = 400

/**
 * Owns the user list and its paging/search/scope state, same shape as useGroups. UsersPage stays
 * composition-only.
 */
export const useUsers = () => {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)
  // Enabled toggles in flight (user id → the optimistic value). A list load that was already under way
  // when a toggle started can return the old value; load() re-applies these so it cannot undo the toggle.
  const pendingRef = useRef(new Map<string, boolean>())
  const [pendingIds, setPendingIds] = useState<string[]>([])

  const setPending = (userId: string, pending: boolean, value = false) => {
    if (pending) pendingRef.current.set(userId, value)
    else pendingRef.current.delete(userId)
    setPendingIds([...pendingRef.current.keys()])
  }
  const lastCommittedSearchRef = useRef('')

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await getUsers({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      if (result.data.length === 0 && result.total_records > 0 && page > 1) {
        setPage(Math.max(1, Math.ceil(result.total_records / pageSize)))
        return
      }
      setData(result.data.map((u) => (pendingRef.current.has(u.user_uuid) ? { ...u, enabled: pendingRef.current.get(u.user_uuid) ?? u.enabled } : u)))
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load users.')
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

  const patchEnabled = (userId: string, enabled: boolean) =>
    setData((rows) => rows.map((u) => (u.user_uuid === userId ? { ...u, enabled } : u)))

  /**
   * Flips a user's Enabled flag immediately, then saves it. Ignored while that user's update is
   * pending; on failure the previous value is restored and the error is rethrown for the page to report.
   */
  const toggleEnabled = useCallback(async (user: User) => {
    if (pendingRef.current.has(user.user_uuid)) return
    const next = !user.enabled
    setPending(user.user_uuid, true, next)
    patchEnabled(user.user_uuid, next)
    try {
      await setUserEnabled(user.user_uuid, next)
    } catch (err) {
      patchEnabled(user.user_uuid, user.enabled)
      throw err
    } finally {
      setPending(user.user_uuid, false)
    }
  }, [])

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
    pendingIds,
    toggleEnabled,
  }
}

export default useUsers
