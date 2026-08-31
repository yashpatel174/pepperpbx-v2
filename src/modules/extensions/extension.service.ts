import { mockExtensions } from './extension.mock'
import type { Extension } from './extension.types'

/**
 * Mock implementation of the future extensions API boundary — swap this for a real call
 * through services/api/apiClient.ts once the backend endpoint is confirmed. When domain
 * scoping is added, the current domain (see hooks/useCurrentDomain) should be passed here,
 * not hardcoded or assumed ahead of the backend's domain-scoping contract.
 */
export const getExtensions = (): Promise<Extension[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(mockExtensions.map((extension) => ({ ...extension }))), 300)
  })
