import usePermissions from '../../hooks/usePermissions'
import { callCenterPermissions } from './call-center.constants'

/**
 * Four-key granular permission gate, matching the audit's documented `CALLCENTER_PERMISSION`
 * model (`pbx_callcenter_view/add/edit/all`, call-center.md §14/§33) — same shape as
 * Announcements'/Call Block's `use<Feature>Permissions`. RBAC is foundation-only right now — the
 * store starts empty and is populated from the backend later — so an empty store is treated as
 * "everything granted" (`canManageAll`) rather than locking the module, matching the convention
 * already established across every other module.
 *
 * `hasAnyAccess` mirrors the audit's `isModuleAccess` (any of the four keys grants at least list
 * visibility, call-center.md §14/§25) — it gates the list's overall PermissionDenied fallback.
 *
 * NOT implemented: Axion's separate `AGENT_PERMISSION` (single key, no module_admin) — that
 * governs the Agent entity CRUD/Agent Status sub-screens, which are out of scope for this module
 * (see call-center.router.tsx). Preserving the two-permission-module split is documented in
 * call-center.md §33 as an intentional design choice for whenever that sub-module is built.
 */
const useCallCenterPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(callCenterPermissions.all)
  const canAdd = canManageAll || hasPermission(callCenterPermissions.add)
  const canEdit = canManageAll || hasPermission(callCenterPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(callCenterPermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useCallCenterPermissions
