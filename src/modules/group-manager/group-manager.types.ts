/** Lean list/table entity — counts are derived by the service from the working assignments. */
export interface Group {
  group_uuid: string
  group_name: string
  group_description?: string
  /** Axion-style privilege level. Display/seed only — not editable in the PepperPBX form. */
  group_level: number
  /** Protected (default) groups can't be renamed. */
  group_protected: boolean
  /** Undefined = global group, visible in every domain. `domain_id` is the saved value; `domain_name` is its display name. */
  domain_id?: string
  domain_name?: string
  permission_count: number
  member_count: number
}

export type GroupDetails = Omit<Group, 'permission_count' | 'member_count'>

export interface GroupFormValues {
  group_name: string
  /** Axion Level: 10–90 in steps of 10 (see levelOptions). Protected groups keep their stored level. */
  group_level: number
  group_description?: string
  /** Domain id (same as `Domain.id` in the domain store). Empty = global group. */
  domain_id?: string
}

/**
 * Create-group request. Members are sent with the group so it is created with them in one call;
 * permissions are assigned afterwards on the group's Permissions page, which needs the new group id. Field names follow the service's own saveGroupPermissions / saveGroupMembers
 * inputs — there is no confirmed backend contract yet.
 */
export interface GroupCreatePayload extends GroupFormValues {
  member_ids: string[]
}

export interface GroupListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface GroupListResponse {
  data: Group[]
  total_records: number
}

export interface PermissionDefinition {
  permission_name: string
  category: string
}

/** A permission assigned to a group. `protected` is a separate flag on the assignment — not the same thing as being assigned. */
export interface GroupPermissionAssignment {
  permission_name: string
  protected: boolean
}

export interface GroupPermissionsData {
  group: GroupDetails
  catalog: PermissionDefinition[]
  assignments: GroupPermissionAssignment[]
}

export interface GroupMember {
  user_uuid: string
  username: string
  full_name: string
  email: string
  /** The user's own domain (not the group's). Undefined = the user has no domain. */
  domain_id?: string
  domain_name?: string
}

export interface GroupMembersData {
  group: GroupDetails
  members: GroupMember[]
  /** Every user in the dataset, so the page can offer the non-members for assignment. */
  allUsers: GroupMember[]
}

/** Where the Domain dropdown's options came from — `store` is real app state, `mock` is the dev fallback. */
export interface GroupDomainOptions {
  options: { id: string; name: string }[]
  source: 'store' | 'mock'
}
