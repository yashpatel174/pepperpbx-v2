import type {
  Destination,
  DestinationFormValues,
  DestinationType,
  ExportFieldOption,
  HiveDestinationDetails,
  ImportDelimiter,
  ImportEnclosure,
  SelectOption,
} from "./destination.types";

export const defaultPageSize = 10;

export const pageSizeOptions = [10, 25, 50, 100, 200];

export const typeOptions: { label: string; value: DestinationType }[] = [
  { label: "Inbound", value: "inbound" },
  { label: "Outbound", value: "outbound" },
  { label: "Local", value: "local" },
];

export const destinationStatusLabels: Record<"enabled" | "disabled", string> = {
  enabled: "Enabled",
  disabled: "Disabled",
};

/** Ant Design Tag preset color names (not hex) — resolve through the active theme's tokens. */
export const destinationStatusTagColor: Record<"enabled" | "disabled", string> = {
  enabled: "success",
  disabled: "default",
};

/** Fields matched by fetchDestinations' search filter (see destination.service.ts). */
export const searchableDestinationFields: (keyof Destination)[] = ["destination", "context", "description", "domain"];

export const delimiterOptions: { label: string; value: ImportDelimiter }[] = [
  { label: "Comma (,)", value: "," },
  { label: "Pipe (|)", value: "|" },
  { label: "Tab", value: "\t" },
];

export const enclosureOptions: { label: string; value: ImportEnclosure }[] = [
  { label: 'Double Quote (")', value: '"' },
  { label: "Space", value: " " },
];

/**
 * Which CSV row import actually starts reading data from (skips header + optional notes rows).
 * A clean 2..50 range — the Axion reference's own list has a confirmed duplicate-label quirk
 * (value 51 labelled "15") that is deliberately not reproduced here (see destinations.md §33).
 */
export const fromRowOptions: SelectOption[] = Array.from({ length: 49 }, (_, index) => {
  const value = String(index + 2);
  return { label: value, value };
});

/** Functional CSV size cap — 10MB, per the audit's documented Yup rule, not Axion's looser 80MB UI restriction (a confirmed inconsistency, see destinations.md §28/§33). */
export const maximumCsvFileSizeBytes = 10 * 1024 * 1024;

export const csvFileNameRule = /^[a-zA-Z0-9_-]+$/;

/**
 * Known DB field keys the CSV import can auto-match a column against (by normalized header
 * name). Kept local to this module — not a generic import framework, just Destinations' own
 * field set (see ImportMatchDestinationPage / destination.service.ts's importDestinations).
 */
export const destinationCsvFieldKeys: string[] = [
  "destination_type",
  "destination_number",
  "destination_prefix",
  "destination_trunk_prefix",
  "destination_area_code",
  "destination_context",
  "destination_description",
  "destination_caller_id_name",
  "destination_caller_id_number",
  "domain_name",
  "destination_order",
  "destination_enabled",
];

/** Required DB fields for the import-match step (destinations.md §8/§10). */
export const requiredImportMatchFields = ["destination_type", "destination_number"];

/** Field list offered by the Export drawer's Select All + per-field checkboxes. */
export const exportFieldOptions: ExportFieldOption[] = [
  {
    key: "domain_uuid",
    label: "Domain",
  },
  {
    key: "fax_uuid",
    label: "Fax Detection",
  },
  {
    key: "destination_type",
    label: "Type",
  },
  {
    key: "destination_number",
    label: "Destination",
  },
  {
    key: "destination_trunk_prefix",
    label: "Trunk Prefix",
  },
  {
    key: "destination_area_code",
    label: "Area Code",
  },
  {
    key: "destination_prefix",
    label: "Country Code",
  },
  {
    key: "destination_caller_id_name",
    label: "Caller ID Name",
  },
  {
    key: "destination_caller_id_number",
    label: "Caller ID Number",
  },
  {
    key: "destination_cid_name_prefix",
    label: "Caller ID Name Prefix",
  },
  {
    key: "destination_context",
    label: "Context",
  },
  {
    key: "destination_record",
    label: "Record",
  },
  {
    key: "destination_hold_music",
    label: "Hold Music",
  },
  {
    key: "destination_accountcode",
    label: "Account Code",
  },
  {
    key: "destination_type_voice",
    label: "Voice",
  },
  {
    key: "destination_type_fax",
    label: "Fax",
  },
  {
    key: "destination_type_emergency",
    label: "Emergency",
  },
  {
    key: "destination_type_text",
    label: "Text",
  },
  {
    key: "destination_app",
    label: "Actions App",
  },
  {
    key: "destination_data",
    label: "Actions Data",
  },
  {
    key: "destination_alternate_app",
    label: "Alternate Actions App",
  },
  {
    key: "destination_alternate_data",
    label: "Alternate Actions Data",
  },
  {
    key: "destination_order",
    label: "Order",
  },
  {
    key: "destination_enabled",
    label: "Enabled",
  },
  {
    key: "destination_description",
    label: "Description",
  },
];

/**
 * Coarse, single permission gate — mirrors Gateways' model (useGatewayPermissions) and the
 * audit's own documented "coarse single permission" (pbx_destinations_admin, see
 * destinations.md §14/§33): one key, not a per-action split. Deliberately not reused from
 * Gateways/Extensions — this module owns its own placeholder string per CLAUDE.md's naming rule.
 */
export const destinationPermission = "destination.manage";

/**
 * Axion's `pbx_admin || pbx_axiontech` gate on the Actions / Alternate Actions / Hold Music
 * select ↔ free-text toggle (ToggleSelectInput's `canToggle`).
 */
export const destinationFreeTextPermissions = ["pbx_admin", "pbx_axiontech"] as const;

/**
 * Add-mode form defaults, driven by Hive bootstrap data (default domain, account code) plus the
 * fixed Axion defaults (type inbound, context public, order 100, enabled). Edit mode never uses
 * this — it initializes from the destination details response instead.
 */
export const getDefaultDestinationFormValues = (hive: HiveDestinationDetails): DestinationFormValues => ({
  destination_type: "inbound",
  destination_number: "",
  destination_context: "public",
  destination_accountcode: hive.accountNumber,
  domain_name: hive.defaultDomain,
  destination_order: 100,
  destination_type_voice: false,
  destination_type_fax: false,
  destination_type_text: false,
  destination_type_emergency: false,
  destination_record: false,
  sms_enabled: false,
  destination_enabled: true,
});
