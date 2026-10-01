import type { RingGroupHiveDetails } from './ring-group.types'

/**
 * Ant Design validation rules for the Ring Group Add/Edit form and Copy modal — the audit's Yup
 * schemas (ring-groups.md §10) re-expressed as `Form.Item` rules. Messages are Axion's.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/
/** Digits, optionally prefixed with `**` (§10). */
const EXTENSION_PATTERN = /^(?:\*\*)?\d+$/
const CALL_TIMEOUT_PATTERN = /^\d{1,3}$/
const NUMBER_20_PATTERN = /^\d{1,20}$/
/** One or more comma-separated emails, spaces around commas allowed (§10). */
const MULTI_EMAIL_PATTERN = /^\s*[^\s@,]+@[^\s@,]+\.[^\s@,]+\s*(,\s*[^\s@,]+@[^\s@,]+\.[^\s@,]+\s*)*$/

export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

/** Alphanumeric + space. Copy's name additionally rejects edge whitespace (§8); applied to both. */
export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

/**
 * Required, `**?digits`, inside the domain's server-provided range and not reserved (§10/§26). The
 * range is read from the Hive bootstrap, never hardcoded. A missing bound skips that check.
 */
export const extensionRules = (hive: Pick<RingGroupHiveDetails, 'additionalExtStart' | 'additionalExtEnd' | 'additionalExtExclude'>) => [
  { required: true, message: 'Extension required in number' },
  { pattern: EXTENSION_PATTERN, message: 'Extension required in number' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value || !EXTENSION_PATTERN.test(value)) return
      const digits = value.replace(/^\*\*/, '')
      const numeric = Number(digits)
      const start = hive.additionalExtStart
      const end = hive.additionalExtEnd
      if ((start !== undefined && numeric < start) || (end !== undefined && numeric > end)) {
        throw new Error(`Value must be ${describeExtensionRange(hive)}`)
      }
      if (hive.additionalExtExclude.includes(digits) || hive.additionalExtExclude.includes(value)) {
        throw new Error('This extension is reserved, you can not use this extension.')
      }
    },
  },
]

/** Human-readable range for messages and tooltips. */
export const describeExtensionRange = (hive: Pick<RingGroupHiveDetails, 'additionalExtStart' | 'additionalExtEnd'>) => {
  const { additionalExtStart: start, additionalExtEnd: end } = hive
  if (start !== undefined && end !== undefined) return `between ${start} and ${end}`
  if (start !== undefined) return `${start} or higher`
  if (end !== undefined) return `${end} or lower`
  return 'any number'
}

export const strategyRules = [{ required: true, message: 'Strategy is required.' }]

export const callTimeoutRules = [
  { required: true, message: 'Call timeout is required.' },
  { pattern: CALL_TIMEOUT_PATTERN, message: 'Only numbers are allowed, with a maximum length of 3 digits' },
]

/** Caller ID Number and Ring Group Forward: optional, numeric, ≤20 digits (§10). */
export const number20Rules = [{ pattern: NUMBER_20_PATTERN, message: 'Only numbers are allowed, with a maximum length of 20 digits' }]

/** Fixed CID Value: required while the CID mode is Fixed ID — only rendered then (§9/§10/§34.3). Optional leading `+`. */
const FIXED_CID_PATTERN = /^\+?[0-9]{0,20}$/

export const fixedCidValueRules = [
  { required: true, message: 'Fixed CID Value is required' },
  { pattern: FIXED_CID_PATTERN, message: 'Only numbers are allowed, with a maximum length of 20 digits' },
]

export const domainRules = [{ required: true, message: 'Context is required.' }]

/** Required only while Missed Call is Email — the field is only rendered then (§9/§10). */
export const missedCallEmailRules = [
  { required: true, message: 'Missed call email required' },
  { pattern: MULTI_EMAIL_PATTERN, message: 'You can add multiple emails with comma separated' },
]

export const destinationNumberRules = [{ required: true, message: 'Destination is required.' }, noEdgeWhitespaceRule]
