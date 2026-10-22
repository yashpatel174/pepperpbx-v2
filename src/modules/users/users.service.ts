import type { ApiError } from '../../services/api/apiError'
import { fetchGroups, getGroupDomainOptions, getGroupIdsByUser, setUserGroups, setUserGroupsNow } from '../group-manager/group-manager.service'
import { defaultPageSize, GLOBAL_DOMAIN_ID, searchUserFields } from './users.constants'
import { mockUserSettings } from './users.mock'
import type { StoredUser } from './users.mock'
import { getCurrentDomainId, getStoredUsers, setStoredUsers } from './users.store'
import type {
  User,
  UserFormOptions,
  UserFormValues,
  UserListQuery,
  UserListResponse,
  UserSetting,
  UserSettingFormValues,
} from './users.types'

/**
 * The service's own working copy of the mock dataset — the single mutation point for the mock
 * "backend". Pages/hooks never import users.mock.ts. Resets on a real page reload.
 *
 * BACKEND CONTRACT REQUIRED for every function below: no Users / user-settings endpoints are
 * confirmed. Swap each body for apiClient calls once they are, keeping the signatures. Passwords
 * are accepted but never stored; the real backend owns hashing.
 */
const settingsByUser: Record<string, UserSetting[]> = Object.fromEntries(
  Object.entries(mockUserSettings).map(([userId, list]) => [userId, list.map((s) => ({ ...s }))])
)

