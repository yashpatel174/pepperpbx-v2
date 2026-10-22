import useDomainStore, { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import { defaultPageSize, searchGroupFields } from './group-manager.constants'
import { getStoredUsers } from '../users/users.store'
import { customGroupSeeds, defaultGroupSeeds, mockDomainOptions, mockPermissionCatalog } from './group-manager.mock'
import type {
  Group,
  GroupDetails,
  GroupCreatePayload,
  GroupDomainOptions,
  GroupFormValues,
  GroupListQuery,
  GroupListResponse,
  GroupMember,
  GroupMembersData,
  GroupPermissionAssignment,
  GroupPermissionsData,
} from './group-manager.types'

/**
 * The service's own working copy of the mock dataset — the single mutation point for the mock
 * "backend". Pages/hooks never import group-manager.mock.ts. Resets on a real page reload.
 *
 * BACKEND CONTRACT REQUIRED for every function below: no Group Manager / group-permission /
 * group-member endpoints are confirmed. Swap each body for apiClient calls once they are, keeping
 * the signatures.
 */
let groups: GroupDetails[] = []
let permissionsByGroup: Record<string, GroupPermissionAssignment[]> = {}
let membersByGroup: Record<string, string[]> = {}

const seedGroup = (seed: { details: GroupDetails; permissions: GroupPermissionAssignment[]; members: string[] }) => {
  groups.push({ ...seed.details })
  permissionsByGroup[seed.details.group_uuid] = seed.permissions.map((p) => ({ ...p }))
  membersByGroup[seed.details.group_uuid] = [...seed.members]
}

;[...defaultGroupSeeds, ...customGroupSeeds].forEach(seedGroup)

let idSequence = 0
/** Monotonic suffix makes ids unique even when several groups are created in the same millisecond. */
const newGroupId = (): string => `group-${Date.now().toString(36)}-${(idSequence++).toString(36)}`

const delay = <T>(value: () => T, ms = 300): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(value())
      } catch (err) {
        reject(err)
      }
    }, ms)
  })

const apiError = (status: number, message: string): ApiError => ({ status, message })

const findGroup = (groupId: string): GroupDetails => {
  const group = groups.find((g) => g.group_uuid === groupId)
  if (!group) throw apiError(404, `Group ${groupId} not found.`)
  return group
}

const toListGroup = (details: GroupDetails): Group => ({
  ...details,
  permission_count: permissionsByGroup[details.group_uuid]?.length ?? 0,
  member_count: membersByGroup[details.group_uuid]?.length ?? 0,
})

const getCurrentDomainId = (): string => useDomainStore.getState().currentDomain?.id ?? MOCK_DEFAULT_DOMAIN

/**
 * Domains the Domain dropdown offers: the shared domain store's availableDomains when populated
 * (read-only — this module never writes the store), else the dev-only mock list. Always includes
 * the current domain so a Group can default to it. BACKEND CONTRACT REQUIRED for a real list.
 */
const resolveDomainOptions = (): GroupDomainOptions => {
  const { availableDomains } = useDomainStore.getState()
  return availableDomains.length > 0
    ? { options: availableDomains.map((d) => ({ ...d })), source: 'store' }
    : { options: mockDomainOptions.map((d) => ({ ...d })), source: 'mock' }
}

export const getGroupDomainOptions = (): Promise<GroupDomainOptions> => delay(resolveDomainOptions, 200)

/** Resolves a form domain id to its display name; an id unknown to the options is rejected. */
const resolveDomain = (domainId?: string): { domain_id?: string; domain_name?: string } => {
  if (!domainId) return {}
  // A group's existing domain stays valid even if the options list no longer includes it.
  const name = resolveDomainOptions().options.find((d) => d.id === domainId)?.name ?? groups.find((g) => g.domain_id === domainId)?.domain_name
  if (!name) throw apiError(400, `Unknown domain "${domainId}".`)
  return { domain_id: domainId, domain_name: name }
}

const normalizeName = (name: string) => name.trim().toLowerCase()

const isNameTaken = (name: string, excludeId?: string) =>
  groups.some((g) => g.group_uuid !== excludeId && normalizeName(g.group_name) === normalizeName(name))

