import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultPageSize } from './voicemail.constants'
import { isNotFoundError } from '../../services/api/apiError'

interface PagedResult<T> {
  data: T[]
  page: number
  total_records: number
}

/**
 * Paging state shared by the Messages and Greetings lists (voicemail.md §23a/b: pagination only —
 * no search, no Show All). `fetcher` must be stable per mailbox (wrap it in useCallback). Like the
 * main list it follows a page the service clamped, so deleting the last rows of the last page
 * never leaves the user on an empty, invalid page.
 */
const useVoicemailChildList = <T>(fetcher: (page: number, pageSize: number) => Promise<PagedResult<T>>, errorMessage: string) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher(page, pageSize)
      if (requestId !== requestRef.current) return
      setData(result.data)
      setTotal(result.total_records)
      if (result.page !== page) setPage(result.page)
    } catch (err) {
      if (requestId !== requestRef.current) return
      setData([])
      setTotal(0)
      if (isNotFoundError(err)) setNotFound(true)
      else setError(errorMessage)
      if (page > 1) setPage(1)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [fetcher, page, pageSize, errorMessage])

  useEffect(() => {
    load()
  }, [load])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  return { data, loading, error, notFound, page, pageSize, total, setPage, setPageSize: changePageSize, refresh: load }
}

export default useVoicemailChildList
