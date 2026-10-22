import { noEdgeWhitespaceRule } from '../../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit Outbound Route form. Kept here (not inline
 * in the form sections) so both modes use the exact same validators. Outbound-Routes-owned —
 * deliberately not imported from Extensions/Gateways/Destinations, matching their own
 * module-local convention.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const DIGITS_PATTERN = (max: number) => new RegExp(`^\\d{0,${max}}$`)
const REQUIRED_DIGITS_PATTERN = (max: number) => new RegExp(`^\\d{1,${max}}$`)
const IP_OR_PORT_PATTERN = /^(?:(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(:\d{1,5})?$/
const DOMAIN_OR_PORT_PATTERN = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?$/

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only. */
/** outbound_route_name: required, alphanumeric + space — matches the audit's `alphaNumericWithSpace` rule. */
export const routeNameRule = {
  pattern: ALPHANUMERIC_WITH_SPACE_PATTERN,
  message: 'Outbound Route Name should be only of alphabets and numbers',
}

/** outbound_caller_id_number / limit / prefix_number / dialplan_number: optional-or-required digits, max 20. */
export const maxTwentyDigitsRule = {
  pattern: DIGITS_PATTERN(20),
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

export const callerIdNumberRules = [
  { required: true, message: 'Outbound Caller ID Number is required' },
  { pattern: REQUIRED_DIGITS_PATTERN(20), message: 'Only numbers are allowed, with a maximum length of 20 digits' },
  noEdgeWhitespaceRule,
]

/** hostname (Edit only): optional, IP-or-domain format — matches the audit's ip/domain regex pair. */
export const ipOrDomainRule = {
  validator: (_: unknown, value?: string) => {
    if (!value) return Promise.resolve()
    if (IP_OR_PORT_PATTERN.test(value) || DOMAIN_OR_PORT_PATTERN.test(value)) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('Invalid Domain name or IP address format'))
  },
}

/** outbound_route_name uniqueness — mirrors Extensions'/Gateways' async duplicate-name validators. */
export const routeNameRules = (isTaken: (name: string, excludeUuid?: string) => Promise<boolean>, excludeUuid?: string) => [
  { required: true, message: 'Outbound Route Name is required' },
  routeNameRule,
  noEdgeWhitespaceRule,
  {
    validator: async (_: unknown, value?: string) => {
      if (!value) return
      if (await isTaken(value, excludeUuid)) {
        throw new Error('This outbound route name is already in use.')
      }
    },
  },
]
