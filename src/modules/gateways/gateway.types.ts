import React from "react";

export interface Gateway {
  id: string;
  gateway: string;
  gateway_uuid?: string;
  /** Projected from domain_name; falls back to 'Global' when falsy or literally 'global' — see gateway.service.ts's toListGateway. */
  domain: string;
  context?: string;
  /** Drives the Gateway Action (Start/Stop) pill — 'Stopped' shows Start, anything else shows Stop. Exact backend value set is unconfirmed. */
  status?: string;
  gatewayaction: "Started" | "Stopped";
  /** Whether this gateway registers with a SIP server — gates the Gateway Action pill's visibility. */
  register: boolean;
  /** Informational only per the Axion audit — not confirmed to be tied to any action here. */
  state?: string;
  hostname?: string;
  enabled: boolean;
  description?: string;
}

export interface GatewayListQuery {
  page?: number;
  pageSize?: number;
  showAll?: boolean;
  search?: string;
  domain?: string;
}

export interface GatewayListResponse {
  data: Gateway[];
  page: number;
  pageSize: number;
  total_records: number;
  total_pages: number;
}

/** GET /api/hiveuser/details?module=Gateways&domain_name=... — Add/Edit bootstrap (domain options). */
export interface HiveGatewayDetails {
  defaultDomain: string;
  domainOptions: string[];
}

export interface SbcDomainOption {
  label: string;
  value: string;
}

export interface SipProfileOption {
  label: string;
  value: string;
}

/**
 * What the Add/Edit form actually collects. The three numeric fields stay as validated strings
 * in the form and are converted to numbers only at the service boundary (see gateway.service.ts's
 * toDetails) — same convention as Extensions' ExtensionFormValues, applied independently here.
 */
export interface GatewayFormValues {
  gateway: string;
  username?: string;
  password?: string;
  from_user?: string;
  domain_name: string;
  sbcDomainIp: string;
  proxy: string;
  realm?: string;
  expire_seconds: number;
  retry_seconds: number;
  context?: string;
  profile?: string;
  register: boolean;
  enabled: boolean;
  description?: string;
  // Advanced Settings
  distinct_to: boolean;
  caller_id_in_from: boolean;
  supress_cng: boolean;
  extension_in_contact: boolean;
  auth_username?: string;
  extension?: string;
  register_transport?: string;
  register_proxy?: string;
  outbound_proxy?: string;
  sip_cid_type?: string;
  codec_prefs?: string;
  ping?: number;
  ping_min?: number;
  ping_max?: number;
  channels?: number;
  hostname?: string;
}

/**
 * The stored/API record shape. `enabled` is modeled as a real boolean here (a mock-only
 * simplification) — BACKEND CONTRACT REQUIRED: the Axion reference returns `enabled` as the
 * string `'true'`/`'false'`, so a real integration must normalize on read.
 */
export interface GatewayDetails extends Omit<
  GatewayFormValues,
  "expire_seconds" | "retry_seconds" | "channels"
> {
  gateway_uuid?: string;
  status?: string;
  state?: string;
  expire_seconds: number;
  retry_seconds: number;
  channels?: number;
}

export interface CreateGatewayApiResponse {
  success: boolean;
  message: string;
  data: GatewayDetails;
}

export interface GatewayApiResponse {
  success: boolean;
  message: string;
  data: Gateway[];
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface GatewayDetailsResponse {
  success: boolean;
  message: string;
  data: GatewayFormValues;
}

export interface GatewayToggleResponse {
  success: boolean;
  message: string;
  data: {
    totalRequested: number;
    totalUpdated: number;
    gateways: {
      gateway_uuid: string;
      enabled: boolean;
    }[];
  };
}

export interface PendingConfirm {
  title: string;
  content: React.ReactNode;
  confirmText: string;
  errorMessage: string;
  bulk: boolean;
  danger?: boolean;
  run: (value?: string) => Promise<void>;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}
