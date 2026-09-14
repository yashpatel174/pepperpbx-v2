import usePermissions from '../../hooks/usePermissions'
import { gatewayPermission } from './gateway.constants'

/**
 * Single coarse permission gate, matching the Axion reference's all-or-nothing
 * `pbx_axiontech` wildcard (see gateway.constants.ts). RBAC is foundation-only right now — the
 * store starts empty and is populated from the backend later — so an empty store is treated as
 * "everything granted" rather than locking the module, matching the same convention already
 * established for Extensions (useExtensionPermissions.ts) so the app behaves consistently
 * before a backend exists.
 *
 * Deliberate deviation from the Axion reference: the audit's confirmed bug is that its Delete
 * row action is never permission-gated (Edit/Copy are). PepperPBX closes that gap here — Delete
 * is gated the same as Edit/Copy — since reproducing a known, undocumented-as-intentional
 * asymmetry would just carry the bug forward without reason.
 */
const useGatewayPermissions = () => {
  const { permissions, hasPermission } = usePermissions()
  const permissionsActive = permissions.length > 0
  const canManage = !permissionsActive || hasPermission(gatewayPermission)

  return { canManage }
}

export default useGatewayPermissions
