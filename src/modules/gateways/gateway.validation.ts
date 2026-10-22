import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit Gateway form. Kept here (not inline in
 * GatewayForm) so Add and Edit use the exact same validators. Gateway-owned — deliberately not
 * shared with or imported from the Extensions module.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NUMERIC_TWENTY_PATTERN = /^\+?[0-9]{0,20}$/
// IP (optional :port) or a domain name (optional :port) — Gateway's proxy/realm/hostname fields
// are "IP-or-domain format", not CIDR notation (that's an Extensions-specific need).
const IP_OR_PORT_PATTERN = /^(?:(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(:\d{1,5})?$/
const DOMAIN_OR_PORT_PATTERN = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?$/

export const gatewayNameRule = {
  pattern: ALPHANUMERIC_WITH_SPACE_PATTERN,
  message: 'Gateway should be only of alphabets and numbers',
}

/** Optional numeric string: no whitespace, optional leading `+`, at most 20 digits. */
export const numericFieldRule = {
  pattern: NUMERIC_TWENTY_PATTERN,
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

export const ipOrDomainRule = {
  validator: (_: unknown, value?: string) => {
    if (!value) return Promise.resolve()
    if (IP_OR_PORT_PATTERN.test(value) || DOMAIN_OR_PORT_PATTERN.test(value)) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('Invalid Domain name or IP address format'))
  },
}
