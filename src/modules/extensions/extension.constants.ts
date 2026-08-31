import type { Extension, ExtensionStatus } from './extension.types'

export const defaultPageSize = 10

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
