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
  voicemailEnabled: boolean
  voicemailEmail?: string
  directoryListing: boolean
  callRecording: boolean
}

/**
 * What ExtensionForm actually collects. Extends the entity with write-only secrets a real
 * backend would never return — `sipSecret`/`voicemailPassword` stay undefined when a loaded
 * Extension is mapped to form values (see extension.service.ts's toExtensionFormValues), so
 * edit mode never displays an existing password. Blank on submit means "leave unchanged".
 */
export interface ExtensionFormValues extends Omit<Extension, 'id'> {
  sipSecret?: string
  voicemailPassword?: string
}
