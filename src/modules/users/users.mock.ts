import type { User, UserSetting } from './users.types'

/** What the mock "backend" stores per user: names are derived from ids at read time. */
export type StoredUser = Omit<User, 'group_ids' | 'group_names' | 'group_permission_counts' | 'domain_name'>

const BRANCH_DOMAIN = 'branch.pepperpbx.local'

/**
 * Seed users. The default-scope ones are placed in `currentDomainId` (the store's active domain, which
 * is persisted and set by whichever module ran first), so the Show All = off list is never empty
 * because the seeds were pinned to a different domain. Group membership is owned by Group Manager (see
 * getGroupIdsByUser), and passwords are never stored. `front.desk` stays in a second domain on purpose.
 */
export const buildMockUsers = (currentDomainId: string): StoredUser[] => [
  {
    user_uuid: 'user-001',
    username: 'admin',
    email: 'admin@pepperpbx.local',
    timezone: 'UTC',
    language: 'en-us',
    first_name: 'Alex',
    last_name: 'Morgan',
    organization: 'PepperPBX',
    domain_id: currentDomainId,
    status: 'available',
    enabled: true,
  },
  {
    user_uuid: 'user-002',
    username: 'jsmith',
    email: 'jsmith@pepperpbx.local',
    timezone: 'America/New_York',
    language: 'en-us',
    first_name: 'Jordan',
    last_name: 'Smith',
    organization: 'Sales',
    domain_id: currentDomainId,
    status: 'available-on-demand',
    enabled: true,
  },
  {
    user_uuid: 'user-003',
    username: 'mpatel',
    email: 'mpatel@pepperpbx.local',
    timezone: 'Asia/Kolkata',
    language: 'hi-in',
    first_name: 'Meera',
    last_name: 'Patel',
    organization: 'Support',
    domain_id: currentDomainId,
    status: 'on-break',
    enabled: true,
  },
  {
    user_uuid: 'user-004',
    username: 'rlopez',
    email: 'rlopez@pepperpbx.local',
    timezone: 'Europe/Madrid',
    language: 'es-es',
    first_name: 'Rosa',
    last_name: 'Lopez',
    domain_id: currentDomainId,
    status: 'do not disturb',
    enabled: false,
  },
  {
    user_uuid: 'user-005',
    username: 'front.desk',
    email: 'frontdesk@pepperpbx.local',
    timezone: 'Europe/London',
    language: 'en-gb',
    first_name: 'Front',
    last_name: 'Desk',
    domain_id: BRANCH_DOMAIN,
    status: 'logged-out',
    enabled: true,
  },
  ...(
    [
      ['tchen', 'Tony', 'Chen', 'Asia/Shanghai', 'zh-cn', 'Engineering', 'available', true],
      ['hschmidt', 'Hans', 'Schmidt', 'Europe/Berlin', 'de-de', 'Operations', 'do not disturb', true],
      ['cdubois', 'Claire', 'Dubois', 'Europe/Paris', 'fr-fr', 'Sales', 'available-on-demand', true],
      ['ysato', 'Yuki', 'Sato', 'Asia/Tokyo', 'ja-jp', 'Engineering', 'available', false],
      ['nolsen', 'Nora', 'Olsen', 'Europe/Oslo', 'en-gb', 'Operations', 'on-break', true],
    ] as const
  ).map(([username, first, last, timezone, language, organization, status, enabled], i): StoredUser => ({
    user_uuid: `user-${String(i + 6).padStart(3, '0')}`,
    username,
    email: `${username}@pepperpbx.local`,
    timezone,
    language,
    first_name: first,
    last_name: last,
    organization,
    domain_id: currentDomainId,
    status,
    enabled,
  })),
]

export const mockUserSettings: Record<string, UserSetting[]> = {
  'user-001': [
    {
      user_setting_uuid: 'user-setting-001',
      category: 'domain',
      type: 'var',
      subcategory: 'time_zone',
      value: 'UTC',
      enabled: true,
      description: 'Override the default time zone for this user.',
    },
  ],
}
