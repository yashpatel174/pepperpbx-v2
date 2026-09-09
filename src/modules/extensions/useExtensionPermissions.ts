import usePermissions from '../../hooks/usePermissions'
import { extensionPermissionStrings } from './extension.constants'

/**
 * Basic/Advanced section gating for the Add/Edit form, driven by the existing permissions
 * store (usePermissions). RBAC is foundation-only right now — the store starts empty and is
 * populated from the backend later — so an empty store is treated as "everything granted"
 * rather than locking the form. Once real permission strings flow in, this clamps down:
 *  - lacking *edit*  → the section's controls are disabled (view-only)
 *  - Advanced lacking both view+edit → the section is hidden entirely
 */
const useExtensionPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canEditBasic = !permissionsActive || hasPermission(extensionPermissionStrings.basicEdit)
  const canViewBasic = !permissionsActive || hasPermission(extensionPermissionStrings.basicView)
  const canEditAdvanced = !permissionsActive || hasPermission(extensionPermissionStrings.advancedEdit)
  const canViewAdvanced = !permissionsActive || hasPermission(extensionPermissionStrings.advancedView)

  return {
    canEditBasic,
    canViewBasic,
    canEditAdvanced,
    canViewAdvanced,
    showAdvancedSection: canViewAdvanced || canEditAdvanced,
  }
}

export default useExtensionPermissions