import usePermissions from '../../hooks/usePermissions'
import { mohPermissions } from './music-on-hold.constants'

/**
 * Four-key gate matching the audit's model (music-on-hold.md §14: view/add/edit plus a module-admin
 * `all` bypass). Module access (`hasAnyAccess`) is kept separate from the per-action flags. RBAC is
 * foundation-only — the store starts empty — so an empty store is treated as "everything granted"
 * (`canManageAll`), the convention used by every module. The strings in `mohPermissions` are TODO
 * placeholders, not a confirmed backend contract.
 */
const useMusicOnHoldPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(mohPermissions.all)
  const canAdd = canManageAll || hasPermission(mohPermissions.add)
  const canEdit = canManageAll || hasPermission(mohPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(mohPermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useMusicOnHoldPermissions
