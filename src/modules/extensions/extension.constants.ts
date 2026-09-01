import type { Extension, ExtensionFormValues, ExtensionStatus } from './extension.types'

export const defaultPageSize = 10

/** Single source of truth for ExtensionForm's create-mode initial values (see task §15). */
export const defaultExtensionFormValues: Omit<ExtensionFormValues, 'extension' | 'context'> = {
  status: 'enabled',
  voicemailEnabled: false,
  directoryListing: false,
  callRecording: false,
}

/** Derived from the values already present in extension.mock.ts — not invented. */
export const callGroupOptions = [
  'Sales', 'Reception', 'Support', 'Billing', 'HR', 'Executive', 'IT', 'Logistics', 'Marketing',
]

// TODO: replace with the backend-confirmed context list once the dialplan contract is known.
export const contextOptions = ['from-internal', 'test-context']

export const extensionStatusLabels: Record<ExtensionStatus, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/**
 * Ant Design Tag preset color names, not hex values — these resolve through the active
 * theme's color tokens (colorSuccess / neutral gray), so status stays correct and readable
 * across light, dark, and compact mode without any module-specific color logic.
 */
export const extensionStatusTagColor: Record<ExtensionStatus, string> = {
  enabled: 'success',
  disabled: 'default',
}

/** Fields searched by useExtensions' client-side filter — swap for server-side search later. */
export const searchableExtensionFields: (keyof Extension)[] = [
  'extension',
  'effectiveCallerIdName',
  'outboundCallerIdName',
  'context',
  'description',
]
