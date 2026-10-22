import usePermissions from '../../hooks/usePermissions'
import { conferenceRoomPermissions } from './conference-room.constants'

/**
 * The shared `CONFERENCES_PERMISSION` view/add/edit/all model (conference-rooms.md §14). RBAC is
 * foundation-only, so an empty store is treated as "everything granted" rather than hiding the
 * module for everyone — the same convention as useConferenceCenterPermissions.
 *
 * Where each flag applies once real permissions arrive:
 * - module access (`hasAnyAccess`) → table vs PermissionDenied
 * - Add (`canManageAll || canAdd`) → Add button, Add form, bulk Toggle option
 * - Edit (`canManageAll || canEdit || canView`) → row Edit button / Edit page (view-only = read-only form, no Save)
 * - Inline toggles (`canManageAll || canEdit`)
 * - Delete / bulk Delete (`canManageAll`)
 * - Show All (`canManageAll`) — TODO: Axion gates this on `pbx_axiontech` or more than one wildcard
 *   domain (§7/§15); neither exists in PepperPBX yet, so the admin tier stands in until that contract does.
 *
 * Axion reads the per-row Edit/toggle flags from privilege keys on each record (§28); PepperPBX has
 * no such contract, so they come from the user's permissions here.
 */
const useConferenceRoomPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(conferenceRoomPermissions.all)
  const canAdd = canManageAll || hasPermission(conferenceRoomPermissions.add)
  const canEdit = canManageAll || hasPermission(conferenceRoomPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(conferenceRoomPermissions.view)
  const hasAnyAccess = canAdd || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useConferenceRoomPermissions
