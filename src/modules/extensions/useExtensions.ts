import { useCallback, useEffect, useMemo, useState } from 'react'
import { getExtensions } from './extension.service'
import { searchableExtensionFields } from './extension.constants'
import type { Extension } from './extension.types'

const matchesSearch = (extension: Extension, term: string): boolean => {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  return searchableExtensionFields.some((field) => {
    const value = extension[field]
    return typeof value === 'string' && value.toLowerCase().includes(needle)
  })
}

/**
 * Owns the extensions dataset and its local CRUD-ish behavior (mock-backed for now).
 * ExtensionsPage stays composition-only; a future server-side search/pagination swap
 * only touches this hook and extension.service.ts.
 */
export const useExtensions = () => {
  const [data, setData] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getExtensions()
      setData(result)
    } catch {
      setError('Failed to load extensions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const removeExtension = useCallback((id: string) => {
    setData((prev) => prev.filter((extension) => extension.id !== id))
  }, [])

  const duplicateExtension = useCallback((id: string) => {
    setData((prev) => {
      const source = prev.find((extension) => extension.id === id)
      if (!source) return prev

      const usedNumbers = new Set(prev.map((extension) => extension.extension))
      let nextNumber = Number(source.extension) + 1
      while (usedNumbers.has(String(nextNumber))) nextNumber += 1

      const clone: Extension = {
        ...source,
        id: `ext-${nextNumber}-${Date.now()}`,
        extension: String(nextNumber),
        description: source.description ? `${source.description} (Copy)` : undefined,
      }
      return [...prev, clone]
    })
  }, [])

  const filteredData = useMemo(
    () => data.filter((extension) => matchesSearch(extension, searchTerm)),
    [data, searchTerm]
  )

  return {
    data,
    filteredData,
    loading,
    error,
    refresh: load,
    removeExtension,
    duplicateExtension,
    searchTerm,
    setSearchTerm,
  }
}

export default useExtensions
