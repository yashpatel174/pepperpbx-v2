import type { CallFlowHiveDetails } from './call-flows.types'

/**
 * Ant Design validation rules for the Call Flow Add/Edit form and Copy modal — the audit's Yup
 * schemas (call-flows.md §10) re-expressed as `Form.Item` rules.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/
/** Digits, optionally prefixed with `**` (§10). */
const EXTENSION_PATTERN = /^(?:\*\*)?\d+$/
/** Optional PIN: 1–20 digits, so no sign, decimal or whitespace can get in (§10). */
const PIN_PATTERN = /^\d{1,20}$/

/** Axion's lower-bound fallback when the bootstrap omits `additionalExtStart` (§10). */
const DEFAULT_EXTENSION_RANGE_START = 100

export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

/**
 * Required, `**?digits`, inside the domain's server-provided range and not reserved (§10). The
 * range is read from the Hive bootstrap, never hardcoded. Unlike Axion, a missing upper bound skips
 * that check rather than failing every value (§28).
 */
export const extensionRules = (hive: Pick<CallFlowHiveDetails, 'additionalExtStart' | 'additionalExtEnd' | 'additionalExtExclude'>) => [
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

/** Human-readable range for tooltips. */
export const describeExtensionRange = (hive: Pick<CallFlowHiveDetails, 'additionalExtStart' | 'additionalExtEnd'>) => {
  const start = hive.additionalExtStart ?? DEFAULT_EXTENSION_RANGE_START
  return hive.additionalExtEnd !== undefined ? `between ${start} and ${hive.additionalExtEnd}` : `${start} or higher`
}

/**
 * Generated `flow+*<ext>` value (§8/§10). Axion's message here talks about "numbers, max 20 digits",
 * which contradicts the generated value it accepts; PepperPBX uses the whitespace message instead.
 */
export const featureCodeRules = [{ required: true, message: 'Feature code required' }, noEdgeWhitespaceRule]

export const pinRules = [{ pattern: PIN_PATTERN, message: 'Only numbers are allowed, with a maximum length of 20 digits' }]

/** Axion's message here reads "Destination label required" (§10 wording quirk) — corrected. */
export const destinationRules = [{ required: true, message: 'Destination required' }, noEdgeWhitespaceRule]
export const destinationLabelRules = [{ required: true, message: 'Destination Label required' }, noEdgeWhitespaceRule]
export const alternateDestinationRules = [{ required: true, message: 'Alternate destination required' }, noEdgeWhitespaceRule]
export const alternateLabelRules = [{ required: true, message: 'Alternate Label required' }, noEdgeWhitespaceRule]

export const domainRules = [{ required: true, message: 'Domain required' }]
