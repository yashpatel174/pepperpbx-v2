import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './extension.constants'
import {
  copyExtension as copyExtensionRequest,
  deleteExtensions as deleteExtensionsRequest,
  fetchExtensions,
  setExtensionEnabled,
  toggleExtensions as toggleExtensionsRequest,
} from './extension.service'
import type { Extension } from './extension.types'

/** Delay before a search input change is committed to a fetch, to avoid a request per keystroke. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the extensions dataset and its pagination/search state. The page, page size and
 * Show All flag live here (not inside Ant Design's table), so turning Show All on and off
 * never loses the user's pagination configuration — Show All is independent of page size.
 * ExtensionsPage stays composition-only; a future server-side swap only touches this hook
 * and extension.service.ts.
 */
export const useExtensions = () => {
  const [data, setData] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [showAll, setShowAll] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  // searchInput reflects what's typed (for the controlled filter input); debouncedSearchTerm
  // is what's actually fetched with, so a fetch only fires once typing settles.
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const requestRef = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchTerm(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  // Reset to page 1 once the debounced term actually commits, not on every keystroke.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearchTerm])

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchExtensions({ page, pageSize, showAll, search: debouncedSearchTerm })
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotalRecords(result.total_records)
    } catch {
      if (requestId !== requestRef.current) return
      setError('Failed to load extensions.')
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [page, pageSize, showAll, debouncedSearchTerm])

  useEffect(() => {
    load()
  }, [load])

  const setSearchTerm = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const setSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  const setShowAllMode = useCallback((value: boolean) => {
    setShowAll(value)
    setPage(1)
  }, [])

  /**
   * Bulk delete — used by both the single-row and multi-row Select Action delete flow (single
   * is just a one-element array). Goes through the real service and refetches on success rather
   * than patching `data` locally, so page/pageSize/search/showAll stay exactly as they were and
   * a subsequent refresh can never resurrect a "deleted" row (see CLAUDE.md's note on the old
   * local-only removeExtension this replaces).
   */
  const deleteExtensions = useCallback(async (extensionUuids: string[], deleteVoicemail: boolean) => {
    await deleteExtensionsRequest(extensionUuids, deleteVoicemail)
    await load()
  }, [load])

  /**
   * Bulk toggle — flips each targeted record's own current state (see extension.service.ts's
   * toggleExtensions) and refetches, rather than optimistically patching rows. The single-row
   * click keeps using toggleExtensionStatus below, unchanged.
   */
  const bulkToggle = useCallback(async (extensionUuids: string[]) => {
    await toggleExtensionsRequest(extensionUuids)
    await load()
  }, [load])

  /**
   * Flips the stored `enabled` flag through the service boundary (so a later refetch sees
   * the new value) and updates the visible row in place, keeping pagination position.
   */
  const toggleExtensionStatus = useCallback(async (id: string, enabled: boolean) => {
    await setExtensionEnabled(id, enabled)
    setData((prev) =>
      prev.map((extension) =>
        extension.id === id ? { ...extension, status: enabled ? 'enabled' : 'disabled' } : extension
      )
    )
  }, [])

  /**
   * Copy — the service creates the new record (see extension.service.ts's copyExtension) and the
   * list refetches, so the copy survives paging/search/Show All and is a real, editable record.
   */
  const copyExtension = useCallback(async (extensionUuid: string, newExtension: string) => {
    await copyExtensionRequest(extensionUuid, newExtension)
    await load()
  }, [load])

  /**
   * CSV export: returns every search-filtered record across ALL domains and pages (a page
   * size that can't be reached by the table's own pager), not just the currently visible page.
   */
  const getExportData = useCallback(async () => {
    const result = await fetchExtensions({
      showAll: true,
      search: debouncedSearchTerm,
      pageSize: Number.MAX_SAFE_INTEGER,
    })
    return result.data
  }, [debouncedSearchTerm])

  const refresh = useCallback(() => load(), [load])

  return {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm: searchInput,
    setSearchTerm,
    setPage,
    setPageSize: setSize,
    setShowAll: setShowAllMode,
    refresh,
    deleteExtensions,
    bulkToggle,
    toggleExtensionStatus,
    copyExtension,
    getExportData,
  }
}

export default useExtensions