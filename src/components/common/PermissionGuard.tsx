import type { ReactNode } from 'react'
import usePermissions from '../../hooks/usePermissions'

interface PermissionGuardProps {
  /** Single permission required to render `children`. */
  permission: string
  /** Rendered when the permission is missing. Defaults to nothing (hide, don't disable). */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * UI-only gate — hides/disables, never a security boundary (the backend is authoritative).
 * Usage: <PermissionGuard permission="extension.create"><Button>Add Extension</Button></PermissionGuard>
 */
const PermissionGuard = ({ permission, fallback = null, children }: PermissionGuardProps) => {
  const { hasPermission } = usePermissions()
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
}

export default PermissionGuard
