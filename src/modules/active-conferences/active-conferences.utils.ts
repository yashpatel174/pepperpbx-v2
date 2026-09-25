import type {
  ActiveConference,
  ActiveConferenceDetailState,
  ActiveConferenceMember,
  ActiveConferenceMemberRow,
} from './active-conferences.types'

const pad = (value: number) => String(value).padStart(2, '0')

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/**
 * Minimal runtime check for a conference record from router state (not type-checked at runtime).
 * Only verifies what the UI can't render without.
 */
export const isActiveConference = (value: unknown): value is ActiveConference =>
  isRecord(value) && typeof value.conference_name === 'string' && typeof value.domain === 'string' && Array.isArray(value.members)

export const isDetailState = (value: unknown): value is ActiveConferenceDetailState => isRecord(value) && isActiveConference(value.conference)

/**
 * Formats `join_time` / `last_talking` as HH:MM:SS. ASSUMES the value is elapsed SECONDS — that's
 * how Axion's math treats it (active-conferences.md §5/§26), but the backend unit is unconfirmed.
 * If the backend turns out to send milliseconds or timestamps, fix it here, in one place.
 */
export const formatElapsedSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const total = Math.floor(seconds)
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

/**
 * Row identity for a conference. No stable conference id is documented (§13), so the conference
 * name scoped by its domain is used — the same name can exist in two domains under Show All.
 */
export const getConferenceKey = (conference: ActiveConference) => `${conference.domain}::${conference.conference_name}`

/** Client-side search (§6): case-insensitive substring over name + PIN, plus domain under Show All. */
export const filterActiveConferences = (conferences: ActiveConference[], search: string, showAll: boolean): ActiveConference[] => {
  const needle = search.trim().toLowerCase()
  if (!needle) return conferences

  return conferences.filter((conference) => {
    const fields = [conference.conference_name, conference.participant_pin, ...(showAll ? [conference.domain] : [])]
    return fields.some((value) => String(value ?? '').toLowerCase().includes(needle))
  })
}

/**
 * Adds a render-only key to each member. Members have no documented stable id (§13), so the key is
 * caller number + name + occurrence count.
 */
export const toMemberRows = (members: ActiveConferenceMember[]): ActiveConferenceMemberRow[] => {
  const seen = new Map<string, number>()
  return members.map((member) => {
    const base = `${member.caller_id_number}|${member.caller_id_name}`
    const occurrence = seen.get(base) ?? 0
    seen.set(base, occurrence + 1)
    return { ...member, key: `${base}|${occurrence}` }
  })
}