/**
 * Scope: Show All off → global groups plus the current domain's; on → every group. Search matches
 * name/description. Paging is applied last, so `total_records` is the filtered dataset size.
 */
export const fetchGroups = (query: GroupListQuery = {}): Promise<GroupListResponse> =>
  delay(() => {
    const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query
    const currentDomainId = getCurrentDomainId()
    const needle = search.trim().toLowerCase()

    const filtered = groups
      .filter((g) => showAll || !g.domain_id || g.domain_id === currentDomainId)
      .map(toListGroup)
      .filter((g) => !needle || searchGroupFields.some((field) => (g[field] ?? '').toLowerCase().includes(needle)))
      .sort((a, b) => a.group_name.localeCompare(b.group_name))

    const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total_records: filtered.length }
  })

export const getGroupDetails = (groupId: string): Promise<GroupDetails> => delay(() => ({ ...findGroup(groupId) }), 250)

/** Async-validator helper for the form's unique-name rule. Excludes the group being edited. */
export const isGroupNameTaken = (name: string, excludeId?: string): Promise<boolean> => delay(() => isNameTaken(name, excludeId), 150)

const assertKnownPermissions = (assignments: GroupPermissionAssignment[]) => {
  const known = new Set(mockPermissionCatalog.map((p) => p.permission_name))
  const unknown = assignments.find((a) => !known.has(a.permission_name))
  if (unknown) throw apiError(400, `Unknown permission "${unknown.permission_name}".`)
}

const assertKnownUsers = (userIds: string[], directory: GroupMember[]) => {
  const known = new Set(directory.map((u) => u.user_uuid))
  const unknown = userIds.find((id) => !known.has(id))
  if (unknown) throw apiError(400, `Unknown user "${unknown}".`)
}

/**
 * Every user, with their own domain, read from the Users records (Group Manager keeps no user list of
 * its own). A user with no domain has neither `domain_id` nor `domain_name`.
 */
const loadUserDirectory = (): GroupMember[] => {
  const { options } = resolveDomainOptions()
  return getStoredUsers().map((u) => ({
    user_uuid: u.user_uuid,
    username: u.username,
    full_name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
    email: u.email,
    domain_id: u.domain_id,
    domain_name: u.domain_id ? (options.find((d) => d.id === u.domain_id)?.name ?? u.domain_id) : undefined,
  }))
}

/** Every user, for assigning members before a group exists (Add Group). */
export const getAssignableUsers = (): Promise<GroupMember[]> => delay(loadUserDirectory, 200)

/**
 * Replaces a group's member list. A user belongs to at most one group, so anyone being added is first
 * removed from every other group (their membership moves rather than duplicating).
 */
const setGroupMembersNow = (groupId: string, userIds: string[]): void => {
  const incoming = new Set(userIds)
  groups.forEach(({ group_uuid }) => {
    if (group_uuid !== groupId) membersByGroup[group_uuid] = (membersByGroup[group_uuid] ?? []).filter((id) => !incoming.has(id))
  })
  membersByGroup[groupId] = [...incoming]
}

export const createGroup =(values: GroupCreatePayload): Promise<GroupDetails> =>
  delay(() => {
    const name = values.group_name.trim()
    if (isNameTaken(name)) throw apiError(409, `A group named "${name}" already exists.`)
    assertKnownUsers(values.member_ids, loadUserDirectory())
    const created: GroupDetails = {
      group_uuid: newGroupId(),
      group_name: name,
      group_description: values.group_description?.trim() || undefined,
      group_level: values.group_level,
      group_protected: false,
      ...resolveDomain(values.domain_id),
    }
    groups.push(created)
    permissionsByGroup[created.group_uuid] = []
    membersByGroup[created.group_uuid] = []
    setGroupMembersNow(created.group_uuid, values.member_ids)
    return { ...created }
  })

