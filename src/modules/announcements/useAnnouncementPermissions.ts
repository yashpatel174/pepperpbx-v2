import usePermissions from '../../hooks/usePermissions'
import { announcementFreeTextPermissions, announcementPermissions } from './announcement.constants'

/**
 * Four-key granular permission gate, matching the audit's documented model (`pbx_announcements_
 * view/add/edit/all`, announcements.md §14/§33) rather than Outbound Routes'/Gateways'/
 * Destinations' single coarse gate. RBAC is foundation-only right now — the store starts empty
 * and is populated from the backend later — so an empty store is treated as "everything granted"
 * (`canManageAll`) rather than locking the module, matching the convention already established
 * across every other module.
 *
 * `hasAnyAccess` mirrors the audit's `isModuleAccess` (any of the four keys grants at least list
 * visibility, announcements.md §14/§25) — it gates the list's overall PermissionDenied fallback.
 *
 * NOT reproduced: Axion's per-row permission flags (`original[perm]` checked against each list
 * row's embedded permission booleans). PepperPBX's `Announcement` list entity carries no
 * per-record permission data, and no confirmed backend contract exists for one — row-level
 * Edit/Delete/Status-toggle gating here uses these module-level booleans only. See
 * announcement.constants.ts's `announcementPermissions` comment.
 */
const useAnnouncementPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(announcementPermissions.all)
  const canAdd = canManageAll || hasPermission(announcementPermissions.add)
  const canEdit = canManageAll || hasPermission(announcementPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(announcementPermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView
  // Execute Action select ↔ free-text toggle in Structure rows.
  const canUseFreeText = !permissionsActive || announcementFreeTextPermissions.some((key) => hasPermission(key))

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess, canUseFreeText }
}

export default useAnnouncementPermissions
