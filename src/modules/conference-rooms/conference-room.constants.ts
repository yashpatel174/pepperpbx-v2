import type { ConferenceRoom, ConferenceRoomFormValues, ConferenceRoomToggleKey, HiveUserDetails } from './conference-room.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

/**
 * Routes. The `/conferenceCenters/conferenceRooms/...` namespace is Axion's and is kept on purpose
 * (conference-rooms.md §1/§33). Edit takes the uuid as `?conference_room_uuid=`, as in Axion.
 */
export const conferenceRoomPaths = {
  list: '/conferenceCenters/conferenceRooms/list',
  add: '/conferenceCenters/conferenceRooms/add',
  edit: (uuid: string) => `/conferenceCenters/conferenceRooms/edit?conference_room_uuid=${encodeURIComponent(uuid)}`,
  /** "Back" goes to PepperPBX's existing Conference Centers list route (§3 Navigation). */
  conferenceCenters: '/conference-centers',
  /** The existing Active Conferences route — it has its own permission model (§30). */
  activeConferences: '/activeConferences/list',
}

export const conferenceRoomStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/**
 * The seven inline-toggle columns, in table order. Drives the table columns and the bulk Toggle
 * modal's field select, so the two can never drift apart (conference-rooms.md §5/§20).
 */
export const conferenceRoomToggleFields: { key: ConferenceRoomToggleKey; label: string }[] = [
  { key: 'record', label: 'Record' },
  { key: 'announce_name', label: 'Announce Name' },
  { key: 'announce_count', label: 'Announce Count' },
  { key: 'announce_recording', label: 'Announce Recording' },
  { key: 'mute', label: 'Mute' },
  { key: 'sounds', label: 'Sounds' },
  { key: 'enabled', label: 'Enabled' },
]

/** Fields matched by the mock list's server-side search emulation (see conference-room.service.ts). */
export const searchableConferenceRoomFields: (keyof ConferenceRoom)[] = [
  'conference_room_name',
  'moderator_pin',
  'participant_pin',
  'description',
  'domain_name',
]

/** Max Members select — 0 through 999 (conference-rooms.md §8/§26), generated rather than listed. */
export const maxMemberOptions: { label: string; value: number }[] = Array.from({ length: 1000 }, (_, value) => ({
  label: String(value),
  value,
}))

/** The True/False selects. Values are strings for the Select; the form item maps them to booleans. */
export const trueFalseOptions = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
]

/** Schedule From/To wire format (conference-rooms.md §27). */
export const scheduleDateFormat = 'YYYY-MM-DD HH:mm'

/**
 * The Axion endpoints this module's service stands in for (conference-rooms.md §11/§12). Not the
 * confirmed PepperPBX backend contract — kept in one place so the real paths can be swapped in
 * without touching any caller.
 */
export const conferenceRoomEndpoints = {
  list: '/conference/room/list',
  create: '/conference/room/create',
  update: (uuid: string) => `/conference/room/update/${uuid}`,
  details: (uuid: string) => `/conference/room/details/${uuid}`,
  delete: '/conference/room/delete',
  toggle: '/conference/room/toggle',
  conferenceCenterNames: '/conference/room/list/conferenceCenterNames',
  /** Owned by the Conferences API block, not Conference Rooms (§12/§30). */
  profileOptions: '/conferences/profileOptions',
  hiveUserDetails: '/hiveuser/details',
} as const

/**
 * The hive bootstrap's `module` param. `ConferenceCenter`, NOT `ConferenceRoom` — Axion shares the
 * Conference Centers bootstrap context and the audit says to keep it (§11/§26/§33).
 */
export const hiveUserModule = 'ConferenceCenter'

/**
 * Axion's shared `CONFERENCES_PERMISSION` (`pbx_conference_view/add/edit/all`) covers all five
 * conference modules and must not be split (conference-rooms.md §14/§33). These are the same
 * placeholder strings Conferences and Conference Centers already use — repeated, not imported,
 * because modules here don't import from each other.
 */
export const conferenceRoomPermissions = {
  view: 'conference.view',
  add: 'conference.add',
  edit: 'conference.edit',
  all: 'conference.manage',
}

/**
 * Add-mode defaults — exactly the audited set (conference-rooms.md §3/§26) plus the hive-provided
 * account code and domain. Profile and Conference Center have no default in Axion (§28).
 */
export const getDefaultConferenceRoomFormValues = (hive: HiveUserDetails): Partial<ConferenceRoomFormValues> => ({
  conference_room_name: '',
  enabled: true,
  record: false,
  max_members: 0,
  wait_mod: true,
  moderator_endconf: false,
  announce_name: true,
  announce_count: true,
  announce_recording: true,
  sounds: false,
  mute: false,
  account_code: hive.accountCode,
  domain_name: hive.defaultDomain,
})
