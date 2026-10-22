export type UserStatus = 'logged-out' | 'available' | 'available-on-demand' | 'on-break' | 'do not disturb'

/** List/table entity. Group and domain display names are resolved by the service from their ids. */
export interface User {
  user_uuid: string
  username: string
  email: string
  timezone?: string
  language?: string
  first_name?: string
  organization?: string
  last_name?: string
  /** Saved domain id (same as `Domain.id` in the domain store). Undefined = not tied to a domain. */
  domain_id?: string
  domain_name?: string
  /** Group Manager group ids (`Group.group_uuid`). */
  group_ids: string[]
  group_names: string[]
  /** Each group's assigned-permission count (Group Manager's `permission_count`), index-aligned with `group_ids`. */
  group_permission_counts: number[]
  api_key?: string
  status?: UserStatus
  enabled: boolean
}

/**
 * Add/Edit form values. `password` / `confirm_password` are write-only: they exist only in the form
 * and the create/update request, never on the `User` entity. Optional on Edit (blank = unchanged).
 */
export interface UserFormValues {
  username: string
  password?: string
  confirm_password?: string
  email: string
  timezone?: string
  language?: string
  first_name?: string
  organization?: string
  last_name?: string
  domain_id?: string
  /** The single Group Manager group (`Group.group_uuid`) the user belongs to; required on submit. */
  group_id?: string
  api_key?: string
  status?: UserStatus
  enabled: boolean
}

export interface UserListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface UserListResponse {
  data: User[]
  total_records: number
}

export interface UserFormOptions {
  domains: { id: string; name: string }[]
  groups: { id: string; name: string; permission_count: number }[]
}

/** A per-user override of a Domain / Default Setting. */
export interface UserSetting {
  user_setting_uuid: string
  category: string
  /** The setting type (ie. uuid, name, var, dir, etc). */
  type: string
  subcategory: string
  value?: string
  enabled: boolean
  description?: string
}

export type UserSettingFormValues = Omit<UserSetting, 'user_setting_uuid'>
