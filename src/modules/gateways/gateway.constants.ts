import type { GatewayFormValues, HiveGatewayDetails } from './gateway.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

/** Literal "Global" entry always precedes the fetched domain list, per the Axion reference. */
export const GLOBAL_DOMAIN_OPTION = { label: 'Global', value: 'global' }

export const registerTransportOptions = [
  { label: 'UDP', value: 'udp' },
  { label: 'TCP', value: 'tcp' },
  { label: 'TLS', value: 'tls' },
]

/**
 * Gateways has a single coarse, all-or-nothing permission gate in the Axion reference
 * (`WILDCARD_PERMISSION.pbx_axiontech`) rather than a per-action split like Extensions'
 * basic/advanced view/edit set. Following CLAUDE.md's `<module>.<action>` naming rule — this is
 * a placeholder, NOT the final backend contract, and deliberately does not reuse Axion's literal
 * string. Gates: Save button visibility (Add/Edit), Edit/Copy/Delete row actions, and the list's
 * 403 fallback.
 */
export const gatewayPermission = 'gateway.manage'

/**
 * Add-mode form defaults, driven by Hive bootstrap data (default domain) plus the fixed Axion
 * defaults. Edit mode never uses this — it initializes from the gateway details response instead.
 */
export const getDefaultGatewayFormValues = (hive: HiveGatewayDetails): GatewayFormValues => ({
  gateway: '',
  domain_name: hive.defaultDomain,
  sbcDomainIp: '',
  proxy: '',
  expire_seconds: '800',
  retry_seconds: '30',
  context: 'public',
  register: true,
  enabled: true,
  distinct_to: false,
  caller_id_in_from: false,
  supress_cng: false,
  extension_in_contact: false,
})
