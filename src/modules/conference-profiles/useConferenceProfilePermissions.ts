import usePermissions from '../../hooks/usePermissions'
import { conferenceProfilePermissions } from './conference-profile.constants'

/**
 * The shared `CONFERENCES_PERMISSION` view/add/edit/all model (conference-profiles.md §14). RBAC is
 * foundation-only, so an empty store is treated as "everything granted" rather than hiding the
 * module for everyone — the same convention as every sibling conference module.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form
 * - Edit (`canManageAll || canEdit || canView`) → row Edit button / Edit page (view-only = read-only form, no Save)
 * - inline Status toggle (`canManageAll || canEdit`)
 * - bulk Toggle (`canManageAll || canAdd`) — Axion's own rule (§21); see ConferenceProfilesPage
 * There is no Delete, Copy or Show All in this module (§11/§15).
 */
const useConferenceProfilePermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(conferenceProfilePermissions.all)
  const canAdd = canManageAll || hasPermission(conferenceProfilePermissions.add)
  const canEdit = canManageAll || hasPermission(conferenceProfilePermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(conferenceProfilePermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useConferenceProfilePermissions