export const updateGroup = (groupId: string, values: GroupFormValues): Promise<GroupDetails> =>
  delay(() => {
    const group = findGroup(groupId)
    const name = values.group_name.trim()
    if (group.group_protected && normalizeName(name) !== normalizeName(group.group_name)) {
      throw apiError(403, 'Protected groups cannot be renamed.')
    }
    if (isNameTaken(name, groupId)) throw apiError(409, `A group named "${name}" already exists.`)
    // Resolve (and possibly reject) the domain BEFORE mutating, so a failed update leaves the group untouched.
    // Protected (default) groups are global and keep that scope.
    const domain = group.group_protected ? { domain_id: group.domain_id, domain_name: group.domain_name } : resolveDomain(values.domain_id)
    group.group_name = group.group_protected ? group.group_name : name
    group.group_description = values.group_description?.trim() || undefined
    // Protected groups keep their level, like their name and scope.
    if (!group.group_protected) group.group_level = values.group_level
    group.domain_id = domain.domain_id
    group.domain_name = domain.domain_name
    return { ...group }
  })

/**
 * Deletes one group along with its permission and member assignments. A group that still has
 * members is rejected (409), matching the list, which only offers Delete when Members is 0.
 * BACKEND CONTRACT REQUIRED: no group-delete endpoint is confirmed; this only changes the mock data.
 */
export const deleteGroup = (groupId: string): Promise<void> =>
  delay(() => {
    findGroup(groupId)
    if ((membersByGroup[groupId]?.length ?? 0) > 0) throw apiError(409, 'This group still has members. Remove them before deleting the group.')
    groups = groups.filter((g) => g.group_uuid !== groupId)
    delete permissionsByGroup[groupId]
    delete membersByGroup[groupId]
  })

export const getGroupPermissions = (groupId: string): Promise<GroupPermissionsData> =>
  delay(() => ({
    group: { ...findGroup(groupId) },
    catalog: mockPermissionCatalog.map((p) => ({ ...p })),
    assignments: (permissionsByGroup[groupId] ?? []).map((p) => ({ ...p })),
  }))

/** Replaces the group's assignments. Names outside the catalogue are rejected. */
export const saveGroupPermissions = (groupId: string, assignments: GroupPermissionAssignment[]): Promise<void> =>
  delay(() => {
    findGroup(groupId)
    assertKnownPermissions(assignments)
    permissionsByGroup[groupId] = assignments.map((a) => ({ ...a }))
  })

export const getGroupMembers = (groupId: string): Promise<GroupMembersData> =>
  delay(() => {
    const allUsers = loadUserDirectory()
    const memberIds = new Set(membersByGroup[groupId] ?? [])
    const group = findGroup(groupId)
    return {
      group: { ...group },
      members: allUsers.filter((u) => memberIds.has(u.user_uuid)),
      allUsers,
    }
  })

/** Replaces the group's member list with the given user ids. */
export const saveGroupMembers = (groupId: string, userIds: string[]): Promise<void> =>
  delay(() => {
    findGroup(groupId)
    assertKnownUsers(userIds, loadUserDirectory())
    setGroupMembersNow(groupId, userIds)
  })

/**
 * Membership source of truth shared with the Users module: `membersByGroup` is the only place a
 * user-group relationship is stored. A user's Groups field is derived from it, never kept separately.
 * BACKEND CONTRACT REQUIRED: no membership endpoint is confirmed.
 */
export const getGroupIdsByUser = (): Promise<Record<string, string[]>> =>
  delay(() => {
    const byUser: Record<string, string[]> = {}
    groups.forEach((g) => {
      ;(membersByGroup[g.group_uuid] ?? []).forEach((userId) => {
        byUser[userId] = [...(byUser[userId] ?? []), g.group_uuid]
      })
    })
    return byUser
  }, 50)

/**
 * Makes `groupIds` the user's complete set of groups: adds the user to groups they were missing from
 * and removes them from every other group. Unknown group ids are rejected before anything changes.
 * The synchronous `Now` form lets the Users service apply a user save and its membership in one step.
 */
export const setUserGroupsNow = (userId: string, groupIds: string[]): void => {
  const wanted = new Set(groupIds)
  wanted.forEach((id) => findGroup(id))
  groups.forEach(({ group_uuid }) => {
    const current = membersByGroup[group_uuid] ?? []
    const isMember = current.includes(userId)
    if (wanted.has(group_uuid) && !isMember) membersByGroup[group_uuid] = [...current, userId]
    else if (!wanted.has(group_uuid) && isMember) membersByGroup[group_uuid] = current.filter((id) => id !== userId)
  })
}

export const setUserGroups = (userId: string, groupIds: string[]): Promise<void> => delay(() => setUserGroupsNow(userId, groupIds), 50)
