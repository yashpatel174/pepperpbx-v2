import usePermissionsStore from '../store/permissions'

/**
 * UI-only permission check — never treat this as a security boundary, the backend
 * enforces the real authorization. See PermissionGuard for the component form of this.
 */
const usePermissions = () => {
  const permissions = usePermissionsStore(state => state.permissions)
  const hasPermission = usePermissionsStore(state => state.hasPermission)
  return { permissions, hasPermission }
}

export default usePermissions
