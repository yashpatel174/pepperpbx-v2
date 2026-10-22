import usePermissions from '../../hooks/usePermissions'
import { timeConditionPermissions } from './time-condition.constants'

/**
 * Axion's view/add/edit/all model with the module-admin `all` bypass (time-conditions.md §14), on
 * PepperPBX's foundation-only RBAC: an empty permission store means "everything granted" rather
 * than hiding the module for everyone — the convention every module follows.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form; never `view` alone (§28)
 * - Edit (`canManageAll || canEdit || canView`) → row Edit / Edit page; view-only = read-only form, no Save
 * - Delete, row and bulk (`canManageAll`) — Axion has no separate delete key
 * - Status pill (`canManageAll || canEdit`)
 * - Show All (`canManageAll` + more than one wildcard domain) — Axion's `pbx_axiontech` bypass has
 *   no PepperPBX equivalent yet.
 *
 * Axion also checks per-row privileges (`original[pbx_timeconditions_*]`, §14); PepperPBX applies
 * the module-level flags to every row until the backend confirms that per-row contract.
 */
const useTimeConditionPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(timeConditionPermissions.all)
  const canAdd = canManageAll || hasPermission(timeConditionPermissions.add)
  const canEdit = canManageAll || hasPermission(timeConditionPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(timeConditionPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useTimeConditionPermissions
