import type { HiveOutboundRouteDetails, OutboundRoute, OutboundRouteFormValues, SelectOption } from './outbound-route.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

export const outboundRouteStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by fetchOutboundRoutes' search filter (see outbound-route.service.ts). */
export const searchableOutboundRouteFields: (keyof OutboundRoute)[] = ['name', 'number', 'context', 'description', 'domain']

/**
 * Order select options — confirmed by the audit as a 100-999 range shared by both Add and Edit
 * (outbound-routes.md §8's `orderOptions`), unlike Destinations' order field where the Axion
 * reference's exact option list isn't confirmed (that module uses a plain bounded InputNumber
 * instead). Generated once at module load, not per-render.
 */
export const orderOptions: SelectOption[] = Array.from({ length: 900 }, (_, index) => {
  const value = String(index + 100)
  return { label: value, value }
})

export const defaultDialplanOrder = 100

/**
 * Dialplan-expression shortcut presets — the Axion reference's own `dialplanExpressionOptions`
 * (outbound-routes.md §2/§8/§9) describes these only as "number-digit/pattern presets" without
 * listing exact values, so this is a reasonable, clearly-labelled placeholder set of common
 * outbound dial-pattern shortcuts, not a reproduction of a confirmed literal list. Selecting one
 * writes its value into the free-form expression textarea, which stays fully user-editable
 * afterward — see OutboundRouteExpressionSection.tsx.
 */

export const dialplanExpressionPresets = [
  { value: '^(\\d{2})$', label: '2 Digits' },
  { value: '^(\\d{3})$', label: '3 Digits' },
  { value: '^(\\d{4})$', label: '4 Digits' },
  { value: '^(\\d{5})$', label: '5 Digits' },
  { value: '^(\\d{6})$', label: '6 Digits' },
  { value: '^(\\d{7})$', label: '7 Digits Local' },
  { value: '^(\\d{8})$', label: '8 Digits' },
  { value: '^(\\d{9})$', label: '9 Digits' },
  { value: '^(\\d{10})$', label: '10 Digits Long Distance' },
  { value: '^\\+?(\\d{11})$', label: '11 Digits Long Distance' },
  { value: '^\\+?1?([2-9]\\d{2}[2-9]\\d{2}\\d{4})$', label: 'North America' },
  { value: '^(011\\d{9,17})$', label: 'North America International' },
  {
    value:
      '^\\+?1?((?:264|268|242|246|441|284|345|767|809|829|849|473|658|876|664|787|939|869|758|784|721|868|649|340|684|671|670|808)\\d{7})$',
    label: 'North America Islands'
  },
  { value: '^(00\\d{9,17})$', label: 'Europe International' },
  { value: '^(\\d{12,20})$', label: 'International' },
  { value: '^(311)$', label: '311 Information' },
  { value: '^(411)$', label: '411 Information' },
  { value: '^(711)$', label: '711 TTY' },
  { value: '(^911$|^933$)', label: '911 Emergency' },
  { value: '(^988$)', label: '988 National Suicide Prevention Lifeline' },
  { value: '^1?(8(00|33|44|55|66|77|88)[2-9]\\d{6})$', label: 'Toll-Free' },
  { value: '^0118835100\\d{8}$', label: 'iNum 0118335100xxxxxxxx' },
  { value: '^9(\\d{2})$', label: 'Dial 9, then 2 Digits' },
  { value: '^9(\\d{3})$', label: 'Dial 9, then 3 Digits' },
  { value: '^9(\\d{4})$', label: 'Dial 9, then 4 Digits' },
  { value: '^9(\\d{5})$', label: 'Dial 9, then 5 Digits' },
  { value: '^9(\\d{6})$', label: 'Dial 9, then 6 Digits' },
  { value: '^9(\\d{7})$', label: 'Dial 9, then 7 Digits' },
  { value: '^9(\\d{8})$', label: 'Dial 9, then 8 Digits' },
  { value: '^9(\\d{9})$', label: 'Dial 9, then 9 Digits' },
  { value: '^9(\\d{10})$', label: 'Dial 9, then 10 Digits' },
  { value: '^9(\\d{11})$', label: 'Dial 9, then 11 Digits' },
  { value: '^9(\\d{12,20})$', label: 'Dial 9, then International' },
  { value: 'CUSTOM_PREFIX', label: 'Dial custom prefix, then Digits' }
];

/**
 * Coarse, single permission gate — mirrors Gateways'/Destinations' model (one key, not a
 * per-action split), matching the audit's own documented single coarse `pbx_outboundroutes`
 * permission (outbound-routes.md §14/§33). Deliberately not reused from another module — this
 * module owns its own placeholder string per CLAUDE.md's `<module>.<action>` naming rule.
 *
 * INTENTIONAL FIX vs the Axion reference: the audit's list Edit button is additionally gated by a
 * *separate* Axion-only `pbx_axiontech` check (onlyAxionTech), hiding Edit from ordinary
 * `pbx_outboundroutes` holders even though the Edit route/API are reachable by anyone who knows
 * the URL (outbound-routes.md §14/§28/§33 flags this as a confirmed UI/URL mismatch worth a
 * deliberate decision). PepperPBX gates Edit/Copy/Delete/Toggle behind this one coarse permission
 * only, consistent with every other module in this codebase — see CLAUDE.md's RBAC section.
 */
export const outboundRoutePermission = 'outboundRoute.manage'

/**
 * Add-mode form defaults. Confirmed Axion defaults (outbound-routes.md §18): pin_numbers_enabled
 * false, dialplan_enabled true. `dialplan_continue`/`dialplan_destination` default false — they're
 * Edit-only concepts with no Add-form equivalent to derive a default from. `gateways` starts with
 * one empty slot so the (required, min 1) Gateways section always has a row to fill in — matching
 * the audit's `[{gateway: ''}]` default and "first row can't be removed" rule.
 */
export const getDefaultOutboundRouteFormValues = (hive: HiveOutboundRouteDetails): OutboundRouteFormValues => ({
  outbound_route_name: '',
  outbound_caller_id_number: '',
  accountcode: hive.accountNumber,
  domain_name: hive.defaultDomain,
  sbcDomainIp: hive.sbcDomainIp,
  dialplan_order: defaultDialplanOrder,
  pin_numbers_enabled: false,
  dialplan_enabled: true,
  dialplan_continue: false,
  dialplan_destination: false,
  dialplan_expression: '',
  gateways: [''],
})
