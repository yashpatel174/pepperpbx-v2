import usePermissions from '../../hooks/usePermissions'
import { conferencePermissions } from './conference.constants'

/**
 * Four-key granular permission gate, matching the audit's documented `CONFERENCES_PERMISSION`
 * model (`pbx_conference_view/add/edit/all`, conferences.md §14/§33) — same shape as Call Center
 * Queue's `useCallCenterPermissions`. RBAC is foundation-only right now — the store starts empty
 * and is populated from the backend later — so an empty store is treated as "everything granted"
 * (`canManageAll`) rather than locking the module, matching the convention already established
 * across every other module.
 *
 * `hasAnyAccess` mirrors the audit's `isModuleAccess` (any of the four keys grants at least list
 * visibility, conferences.md §14/§25) — it gates the list's overall PermissionDenied fallback.
 */
const useConferencePermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(conferencePermissions.all)
  const canAdd = canManageAll || hasPermission(conferencePermissions.add)
  const canEdit = canManageAll || hasPermission(conferencePermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(conferencePermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useConferencePermissions
