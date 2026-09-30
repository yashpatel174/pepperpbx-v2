import usePermissions from '../../hooks/usePermissions'
import { callFlowPermissions } from './call-flows.constants'

/**
 * Axion's `CALLFLOWS_PERMISSION` view/add/edit/all model (call-flows.md §14), on PepperPBX's
 * foundation-only RBAC: an empty permission store means "everything granted" rather than hiding
 * the module for everyone — the convention every module follows.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form
 * - Edit (`canManageAll || canEdit || canView`) → row Edit / Edit page; view-only = read-only form, no Save
 * - Copy (`canManageAll || canAdd`)
 * - Delete, row and bulk (`canManageAll`) — Axion has no separate delete key
 * - Toggle, row badges AND bulk (`canManageAll || canEdit`). Axion lets add-only users bulk-toggle
 *   (§14/§28); PepperPBX applies the row rule to both. TODO: confirm with product.
 * - Show All (`canManageAll` + more than one wildcard domain) — Axion's `pbx_axiontech` bypass has
 *   no PepperPBX equivalent yet.
 */
const useCallFlowPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(callFlowPermissions.all)
  const canAdd = canManageAll || hasPermission(callFlowPermissions.add)
  const canEdit = canManageAll || hasPermission(callFlowPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(callFlowPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useCallFlowPermissions
