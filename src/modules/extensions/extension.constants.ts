import type { Extension, ExtensionStatus, ExtensionFormValues, HiveUserDetails } from "./extension.types";

export const defaultPageSize = 10;

export const pageSizeOptions = [10, 25, 50, 100, 200];

/** Derived from the values already present in extension.mock.ts — not invented. */
export const callGroupOptions = [
  "Sales",
  "Reception",
  "Support",
  "Billing",
  "HR",
  "Executive",
  "IT",
  "Logistics",
  "Marketing",
];

export const extensionStatusLabels: Record<ExtensionStatus, string> = {
  enabled: "Enabled",
  disabled: "Disabled",
};

/**
 * Ant Design Tag preset color names, not hex values — these resolve through the active
 * theme's color tokens (colorSuccess / neutral gray), so status stays correct and readable
 * across light, dark, and compact mode without any module-specific color logic.
 */
export const extensionStatusTagColor: Record<ExtensionStatus, string> = {
  enabled: "success",
  disabled: "default",
};

/** Fields matched by fetchExtensions' search filter (see extension.service.ts). */
export const searchableExtensionFields: (keyof Extension)[] = [
  "extension",
  "effectiveCallerIdName",
  "outboundCallerIdName",
  "domain",
  "description",
];

/** How many consecutive extension numbers the Add form creates for the entered base number. */
export const extensionRangeOptions = [
  1, 10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 150, 200, 250, 500, 750, 1000, 5000,
];

export const missedCallAppOptions = [{ label: "Email", value: "email" }];

export const userRecordOptions = [
  { label: "Disabled", value: "disabled" },
  { label: "All", value: "all" },
  { label: "Local", value: "local" },
  { label: "Inbound", value: "inbound" },
  { label: "Outbound", value: "outbound" },
];
export const SIPForceContactOptions = [
  {
    label: "Rewrite Contact IP and Port",
    value: "rewrite_contact_IP_and_port",
  },
  {
    label: "Rewrite Contact IP and Port 2.0",
    value: "rewrite_contact_IP_and_port_2",
  },
  { label: "Rewrite TLS Contact Port", value: "rewrite_TLS_contact_port" },
];

export const sipBypassMediaOptions = [
  { label: "Bypass Media", value: "bypass_media" },
  { label: "Bypass Media After Bridge", value: "bypass_media_after_bridge" },
  { label: "Proxy Media", value: "proxy_media" },
];

export const voicemailFileOptions = [
  { label: 'Audio file attachment', value: 'attach' },
  { label: 'Listen Link (login required)', value: 'listen_link' },
  { label: 'Download Link (no login required)', value: 'download_link' }
];


/** Add/Edit form-section permission strings. These arrive as server-only fields / user grants. */
export const extensionPermissionStrings = {
  basicEdit: "pbx_extensionbasic_edit",
  basicView: "pbx_extensionbasic_view",
  advancedEdit: "pbx_extensionadvanced_edit",
  advancedView: "pbx_extensionadvanced_view",
  add: "pbx_extension_add",
  /** Module-admin wildcard — gates Show All, and Add/Import/Export with `add` (extension.md §14). */
  all: "pbx_extension_all",
  /** Global wildcards — Copy is allowed for these or `add` (extension.md §14). */
  admin: "pbx_admin",
  axionTech: "pbx_axiontech",
} as const;

const VOICEMAIL_PASSWORD_CHARS = "0123456789";

/**
 * Add-mode default voicemail password: a 6-digit random numeric string. Only digits are
 * allowed so the resulting PIN can be read back / shared without ambiguity.
 */
export const generateStrongPassword = (): string =>
  Array.from(
    { length: 6 },
    () => VOICEMAIL_PASSWORD_CHARS[Math.floor(Math.random() * VOICEMAIL_PASSWORD_CHARS.length)],
  ).join("");

/**
 * Add-mode form defaults, driven by the Hive User Details response (auto extension number,
 * account code, domain) plus the fixed Axion option defaults. Edit mode never uses this —
 * it initializes from the extension details API response instead.
 */
export const getDefaultExtensionFormValues = (hive: HiveUserDetails): ExtensionFormValues => ({
  range: 1,
  extension: hive.autoExt,
  accountcode: hive.accountNumber,
  limit_max: "5",
  limit_destination: "!USER_BUSY",
  missed_call_app: "",
  call_timeout: "30",
  user_record: "",
  user_context: hive.newDomainName || hive.defaultDomain,
  sip_force_contact: "",
  sip_bypass_media: "",
  voicemail_file: "",
  call_screen_enabled: false,
  force_ping: false,
  directory_visible: true,
  directory_exten_visible: true,
  voicemail_transcription_enabled: true,
  voicemail_local_after_email: true,
  voicemail_enabled: true,
  enabled: true,
  voicemail_password: generateStrongPassword(),
});
