import usePermissions from '../../hooks/usePermissions'
import { recordingPermissions } from './recordings.constants'

/**
 * Four-key gate matching the audit's model (recordings.md §14: view/add/edit plus a module-admin
 * `all` bypass). RBAC is foundation-only — the store starts empty — so an empty store is treated
 * as "everything granted" (`canManageAll`), the convention used by every module. The strings in
 * `recordingPermissions` are TODO placeholders, not a confirmed backend contract.
 */
const useRecordingPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(recordingPermissions.all)
  const canAdd = canManageAll || hasPermission(recordingPermissions.add)
  const canEdit = canManageAll || hasPermission(recordingPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(recordingPermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useRecordingPermissions
