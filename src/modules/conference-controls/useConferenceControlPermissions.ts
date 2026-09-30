import usePermissions from '../../hooks/usePermissions'
import { conferenceControlPermissions } from './conference-control.constants'

/**
 * The shared `CONFERENCES_PERMISSION` view/add/edit/all model (conference-controls.md §14). RBAC is
 * foundation-only, so an empty store is treated as "everything granted" rather than hiding the
 * module for everyone — the same convention as every sibling conference module.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form
 * - Edit (`canManageAll || canEdit || canView`) → row Edit button / Edit page (view-only = read-only form, no Save)
 * - Status toggle, inline and bulk (`canManageAll || canEdit`)
 * There is no Delete or Show All in this module (§11/§15).
 */
const useConferenceControlPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(conferenceControlPermissions.all)
  const canAdd = canManageAll || hasPermission(conferenceControlPermissions.add)
  const canEdit = canManageAll || hasPermission(conferenceControlPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(conferenceControlPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useConferenceControlPermissions
