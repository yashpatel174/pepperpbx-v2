import usePermissions from '../../hooks/usePermissions'
import { ringGroupPermissions } from './ring-group.constants'

/**
 * Axion's `RINGGROUPS_PERMISSION` view/add/edit/all model (ring-groups.md §14), on PepperPBX's
 * foundation-only RBAC: an empty permission store means "everything granted" rather than hiding
 * the module for everyone — the convention every module follows.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form; Copy too (§14 `addPermission`)
 * - Edit (`canManageAll || canEdit || canView`) → row Edit / Edit page; view-only = read-only form, no Save
 * - Delete, row and bulk (`canManageAll`) — Axion has no separate delete key
 * - Status pill (`canManageAll || canEdit`)
 * - Bulk Toggle (`canManageAll || canAdd`) — Axion disables it only when both are false (§14)
 * - Show All is not permission-gated here: Axion shows it for `pbx_axiontech` or more than one
 *   wildcard domain (§15), and `pbx_axiontech` has no PepperPBX equivalent yet.
 *
 * Axion reads the row-level Edit/Status permissions from each record (§14 inconsistency); PepperPBX
 * normalizes them to these page-level flags. TODO: revisit if the backend keeps per-row keys.
 */
const useRingGroupPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(ringGroupPermissions.all)
  const canAdd = canManageAll || hasPermission(ringGroupPermissions.add)
  const canEdit = canManageAll || hasPermission(ringGroupPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(ringGroupPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useRingGroupPermissions
