import usePermissions from '../../../hooks/usePermissions'
import { destinationFreeTextPermissions, destinationPermission } from './destination.constants'

/**
 * Single coarse permission gate, matching the Axion reference's documented coarse module-admin
 * model (`pbx_destinations_admin`, see destinations.md §14) rather than a per-action split.
 * RBAC is foundation-only right now — the store starts empty and is populated from the backend
 * later — so an empty store is treated as "everything granted" rather than locking the module,
 * matching the convention already established for Extensions/Gateways.
 */
const useDestinationPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0
  const canManage = !permissionsActive || hasPermission(destinationPermission)
  // Select ↔ free-text toggle on Actions / Alternate Actions / Hold Music.
  const canUseFreeText = !permissionsActive || destinationFreeTextPermissions.some((key) => hasPermission(key))

  return { canManage, canUseFreeText }
}

export default useDestinationPermissions
