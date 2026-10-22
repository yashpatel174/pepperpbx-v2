import usePermissions from '../../hooks/usePermissions'
import { registrationPermissions } from './registrations.constants'

/**
 * Single-key gate mirroring Axion's `pbx_registrations` (registrations.md §14). RBAC is
 * foundation-only, so an empty store is treated as "everything granted" — the same convention as
 * every other module. UI-only: the backend remains the authorization boundary.
 *
 * UNRESOLVED PROJECT-WIDE RBAC DECISION: this is fail-open while the permission store is empty (no
 * code populates it yet), unlike Axion, which fails closed. Failing closed here alone would lock
 * every user out of a read-only page and diverge from all sibling modules; it should change
 * everywhere at once when the permission contract is confirmed. `registration.view` is a
 * placeholder, and view and Show All are kept as separate flags.
 *
 * `canShowAllByPermission` — TODO: Axion shows Show All for `pbx_axiontech` OR more than one
 * wildcard domain (§14). PepperPBX has no global-wildcard permission yet, so the empty-store
 * "everything granted" case stands in for `pbx_axiontech`; the wildcard-domain half is applied by
 * the list page from the list response.
 */
const useRegistrationPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canView = !permissionsActive || hasPermission(registrationPermissions.view)
  const canShowAllByPermission = !permissionsActive

  return { canView, canShowAllByPermission }
}

export default useRegistrationPermissions
