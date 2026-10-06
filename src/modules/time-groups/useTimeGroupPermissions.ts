import usePermissions from '../../hooks/usePermissions'
import { timeGroupPermissions } from './time-group.constants'

/**
 * Axion's view/add/edit/all model with the module-admin `all` bypass (time-groups.md §14), on
 * PepperPBX's foundation-only RBAC: an empty permission store means "everything granted" rather
 * than hiding the module for everyone — the convention every module follows.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form
 * - Edit (`canManageAll || canEdit || canView`) → row Edit / Edit page; view-only = read-only form, no Save
 * - Copy (`canManageAll || canAdd`) — Axion's `canCopy` is wildcard + add
 * - Delete, row and bulk (`canManageAll`) — Axion has no separate delete key
 * - Show All (`canManageAll` + more than one wildcard domain) — Axion's `pbx_axiontech` bypass has
 *   no PepperPBX equivalent yet.
 */
const useTimeGroupPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(timeGroupPermissions.all)
  const canAdd = canManageAll || hasPermission(timeGroupPermissions.add)
  const canEdit = canManageAll || hasPermission(timeGroupPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(timeGroupPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useTimeGroupPermissions