let idSequence = 0
/** Monotonic suffix makes ids unique even when several records are created in the same millisecond. */
const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(idSequence++).toString(36)}`

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

/** Group Manager is the source of truth for groups and domain options — read-only here. */
const loadFormOptions = async (): Promise<UserFormOptions> => {
  const [groups, domains] = await Promise.all([fetchGroups({ page: 1, pageSize: 1000, showAll: true }), getGroupDomainOptions()])
  return {
    domains: [{ id: GLOBAL_DOMAIN_ID, name: 'Global' }, ...domains.options],
    groups: groups.data.map((g) => ({ id: g.group_uuid, name: g.group_name, permission_count: g.permission_count })),
  }
}

export const getUserFormOptions = (): Promise<UserFormOptions> => loadFormOptions()

const toUser = (stored: StoredUser, options: UserFormOptions, groupIds: string[]): User => {
  const groupNames = new Map(options.groups.map((g) => [g.id, g.name]))
  // A group deleted in Group Manager since the user was saved simply drops out of the display.
  const knownGroupIds = groupIds.filter((id) => groupNames.has(id))
  return {
    ...stored,
    group_ids: knownGroupIds,
    group_names: knownGroupIds.map((id) => groupNames.get(id) ?? id),
    group_permission_counts: knownGroupIds.map((id) => options.groups.find((g) => g.id === id)?.permission_count ?? 0),
    domain_name: stored.domain_id ? (options.domains.find((d) => d.id === stored.domain_id)?.name ?? stored.domain_id) : undefined,
  }
}

const findUser = (userId: string): StoredUser => {
  const user = getStoredUsers().find((u) => u.user_uuid === userId)
  if (!user) throw apiError(404, `User ${userId} not found.`)
  return user
}

const normalizeName = (name: string) => name.trim().toLowerCase()

const isNameTaken = (name: string, excludeId?: string) =>
  getStoredUsers().some((u) => u.user_uuid !== excludeId && normalizeName(u.username) === normalizeName(name))

const assertKnownGroups = (groupIds: string[], options: UserFormOptions) => {
  const known = new Set(options.groups.map((g) => g.id))
  const unknown = groupIds.find((id) => !known.has(id))
  if (unknown) throw apiError(400, `Unknown group "${unknown}".`)
}

const assertKnownDomain = (domainId: string | undefined, options: UserFormOptions, current?: string) => {
  // A user's existing domain stays valid even if the options list no longer includes it.
  if (domainId && domainId !== current && !options.domains.some((d) => d.id === domainId)) {
    throw apiError(400, `Unknown domain "${domainId}".`)
  }
}

/** Write-only/derived form fields are dropped; everything else is stored trimmed. */
const toStored = (values: UserFormValues): Omit<StoredUser, 'user_uuid'> => ({
  username: values.username.trim(),
  email: values.email.trim(),
  timezone: values.timezone || undefined,
  language: values.language || undefined,
  first_name: values.first_name?.trim() || undefined,
  organization: values.organization?.trim() || undefined,
  last_name: values.last_name?.trim() || undefined,
  domain_id: values.domain_id && values.domain_id !== GLOBAL_DOMAIN_ID ? values.domain_id : undefined,
  api_key: values.api_key?.trim() || undefined,
  status: values.status,
  enabled: values.enabled,
})

/**
 * Scope: Show All off → users in the current domain (plus domain-less ones); on → every user.
 * Search matches username and group names, case-insensitively. Paging is applied last, so
 * `total_records` is the filtered dataset size.
 */
export const getUsers = async (query: UserListQuery = {}): Promise<UserListResponse> => {
  const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query
  const [options, memberships] = await Promise.all([loadFormOptions(), getGroupIdsByUser()])
  return delay(() => {
    const currentDomainId = getCurrentDomainId()
    const needle = search.trim().toLowerCase()
    const filtered = getStoredUsers()
      .filter((u) => showAll || !u.domain_id || u.domain_id === currentDomainId)
      .map((u) => toUser(u, options, memberships[u.user_uuid] ?? []))
      .filter(
        (u) =>
          !needle ||
          searchUserFields.some((field) => {
            const value = u[field]
            return (Array.isArray(value) ? value.join(' ') : value).toLowerCase().includes(needle)
          })
      )
      .sort((a, b) => a.username.localeCompare(b.username))
    const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total_records: filtered.length }
  })
}

export const getUserById = async (userId: string): Promise<User> => {
  const [options, memberships] = await Promise.all([loadFormOptions(), getGroupIdsByUser()])
  return delay(() => toUser(findUser(userId), options, memberships[userId] ?? []), 250)
}

/** Async-validator helper for the form's unique-username rule. Excludes the user being edited. */
export const isUsernameTaken = (name: string, excludeId?: string): Promise<boolean> => delay(() => isNameTaken(name, excludeId), 150)

/** Browser-safe random key (256 bits, hex). Mock-mode only — the real backend should issue keys. */
export const generateApiKey = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Saves the user and their group membership as one step. Everything is validated first; the user
 * record is then written and the membership applied inside the same synchronous block, and if the
 * membership step throws the previous user records are restored. This is a mock-mode guarantee only,
 * not a database transaction — a real backend must make this one request or one transaction.
 * Passwords are never stored (see users.constants `PASSWORD_NOT_SAVED_HINT`).
 */
export const createUser = async (values: UserFormValues): Promise<User> => {
  const options = await loadFormOptions()
  const groupIds = values.group_id ? [values.group_id] : []
  const created = await delay(() => {
    const stored = toStored(values)
    if (isNameTaken(stored.username)) throw apiError(409, `A user named "${stored.username}" already exists.`)
    assertKnownGroups(groupIds, options)
    assertKnownDomain(stored.domain_id, options)
    const record: StoredUser = { user_uuid: newId('user'), ...stored }
    const before = getStoredUsers()
    setStoredUsers([...before, record])
    try {
      setUserGroupsNow(record.user_uuid, groupIds)
    } catch (err) {
      setStoredUsers(before)
      throw err
    }
    return record
  })
  return toUser(created, options, groupIds)
}

/** Same all-or-nothing save as createUser; a failure leaves the original user and memberships in place. */
export const updateUser = async (userId: string, values: UserFormValues): Promise<User> => {
  const options = await loadFormOptions()
  const groupIds = values.group_id ? [values.group_id] : []
  const updated = await delay(() => {
    const existing = findUser(userId)
    const stored = toStored(values)
    if (isNameTaken(stored.username, userId)) throw apiError(409, `A user named "${stored.username}" already exists.`)
    assertKnownGroups(groupIds, options)
    assertKnownDomain(stored.domain_id, options, existing.domain_id)
    const record: StoredUser = { user_uuid: userId, ...stored }
    const before = getStoredUsers()
    setStoredUsers(before.map((u) => (u.user_uuid === userId ? record : u)))
    try {
      setUserGroupsNow(userId, groupIds)
    } catch (err) {
      setStoredUsers(before)
      throw err
    }
    return record
  })
  return toUser(updated, options, groupIds)
}

/** Removes the user, their settings, and their membership in every group. No Users UI calls this yet. */
export const deleteUser = async (userId: string): Promise<void> => {
  await delay(() => {
    findUser(userId)
    setStoredUsers(getStoredUsers().filter((u) => u.user_uuid !== userId))
    delete settingsByUser[userId]
  })
  await setUserGroups(userId, [])
}

/** Flips only the Enabled flag; group membership (owned by Group Manager) and every other field are untouched. */
export const setUserEnabled = (userId: string, enabled: boolean): Promise<void> =>
  delay(() => {
    findUser(userId)
    setStoredUsers(getStoredUsers().map((u) => (u.user_uuid === userId ? { ...u, enabled } : u)))
  }, 200)

export const getUserSettings = (userId: string): Promise<UserSetting[]> =>
  delay(() => {
    findUser(userId)
    return (settingsByUser[userId] ?? []).map((s) => ({ ...s }))
  }, 250)

export const getUserSetting = (userId: string, settingId: string): Promise<UserSetting> =>
  delay(() => {
    findUser(userId)
    const setting = settingsByUser[userId]?.find((s) => s.user_setting_uuid === settingId)
    if (!setting) throw apiError(404, `User setting ${settingId} not found.`)
    return { ...setting }
  }, 250)

const toSettingFields = (values: UserSettingFormValues): UserSettingFormValues => ({
  category: values.category.trim(),
  type: values.type.trim(),
  subcategory: values.subcategory.trim(),
  value: values.value?.trim() || undefined,
  enabled: values.enabled,
  description: values.description?.trim() || undefined,
})

export const createUserSetting = (userId: string, values: UserSettingFormValues): Promise<UserSetting> =>
  delay(() => {
    findUser(userId)
    const created: UserSetting = { user_setting_uuid: newId('user-setting'), ...toSettingFields(values) }
    settingsByUser[userId] = [...(settingsByUser[userId] ?? []), created]
    return { ...created }
  })

export const updateUserSetting = (userId: string, settingId: string, values: UserSettingFormValues): Promise<UserSetting> =>
  delay(() => {
    findUser(userId)
    const list = settingsByUser[userId] ?? []
    if (!list.some((s) => s.user_setting_uuid === settingId)) throw apiError(404, `User setting ${settingId} not found.`)
    const updated: UserSetting = { user_setting_uuid: settingId, ...toSettingFields(values) }
    settingsByUser[userId] = list.map((s) => (s.user_setting_uuid === settingId ? updated : s))
    return { ...updated }
  })
