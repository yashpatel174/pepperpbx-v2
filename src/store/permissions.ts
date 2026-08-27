import { create } from 'zustand'

/**
 * RBAC is UI-only here — the backend is always the final authority (see CLAUDE.md).
 * The exact permission-string contract (delivered via JWT claims, a /me endpoint, etc.)
 * is not confirmed yet, so this store starts empty rather than defaulting to "all granted"
 * or inventing permission names. Populate it (e.g. from the login/`/me` response) once the
 * contract is settled.
 */
interface PermissionsState {
  permissions: string[]
}

interface PermissionsActions {
  setPermissions: (permissions: string[]) => void
  hasPermission: (permission: string) => boolean
}

const usePermissionsStore = create<PermissionsState & PermissionsActions>()((set, get) => ({
  permissions: [],

  setPermissions: (permissions) => set({ permissions }),
  hasPermission: (permission) => get().permissions.includes(permission),
}))

export default usePermissionsStore
