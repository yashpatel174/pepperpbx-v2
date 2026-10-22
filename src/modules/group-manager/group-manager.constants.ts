export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

export const groupManagerPath = '/group-manager'

/** Axion's Level select: 10–90 in steps of 10 (docs/axion-functional-audit/advanced/groups.md §8). */
export const levelOptions: { value: number; label: string }[] = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((value) => ({ value, label: String(value) }))

/** Fields matched by fetchGroups' search filter (see group-manager.service.ts). */
export const searchGroupFields = ['group_name', 'group_description'] as const

export type PermissionFilter = 'all' | 'assigned' | 'unassigned'

export const permissionFilterOptions: { value: PermissionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Not assigned' },
]

export const groupPermissionsPath = (groupId: string) => `${groupManagerPath}/${groupId}/permissions`
export const groupMembersPath = (groupId: string) => `${groupManagerPath}/${groupId}/members`
/**
 * Route state the permissions page reads to decide where Back goes. Set by the pages that open it
 * (Add Group after creating the group, Edit Group), so the user lands back on the group they came from.
 */
export interface GroupPermissionsLocationState {
  returnTo?: string
}

export const getPermissionsReturnTo = (state: unknown): string | undefined => {
  if (typeof state !== 'object' || state === null || !('returnTo' in state)) return undefined
  return typeof state.returnTo === 'string' ? state.returnTo : undefined
}

export const groupEditPath = (groupId: string) => `${groupManagerPath}/${groupId}/edit`
