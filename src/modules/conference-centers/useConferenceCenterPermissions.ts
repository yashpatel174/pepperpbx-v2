import usePermissions from '../../hooks/usePermissions'
import { conferenceCenterPermissions } from './conference-center.constants'

/**
 * The shared `CONFERENCES_PERMISSION` view/add/edit/all model (conference-centers.md §14). RBAC is
 * foundation-only, so an empty store is treated as "everything granted" rather than hiding the
 * module for everyone — the same convention as useConferencePermissions and every other module.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → list vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Rooms button, Add form, bulk Toggle option
 * - Edit (`canManageAll || canEdit || canView`) → row Edit button / Edit page (view-only = read-only form, no Save)
 * - Status toggle (`canManageAll || canEdit`) → inline Status click
 * - Delete / bulk Delete (`canManageAll`)
 * - Show All (`canManageAll`) — TODO: Axion gates this on `pbx_axiontech` or more than one wildcard
 *   domain; neither exists in PepperPBX yet, so the admin tier stands in until that contract does.
 */
const useConferenceCenterPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(conferenceCenterPermissions.all)
  const canAdd = canManageAll || hasPermission(conferenceCenterPermissions.add)
  const canEdit = canManageAll || hasPermission(conferenceCenterPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(conferenceCenterPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useConferenceCenterPermissions
