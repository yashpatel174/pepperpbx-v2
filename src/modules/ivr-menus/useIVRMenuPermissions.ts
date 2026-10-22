import usePermissions from '../../hooks/usePermissions'
import { ivrMenuPermissions } from './ivr-menu.constants'

/**
 * Axion's `IVRMENUS_PERMISSION` view/add/edit/all model (ivr-menus.md §14), on PepperPBX's
 * foundation-only RBAC: an empty permission store means "everything granted" rather than hiding
 * the module for everyone — the convention every module follows. The backend stays the real
 * authorization boundary.
 *
 * Where each flag applies once real permissions arrive (all per §14):
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add button / Add form (`canManageAll || canAdd`)
 * - row Edit (`canManageAll || canEdit || canView`); view-only = read-only form, no Save
 * - row Copy (`canCopy`: `pbx_admin` || `pbx_axiontech` || add; the module-admin bypass too)
 * - row Delete and bulk Delete (`canManageAll`)
 * - inline Status pill (`canManageAll || canEdit`)
 * - bulk Toggle (`canManageAll || canAdd`) — Axion's own rule, which differs from the pill's (§14). TODO: confirm with product.
 * - Show All (`canManageAll` and (`isAxionTech` or more than one wildcard domain), §14/§15)
 * - Advanced card (`canManageAll || canAdd || canEdit`, where Edit's canEdit is view-or-edit, §9/§25)
 */
const useIVRMenuPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(ivrMenuPermissions.all)
  const canAdd = canManageAll || hasPermission(ivrMenuPermissions.add)
  const canEdit = canManageAll || hasPermission(ivrMenuPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(ivrMenuPermissions.view)
  const hasAnyAccess = canAdd || canView
  // A real grant only — not the empty-store fallback — so Show All otherwise keeps its wildcard-domain rule.
  const isAxionTech = hasPermission(ivrMenuPermissions.axionTech)
  const canCopy = canAdd || isAxionTech || hasPermission(ivrMenuPermissions.admin)

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess, canCopy, isAxionTech }
}

export default useIVRMenuPermissions
