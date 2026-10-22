import useDomainStore, { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import { buildMockUsers } from './users.mock'
import type { StoredUser } from './users.mock'

/**
 * The mock "backend" user records, kept in their own module so Group Manager can read the user
 * directory without importing users.service (which depends on Group Manager) — that import loop is
 * what this file removes. Only the Users and Group Manager services should import it.
 */
let usersStore: StoredUser[] | null = null

export const getCurrentDomainId = (): string => useDomainStore.getState().currentDomain?.id ?? MOCK_DEFAULT_DOMAIN

/** Seeded on first use, not at import, so the seeds land in the domain that is active by then. */
export const getStoredUsers = (): StoredUser[] => (usersStore ??= buildMockUsers(getCurrentDomainId()))

export const setStoredUsers = (next: StoredUser[]): void => {
  usersStore = next
}
