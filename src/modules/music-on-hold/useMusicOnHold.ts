import { useCallback, useEffect, useRef, useState } from 'react'
import { searchDebounceMs } from './music-on-hold.constants'
import { deleteMohFile, fetchMusicOnHold, shuffleMusicOnHold } from './music-on-hold.service'
import type { DeleteMohFilePayload, MohGroup } from './music-on-hold.types'

/**
 * Owns the grouped Music On Hold list and its search / Show All state. The list is deliberately NOT
 * paginated: the audited endpoint takes no page params (music-on-hold.md §12/§28), so the full
 * grouped set loads at once and Ant Design's per-category tables scroll instead of paging. Every
 * mutation goes through the service and then re-fetches, so the list is never mutated locally.
 *
 * Search: typing updates the draft and a fetch is committed after `searchDebounceMs`; Enter, the
 * search icon and emptying the input commit immediately (music-on-hold.md §6).
 */
export const useMusicOnHold = () => {
  const [data, setData] = useState<MohGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const requestRef = useRef(0)
  const lastCommittedSearchRef = useRef('')

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchMusicOnHold({ showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load music on hold.')
      setData([])
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [showAll, committedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === lastCommittedSearchRef.current) return
      lastCommittedSearchRef.current = searchInput
      setCommittedSearch(searchInput)
    }, searchDebounceMs)
    return () => clearTimeout(handle)
  }, [searchInput])

  const setSearchTerm = useCallback((value: string) => setSearchInput(value), [])

  /** Enter / search icon / cleared input. An unchanged term re-runs the fetch directly, since no state change would. */
  const commitSearch = useCallback(
    (value: string) => {
      lastCommittedSearchRef.current = value
      setSearchInput(value)
      if (value === committedSearch) {
        void load()
        return
      }
      setCommittedSearch(value)
    },
    [committedSearch, load]
  )

  /** Show All / Show Less clears the search (same as the other list modules). */
  const setShowAllMode = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
  }, [])

  /** Reset icon: empty search, showAll=false (music-on-hold.md §6). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
  }, [])

  const refresh = useCallback(() => load(), [load])

  const removeFile = useCallback(
    async (payload: DeleteMohFilePayload) => {
      await deleteMohFile(payload)
      await load()
    },
    [load]
  )

  const shuffle = useCallback(
    async (categoryUuid: string) => {
      await shuffleMusicOnHold(categoryUuid)
      await load()
    },
    [load]
  )

  return {
    data,
    loading,
    error,
    showAll,
    searchTerm: searchInput,
    committedSearch,
    setSearchTerm,
    commitSearch,
    setShowAll: setShowAllMode,
    resetFilters,
    refresh,
    removeFile,
    shuffle,
  }
}

export default useMusicOnHold
