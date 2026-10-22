export interface SelectOption {
  label: string
  value: string
}

/** One ordered gateway select option — domain-scoped (outbound-routes.md §12's dedicated GATEWAYS_LIST endpoint, not the Gateways module's own CRUD list). */
export type OutboundRouteGatewayOption = SelectOption

export interface OutboundRoute {
  id: string
  /** Falls back to `context` when falsy, and displays 'global' as 'Global' — see outbound-route.service.ts's toListOutboundRoute (outbound-routes.md §5/§27). */
  domain: string
  name: string
  number?: string
  context?: string
  order: number
  enabled: boolean
  description?: string
}

export interface OutboundRouteListQuery {
  page?: number
  pageSize?: number
  showAll?: boolean
  search?: string
}

export interface OutboundRouteListResponse {
  data: OutboundRoute[]
  page: number
  pageSize: number
  total_records: number
  total_pages: number
}

/**
 * GET /api/hiveuser/details?module=OutboundRoutes&domain_name=... — Add/Edit bootstrap.
 * NOTE: the Axion reference's real bootstrap call uses the singular `module=OutboundRoute`
 * (outbound-routes.md §12/§28/§33, a confirmed inconsistency vs the plural module/route name) —
 * PepperPBX intentionally uses the plural form matching this module's own name instead of
 * reproducing that inconsistency. BACKEND CONTRACT REQUIRED either way.
 */
export interface HiveOutboundRouteDetails {
  defaultDomain: string
  domainOptions: string[]
  accountNumber: string
  /** Suggested/default SBC domain value for the Add form — the full option list comes from the separate getSbcDomains() call. */
  sbcDomainIp: string
}

export type SbcDomainOption = SelectOption


/**
 * What the Add/Edit form actually collects — ONE shared shape for both modes (CLAUDE.md's "one
 * shared form per module" rule), unlike the Axion reference's two differently-named/shaped forms
 * (BasicForm vs DialplanBasicForm, outbound-routes.md §8). Fields that only make sense in one mode
 * stay optional and are simply not rendered by OutboundRouteForm in the other mode:
 *  - dialplan_number / hostname / dialplan_continue / dialplan_destination: Edit-only in the Axion
 *    reference (no Add-form equivalent) — rendered only when mode === 'edit'.
 *  - prefix_number / limit / toll_allow / dialplan_expression: Add-only in the Axion reference
 *    (Edit only reaches these via the raw XML screen) — rendered only when mode === 'create'.
 * dialplan_order stays numeric (matches the audit's confirmed 100-999 select, outbound-routes.md §8).
 *
 * `gateways` is a deliberate PepperPBX deviation from the Axion reference: Axion's Edit form never
 * exposes the gateway list directly (only via the raw XML screen), but Gateway selection is
 * rendered — and validated — in both Add and Edit here, reusing the exact same
 * OutboundRouteGatewaysSection/options/validation in both modes.
 */
export interface OutboundRouteFormValues {
  outbound_route_name: string
  outbound_caller_id_name?: string
  outbound_caller_id_number: string
  prefix_number?: string
  limit?: string
  /** Always read-only — server/hive-derived, never user-editable in either mode. */
  accountcode: string
  /** Editable on Add, locked (disabled) on Edit — see outbound-routes.md §15/§22. */
  domain_name: string
  /** Always read-only once set — locked on Edit; not shown on Add (server-derived from domain_name). */
  dialplan_context?: string
  sbcDomainIp: string
  toll_allow?: string
  dialplan_order: number
  dialplan_description?: string
  pin_numbers_enabled: boolean
  dialplan_enabled: boolean
  /** Edit-only routing flags (outbound-routes.md §8's DialplanBasicForm). Default false, not shown on Add. */
  dialplan_continue: boolean
  dialplan_destination: boolean
  /** Edit-only "Number"/"Hostname" fields — on Add these are left undefined; the service derives
   * a sensible Number for the list column (see outbound-route.service.ts's toDetails). */
  dialplan_number?: string
  hostname?: string
  /** Required only on create — PepperPBX's normal-newline expression, not Axion's `'\n'->'fusion'` transform (outbound-routes.md §27/§28/§33; see outbound-route.constants.ts). */
  dialplan_expression: string
  /** Ordered gateway values; first entry can't be removed (outbound-routes.md §8/§21/§26). Required (min 1) in both create and edit. */
  gateways: string[]
}

/** The stored/API record shape — the create/update form model as returned by the server. */
export interface OutboundRouteDetails extends OutboundRouteFormValues {
  dialplan_uuid: string
}

export interface OutboundRouteXml {
  dialplan_uuid: string
  /** `null` when the route has no stored XML yet — distinct from a saved-but-empty document (`''`). See DialplanXmlPage.tsx's EmptyState handling. */
  xml: string | null
}
