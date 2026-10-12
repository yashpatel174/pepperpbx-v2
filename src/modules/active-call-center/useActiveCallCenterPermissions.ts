import usePermissions from '../../hooks/usePermissions'
import { activeCallCenterPermissions } from './active-call-center.constants'

/**
 * Single-key gate mirroring Axion's `pbx_callcenteractive_admin` (active-call-center.md §14): the
 * whole module or nothing — no per-action split. RBAC is foundation-only, so an empty store is
 * treated as "everything granted", the convention of every module. UI-only: the backend remains
 * the authorization boundary. The permission string is a TODO placeholder, not a confirmed contract.
 *
 * Unlike Axion (Activity had no gate, §14/§33 "Decide"), the Activity screen uses this gate too, so
 * a user denied the list cannot reach a queue's live data through a URL.
 *
 * `canShowAll` — TODO: Axion shows Show All for `pbx_axiontech` OR more than one wildcard domain
 * (§15). Neither signal exists here yet, so the empty-store case stands in for it.
 */
const useActiveCallCenterPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canView = !permissionsActive || hasPermission(activeCallCenterPermissions.view)
  const canShowAll = !permissionsActive

  return { canView, canShowAll }
}

export default useActiveCallCenterPermissions
