import usePermissions from '../../hooks/usePermissions'
import { callCenterAgentPermission } from './call-center-agents.constants'

/**
 * Single coarse permission gate, matching the audit's documented `AGENT_PERMISSION` model (single
 * key `pbx_callcenter_admin`, no `module_admin`, call-center.md §14/§28/§33) — deliberately
 * distinct from the Call Center Queue module's own four-key `CALLCENTER_PERMISSION` model, since
 * the audit documents these as two separate permission modules by design. RBAC is foundation-only
 * right now — the store starts empty and is populated from the backend later — so an empty store
 * is treated as "everything granted" rather than locking the module, matching the convention
 * already established across every other module (e.g. Gateways' own single-key
 * useGatewayPermissions).
 *
 * Gates: list access (view), Add/Edit/Delete row and bulk actions, and the Agent Status page —
 * ONE coherent model for every Agent action, deliberately not reproducing Axion's confirmed
 * mismatch where the Queue list's "Agents" button uses Queue permissions while the Agent screens
 * themselves check a different permission (call-center.md §28).
 */
const useCallCenterAgentPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0

  const canManage = !permissionsActive || hasPermission(callCenterAgentPermission)

  return { canManage }
}

export default useCallCenterAgentPermissions
