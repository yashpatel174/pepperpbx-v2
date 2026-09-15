import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Placeholder shape — the backend's actual domain/tenant model (fields, how a domain is
 * scoped on API calls) is not confirmed yet. Extend this once that contract is known;
 * don't assume more structure than `id`/`name` until then.
 */
export interface Domain {
  id: string
  name: string
}

/**
 * Single shared literal used by module mocks (Extensions, Gateways, ...) to seed this store's
 * `currentDomain` before a real backend domain contract exists. Every mock must use this same
 * value — if two modules' mocks each seeded their own different default domain, whichever
 * module ran first would permanently win (see setCurrentDomain's `if (!currentDomain)` guard
 * below, persisted to localStorage), leaving the other module's domain-scoped mock list
 * filtering against a domain name its own records don't have.
 */
export const MOCK_DEFAULT_DOMAIN = 'sip.pepperpbx.local'

interface DomainState {
  currentDomain: Domain | null
  availableDomains: Domain[]
}

interface DomainActions {
  setCurrentDomain: (domain: Domain | null) => void
  setAvailableDomains: (domains: Domain[]) => void
}

const useDomainStore = create<DomainState & DomainActions>()(
  persist(
    (set) => ({
      currentDomain: null,
      availableDomains: [],

      setCurrentDomain: (domain) => set({ currentDomain: domain }),
      setAvailableDomains: (domains) => set({ availableDomains: domains }),
    }),
    {
      name: 'domain-storage',
    }
  )
)

export default useDomainStore
