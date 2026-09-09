export type ExtensionStatus = 'enabled' | 'disabled'

export interface Extension {
  id: string
  extension: string
  effectiveCallerIdName?: string
  outboundCallerIdName?: string
  callGroup?: string
  domain: string
  description?: string
  status: ExtensionStatus
  voicemailEnabled: boolean
  voicemailEmail?: string
  directoryListing: boolean
  callRecording: boolean
  /** Protected/system record (projected from ExtensionDetails.default) — see extension.service.ts's toListExtension. */
  default?: boolean
}

export interface ExtensionListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface ExtensionListResponse {
  data: Extension[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/**
 * Hive-provided account context used to pre-fill the Add form and drive extension-number
 * validation. Mirrors the GET /api/hiveuser/details response.
 */
export interface HiveUserDetails {
  autoExt: string
  accountNumber: string
  defaultDomain: string
  newDomainName: string
  domainOptions: string[]
  additionalExtStart: number
  additionalExtEnd: number
  additionalExtExclude: string[]
}

/**
 * What the Add/Edit form actually collects and submits. The three numeric fields stay as
 * strings in the form (validated with string regexes) and are converted to numbers only at
 * the service/API boundary. `range` is a create-only convenience control and is never sent
 * to the API.
 */
export interface ExtensionFormValues {
  range: number
  extension: string
  accountcode: string
  password?: string
  effective_caller_id_name?: string
  effective_caller_id_number?: string
  outbound_caller_id_name?: string
  outbound_caller_id_number?: string
  emergency_caller_id_name?: string
  emergency_caller_id_number?: string
  directory_first_name?: string
  directory_last_name?: string
  max_registrations?: string
  limit_max: string
  limit_destination: string
  missed_call_app: string
  missed_call_data?: string
  toll_allow?: string
  call_timeout: string
  call_group?: string
  user_record: string
  hold_music?: string
  user_context: string
  auth_acl?: string
  cidr?: string
  sip_force_contact: string
  sip_force_expires?: string
  mwi_account?: string
  sip_bypass_media: string
  absolute_codec_string?: string
  dial_string?: string
  description?: string
  call_screen_enabled: boolean
  force_ping: boolean
  directory_visible: boolean
  directory_exten_visible: boolean
  voicemail_transcription_enabled: boolean
  voicemail_local_after_email: boolean
  voicemail_enabled: boolean
  enabled: boolean
  voicemail_mail_to?: string
  voicemail_file: string
  voicemail_password?: string
}

/**
 * The create/update form model as returned by the server. The three numeric fields are
 * numbers here (converted from the form strings by the service). The remaining fields are
 * server-only metadata that must never be rendered as form inputs.
 */
export interface ExtensionDetails
  extends Omit<ExtensionFormValues, 'range' | 'limit_max' | 'call_timeout' | 'sip_force_expires'> {
  extension_uuid: string
  domain_name: string
  default?: string
  pbx_extensionbasic_edit?: string
  pbx_extensionbasic_view?: string
  pbx_extensionadvanced_edit?: string
  pbx_extensionadvanced_view?: string
  old_extension?: string
  limit_max: number
  call_timeout: number
  sip_force_expires?: number
}