import type { TimeConditionHiveDetails } from './time-condition.types'

/**
 * Ant Design validation rules for the Time Condition Add/Edit form — the audit's Yup schema
 * (time-conditions.md §10) re-expressed as `Form.Item` rules.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/
/** Axion's `validationRegex.extensionNum`: digits, optionally prefixed with `**` (§10). No sign or decimal. */
const EXTENSION_PATTERN = /^(?:\*\*)?\d+$/

/** Axion's lower-bound fallback when the bootstrap omits `additionalExtStart` (§10). */
const DEFAULT_EXTENSION_RANGE_START = 100

const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

/**
 * Required, `**?digits`, inside the domain's server-provided range (after stripping `**`) and not
 * reserved (§10). The range is read from the Hive bootstrap, never hardcoded. Unlike Axion, a
 * missing upper bound skips that check rather than failing every value (§28).
 */
export const extensionRules = (
  hive: Pick<TimeConditionHiveDetails, 'additionalExtStart' | 'additionalExtEnd' | 'additionalExtExclude'>
) => [
  { required: true, message: 'Extension required in number' },
  { pattern: EXTENSION_PATTERN, message: 'Only numbers are allowed, optionally prefixed with "**"' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value || !EXTENSION_PATTERN.test(value)) return
      const digits = value.replace(/^\*\*/, '')
      const numeric = Number(digits)
      const start = hive.additionalExtStart ?? DEFAULT_EXTENSION_RANGE_START
      const end = hive.additionalExtEnd
      if (numeric < start || (end !== undefined && numeric > end)) {
        throw new Error(end !== undefined ? `Value must be between ${start} and ${end}` : `Value must be at least ${start}`)
      }
      if (hive.additionalExtExclude.includes(digits) || hive.additionalExtExclude.includes(value)) {
        throw new Error('This extension is reserved, you can not use this extension.')
      }
    },
  },
]

export const timeGroupRules = [{ required: true, message: 'Time Group required' }]

export const timeMatchActionRules = [{ required: true, message: 'Time Match Action required' }, noEdgeWhitespaceRule]
export const timeNotMatchActionRules = [{ required: true, message: 'Time Not Match Action required' }, noEdgeWhitespaceRule]

export const domainRules = [{ required: true, message: 'Domain required' }]
