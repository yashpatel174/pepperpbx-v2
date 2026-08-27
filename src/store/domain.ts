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
