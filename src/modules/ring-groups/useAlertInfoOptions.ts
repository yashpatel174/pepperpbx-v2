import { useCallback, useEffect, useState } from 'react'
import { createAlertInfo, deleteAlertInfo, getAlertInfoOptions } from './ring-group.service'
import type { AlertInfoGroup } from './ring-group.types'

/**
 * Ringtone (Alert Info) options (ring-groups.md §12/§34.4): loaded once on mount, not domain-scoped.
 * A failed load leaves the list empty, as Axion's does. Create/delete go through the service and
 * re-fetch; their errors are left to the caller.
 */
export const useAlertInfoOptions = () => {
  const [groups, setGroups] = useState<AlertInfoGroup[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setGroups(await getAlertInfoOptions())
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (text: string) => {
      await createAlertInfo(text)
      await load()
    },
    [load]
  )

  const remove = useCallback(
    async (uuid: string) => {
      await deleteAlertInfo(uuid)
      await load()
    },
    [load]
  )

  return { groups, loading, create, remove }
}

export default useAlertInfoOptions
