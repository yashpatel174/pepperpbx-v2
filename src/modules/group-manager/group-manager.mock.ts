import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { GroupDetails, GroupPermissionAssignment, PermissionDefinition } from './group-manager.types'

export const BRANCH_DOMAIN = 'branch.pepperpbx.local'

/**
 * DEV-ONLY fallback for the Domain dropdown, used when the shared domain store has no
 * availableDomains yet (it is only populated by other modules' mock bootstraps). Ids equal names,
 * matching those mocks. Replace with the real list-my-domains source once the backend contract exists.
 */
export const mockDomainOptions: { id: string; name: string }[] = [MOCK_DEFAULT_DOMAIN, BRANCH_DOMAIN].map((name) => ({ id: name, name }))

const crud = (prefix: string): string[] => [`${prefix}_view`, `${prefix}_add`, `${prefix}_edit`, `${prefix}_delete`]

/**
 * Seed permission catalogue, by category. The Access Controls and Account Settings entries mirror
 * the Axion reference; the rest are plausible names for modules PepperPBX has built. This is
 * mock data, NOT the real permission list — that comes from the backend.
 */
const catalogByCategory: Record<string, string[]> = {
  'Access Controls': [
    'access_control_add',
    'access_control_delete',
    'access_control_edit',
    'access_control_node_add',
    'access_control_node_delete',
    'access_control_node_edit',
    'access_control_node_view',
    'access_control_view',
  ],
  'Account Settings': ['user_setting_add', 'user_setting_category_edit', 'user_setting_delete', 'user_setting_edit'],
  'Active Calls': ['active_call_view', 'active_call_hangup', 'active_call_transfer', 'active_call_eavesdrop'],
  Announcements: crud('announcement'),
  'Call Block': [...crud('call_block'), 'call_block_all'],
  'Call Center': [...crud('call_center_queue'), ...crud('call_center_agent'), 'call_center_active_view'],
  Conferences: [...crud('conference'), ...crud('conference_room'), ...crud('conference_profile'), 'conference_active_view'],
  Dialplans: [...crud('dialplan'), 'dialplan_all'],
  Extensions: [...crud('extension'), 'extension_all', 'extension_import', 'extension_export', 'extension_copy'],
  Gateways: [...crud('gateway'), 'gateway_all'],
  'Group Manager': [
    'group_view',
    'group_add',
    'group_edit',
    'group_delete',
    'group_permission_view',
    'group_permission_edit',
    'group_member_view',
    'group_member_edit',
  ],
  'IVR Menus': [...crud('ivr_menu'), 'ivr_menu_all'],
  'Music on Hold': crud('music_on_hold'),
  Recordings: [...crud('recording'), 'recording_play', 'recording_download'],
  Registrations: ['registration_view', 'registration_unregister', 'registration_reload'],
  'Ring Groups': [...crud('ring_group'), 'ring_group_all'],
  'Time Conditions': [...crud('time_condition'), ...crud('time_group')],
  Voicemail: [...crud('voicemail'), 'voicemail_message_view', 'voicemail_message_delete'],
}

export const mockPermissionCatalog: PermissionDefinition[] = Object.entries(catalogByCategory).flatMap(([category, names]) =>
  names.map((permission_name) => ({ permission_name, category }))
)

const allNames = mockPermissionCatalog.map((p) => p.permission_name)
const startsWithAny = (name: string, prefixes: string[]) => prefixes.some((prefix) => name.startsWith(prefix))

const assign = (names: string[], isProtected = false): GroupPermissionAssignment[] =>
  names.map((permission_name) => ({ permission_name, protected: isProtected }))

/** A group seed: its details, permission assignments, and member user ids. */
export interface GroupSeed {
  details: GroupDetails
  permissions: GroupPermissionAssignment[]
  members: string[]
}

/**
 * The factory (protected) groups seeded at startup, before any user-created groups.
 */
export const defaultGroupSeeds: GroupSeed[] = [
  {
    details: { group_uuid: 'group-superadmin', group_name: 'superadmin', group_description: 'Super Administrator Group', group_level: 80, group_protected: true },
    permissions: assign(allNames, true),
    members: ['user-001'],
  },
  {
    details: { group_uuid: 'group-admin', group_name: 'admin', group_description: 'Administrator Group', group_level: 50, group_protected: true },
    permissions: assign(allNames.filter((name) => !startsWithAny(name, ['access_control_', 'group_permission_']))),
    members: [],
  },
  {
    details: { group_uuid: 'group-user', group_name: 'user', group_description: 'User Group', group_level: 30, group_protected: true },
    permissions: assign(allNames.filter((name) => /_(view|play)$/.test(name) && !startsWithAny(name, ['access_control_', 'group_']))),
    members: ['user-002', 'user-006', 'user-010'],
  },
  {
    details: { group_uuid: 'group-agent', group_name: 'agent', group_description: 'Call Center Agent Group', group_level: 20, group_protected: true },
    permissions: assign(allNames.filter((name) => startsWithAny(name, ['call_center_', 'voicemail_']) && !/_(add|edit|delete)$/.test(name))),
    members: ['user-003', 'user-008', 'user-009'],
  },
  {
    details: { group_uuid: 'group-public', group_name: 'public', group_description: 'Public Group', group_level: 10, group_protected: true },
    permissions: [],
    members: [],
  },
]

/** Seed user-created groups, in addition to the defaults. */
export const customGroupSeeds: GroupSeed[] = [
  {
    details: { group_uuid: 'group-supervisor', group_name: 'supervisor', group_description: 'Call center supervisors', group_level: 40, group_protected: false },
    permissions: assign(allNames.filter((name) => startsWithAny(name, ['call_center_', 'active_call_', 'recording_', 'registration_']))),
    members: ['user-004', 'user-007'],
  },
  {
    details: {
      group_uuid: 'group-reception',
      group_name: 'reception',
      group_description: 'Front desk and reception staff',
      group_level: 25,
      group_protected: false,
      domain_id: MOCK_DEFAULT_DOMAIN,
      domain_name: MOCK_DEFAULT_DOMAIN,
    },
    permissions: assign(allNames.filter((name) => startsWithAny(name, ['extension_view', 'active_call_view', 'voicemail_view', 'registration_view']))),
    members: ['user-005'],
  },
  {
    details: {
      group_uuid: 'group-branch-ops',
      group_name: 'branch-ops',
      group_description: 'Branch office operators',
      group_level: 25,
      group_protected: false,
      domain_id: BRANCH_DOMAIN,
      domain_name: BRANCH_DOMAIN,
    },
    permissions: assign(allNames.filter((name) => startsWithAny(name, ['ring_group_', 'ivr_menu_view']))),
    members: [],
  },
]
