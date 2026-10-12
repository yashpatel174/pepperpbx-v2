export const defaultPageSize = 10

/** active-call-center.md §5: 10, 25, 50, 100, 200. */
export const pageSizeOptions = [10, 25, 50, 100, 200]

export const ACTIVE_CALL_CENTER_PATH = '/activeCallCenter/list'
export const ACTIVE_CALL_CENTER_ACTIVITY_PATH = '/activeCallCenter/activity'

/** The Call Center module's Edit route — Activity's Edit buttons navigate there (active-call-center.md §26). */
export const callCenterEditPath = (queueUuid: string): string => `/call-center/${encodeURIComponent(queueUuid)}/edit`

/** Tier state that swaps the agent Options from Call to Eavesdrop + Transfer (active-call-center.md §26). */
export const ACTIVE_INBOUND_TIER_STATE = 'Active Inbound'

/** Member state that hides the Eavesdrop option (active-call-center.md §26). */
export const ABANDONED_MEMBER_STATE = 'Abandoned'

/**
 * Module-local placeholder permission string per CLAUDE.md's `<module>.<action>` rule — Axion's
 * single `pbx_callcenteractive_admin` key (active-call-center.md §14) is not reproduced, and this
 * is not a confirmed backend contract.
 */
export const activeCallCenterPermissions = {
  view: 'active-call-center.view',
}
