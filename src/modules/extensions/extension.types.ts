export type ExtensionStatus = 'enabled' | 'disabled'

export interface Extension {
  id: string
  extension: string
  effectiveCallerIdName?: string
  outboundCallerIdName?: string
  callGroup?: string
  context: string
  description?: string
  status: ExtensionStatus
}
