import usePermissions from '../../hooks/usePermissions'
import { voicemailPermissions } from './voicemail.constants'

/**
 * Four-key permission gate matching the audit's model (voicemail.md §19: view/edit/add plus a
 * module-admin `all` bypass). RBAC is foundation-only — the store starts empty — so an empty
 * store is treated as "everything granted" (`canManageAll`), the convention used by every module.
 *
 * `hasAnyAccess` mirrors the audit's `isModuleAccess` (any of the keys grants list visibility).
 * Axion's per-row permission flags and the Show All `pbx_axiontech` / multi-domain gate are NOT
 * reproduced — no confirmed backend contract carries them — so row gating uses these module-level
 * booleans only. The strings in `voicemailPermissions` are TODO placeholders.
 */
const useVoicemailPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManageAll = !permissionsActive || hasPermission(voicemailPermissions.all)
  const canAdd = canManageAll || hasPermission(voicemailPermissions.add)
  const canEdit = canManageAll || hasPermission(voicemailPermissions.edit)
  const canView = canManageAll || canEdit || hasPermission(voicemailPermissions.view)
  const hasAnyAccess = canManageAll || canAdd || canEdit || canView

  return { canManageAll, canAdd, canEdit, canView, hasAnyAccess }
}

export default useVoicemailPermissions
