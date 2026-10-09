import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './voicemail.constants'
import { deleteVoicemails, fetchVoicemails, toggleVoicemails, updateVoicemailFlags } from './voicemail.service'
import type { VoicemailFlagPatch } from './voicemail.service'
import type { Voicemail } from './voicemail.types'

/**
 * Owns the voicemail dataset and its pagination/search/domain-scope state. VoicemailsPage stays
 * composition-only; a future server-side swap only touches this hook and voicemail.service.ts.
 *
 * Search: typing updates the draft and a fetch is committed ~400ms after typing stops (the debounce
 * every PepperPBX list module uses). Enter, the search icon and clearing the input still commit
 * immediately (voicemail.md §4.2). Every mutation goes through the service and then re-fetches (voicemail.md §14/§7), so
 * the list is never mutated locally.
 */
const SEARCH_DEBOUNCE_MS = 400

export const useVoicemails = () => {
  const [data, setData] = useState<Voicemail[]>([])
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
      const result = await fetchVoicemails({ page, pageSize, showAll, search: committedSearch })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
      // Page drift: deleting the last rows of the last page leaves `page` past the end; the
      // service clamps it, so follow the clamped page instead of showing an empty table.
      if (result.page !== page) setPage(result.page)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load voicemails.')
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

  /** Typing handler — updates the draft; the debounce effect above commits it once typing settles. */
  const setSearchTerm = useCallback((value: string) => setSearchInput(value), [])

  /**
   * Enter / search icon / cleared input — commits the search and returns to page 1. An explicit
   * search always loads: when neither the term nor the page would change, no state update can
   * trigger the load effect, so it is invoked directly.
   */
  const commitSearch = useCallback(
    (value: string) => {
      lastCommittedSearchRef.current = value
      setSearchInput(value)
      if (value === committedSearch && page === 1) {
        void load()
        return
      }
      setCommittedSearch(value)
      setPage(1)
    },
    [committedSearch, page, load]
  )

  const setSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Show All / Show Less: page 1 and the search is cleared (voicemail.md §18). */
  const setShowAllMode = useCallback((value: boolean) => {
    lastCommittedSearchRef.current = ''
    setShowAll(value)
    setSearchInput('')
    setCommittedSearch('')
    setPage(1)
  }, [])

  /** Reset icon: page 1, empty search, showAll=false, pageSize=10 (voicemail.md §4.2). */
  const resetFilters = useCallback(() => {
    lastCommittedSearchRef.current = ''
    setSearchInput('')
    setCommittedSearch('')
    setShowAll(false)
    setPageSize(defaultPageSize)
    setPage(1)
  }, [])

  const refresh = useCallback(() => load(), [load])

  /** Single-row and bulk delete share one endpoint (voicemail.md §14). */
  const removeVoicemails = useCallback(
    async (voicemailUuids: string[]) => {
      await deleteVoicemails(voicemailUuids)
      await load()
    },
    [load]
  )

  /** Inline Status button (one uuid, no confirmation) and confirmed bulk Toggle (many) share one endpoint (voicemail.md §7). */
  const toggleVoicemailsStatus = useCallback(
    async (voicemailUuids: string[]) => {
      await toggleVoicemails(voicemailUuids)
      await load()
    },
    [load]
  )

  /** Inline Attached / Keep Local / Transcribe pills: persist through the service, then re-fetch. */
  const updateVoicemailFlag = useCallback(
    async (voicemailUuid: string, patch: VoicemailFlagPatch) => {
      await updateVoicemailFlags(voicemailUuid, patch)
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
    removeVoicemails,
    toggleVoicemailsStatus,
    updateVoicemailFlag,
  }
}

export default useVoicemails
