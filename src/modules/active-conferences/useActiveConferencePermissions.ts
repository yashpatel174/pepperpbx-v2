import usePermissions from '../../hooks/usePermissions'
import { activeConferencePermissions } from './active-conferences.constants'

/**
 * Single-key gate mirroring Axion's `pbx_conference_admin` (active-conferences.md §14). RBAC is
 * foundation-only, so an empty store is treated as "everything granted" — the same convention as
 * every other module. UI-only: the backend remains the authorization boundary.
 *
 * `canShowAllByPermission` — TODO: Axion shows Show All for `pbx_axiontech` OR more than one
 * wildcard domain (§7). PepperPBX has no global-wildcard permission yet, so the empty-store
 * "everything granted" case stands in for `pbx_axiontech`; the wildcard-domain half is applied by
 * the list page from the list response.
 */
const useActiveConferencePermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canView = !permissionsActive || hasPermission(activeConferencePermissions.view)
  const canShowAllByPermission = !permissionsActive

  return { canView, canShowAllByPermission }
}

export default useActiveConferencePermissions
