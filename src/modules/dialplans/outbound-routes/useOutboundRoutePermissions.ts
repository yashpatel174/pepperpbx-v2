import usePermissions from '../../../hooks/usePermissions'
import { outboundRoutePermission } from './outbound-route.constants'

/**
 * Single coarse permission gate, matching the audit's documented coarse module permission
 * (`pbx_outboundroutes`, outbound-routes.md §14) rather than a per-action split. RBAC is
 * foundation-only right now — the store starts empty and is populated from the backend later —
 * so an empty store is treated as "everything granted" rather than locking the module, matching
 * the convention already established for Extensions/Gateways/Destinations.
 *
 * INTENTIONAL FIX vs the Axion reference: this one gate covers Edit/Copy/Delete/Toggle alike —
 * the audit's separate Axion-only `onlyAxionTech` gate on the list's Edit button (hiding Edit from
 * ordinary permission holders even though the Edit route/API are reachable by URL) is deliberately
 * not reproduced; see outbound-route.constants.ts's outboundRoutePermission comment.
 */
const useOutboundRoutePermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0
  const canManage = !permissionsActive || hasPermission(outboundRoutePermission)

  return { canManage }
}

export default useOutboundRoutePermissions
