import { mockExtensions as seedExtensions } from './extension.mock'
import type { Extension, ExtensionFormValues } from './extension.types'

/**
 * The service's own working copy of the mock dataset. Kept private to this module so
 * extension.service.ts is the single mutation point (create/update) for the mock "backend" —
 * pages and components never import extension.mock.ts directly. Resets on a real page reload
 * since it's just a re-evaluated module; no fake persistence across refresh.
 */
let extensions: Extension[] = seedExtensions.map((extension) => ({ ...extension }))

/**
 * Mock implementation of the future extensions API boundary — swap this for a real call
 * through services/api/apiClient.ts once the backend endpoint is confirmed. When domain
 * scoping is added, the current domain (see hooks/useCurrentDomain) should be passed here,
 * not hardcoded or assumed ahead of the backend's domain-scoping contract.
 */
export const getExtensions = (): Promise<Extension[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(extensions.map((extension) => ({ ...extension }))), 300)
  })

/**
 * Looks up by the user-facing extension number (e.g. "101", matching the /:extensionId
 * route param), not the internal mock id — that's what the URL and EditExtensionPage read.
 */
export const getExtensionById = (extensionId: string): Promise<Extension | undefined> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(extensions.find((extension) => extension.extension === extensionId)), 300)
  })

export const isExtensionNumberTaken = (extensionNumber: string, excludeId?: string): Promise<boolean> =>
  Promise.resolve(
    extensions.some((extension) => extension.extension === extensionNumber && extension.id !== excludeId)
  )

/** Strips the write-only secrets a real backend would never return before loading an edit form. */
export const toExtensionFormValues = (extension: Extension): ExtensionFormValues => ({
  ...extension,
  sipSecret: undefined,
  voicemailPassword: undefined,
})

/** Strips the write-only secrets back out before "storing" — the mock backend doesn't persist them either. */
const toExtensionPayload = (values: ExtensionFormValues): Omit<Extension, 'id'> => ({
  extension: values.extension,
  effectiveCallerIdName: values.effectiveCallerIdName,
  outboundCallerIdName: values.outboundCallerIdName,
  callGroup: values.callGroup,
  context: values.context,
  description: values.description,
  status: values.status,
  voicemailEnabled: values.voicemailEnabled,
  voicemailEmail: values.voicemailEmail,
  directoryListing: values.directoryListing,
  callRecording: values.callRecording,
})

export const createExtension = (values: ExtensionFormValues): Promise<Extension> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created: Extension = { id: `ext-${values.extension}-${Date.now()}`, ...toExtensionPayload(values) }
      extensions = [...extensions, created]
      resolve({ ...created })
    }, 300)
  })

export const updateExtension = (id: string, values: ExtensionFormValues): Promise<Extension> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = extensions.findIndex((extension) => extension.id === id)
      if (index === -1) {
        reject(new Error(`Extension ${id} not found.`))
        return
      }
      const updated: Extension = { id, ...toExtensionPayload(values) }
      extensions = [...extensions.slice(0, index), updated, ...extensions.slice(index + 1)]
      resolve({ ...updated })
    }, 300)
  })
