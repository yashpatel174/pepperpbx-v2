import usePermissions from '../../hooks/usePermissions'
import { callBlockPermissions } from './call-block.constants'

/**
 * Four-key granular permission gate, matching the audit's documented model
 * (`pbx_callblock_view/add/edit/all`, call-block.md §14/§33) — same shape as Announcements'
 * `useAnnouncementPermissions`. RBAC is foundation-only right now — the store starts empty and is
 * populated from the backend later — so an empty store is treated as "everything granted"
 * (`canManageAll`) rather than locking the module, matching the convention already established
 * across every other module.
 *
 * `hasAnyAccess` mirrors the audit's `isModuleAccess` (any of the four keys grants at least list
 * visibility, call-block.md §14/§25) — it gates the list's overall PermissionDenied fallback.
 *
 * NOT reproduced: Axion's per-row permission flags (`original[perm]` checked against each list
 * row's embedded permission booleans, call-block.md §14/§25/§33/§454). PepperPBX's `CallBlock`
 * list entity carries no per-record permission data, and no confirmed backend contract exists for
 * one — row-level Edit/Copy/Delete/Status-toggle gating here uses these module-level booleans
 * only. See call-block.constants.ts's `callBlockPermissions` comment.
 */
const useCallBlockPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(callBlockPermissions.all)
  const canAdd = canManageAll || hasPermission(callBlockPermissions.add)
  const canEdit = canManageAll || hasPermission(callBlockPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(callBlockPermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useCallBlockPermissions
