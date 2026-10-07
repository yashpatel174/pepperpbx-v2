import type { IVRMenuHiveDetails } from './ivr-menu.types'
import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Ant Design validation rules for the IVR Menu Add/Edit form and Copy modal — the audit's Yup
 * schemas (ivr-menus.md §10) re-expressed as `Form.Item` rules. Messages are Axion's.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
/** Digits, optionally prefixed with `**` (Axion's `CommonExtInput`, §26). */
const EXTENSION_PATTERN = /^(?:\*\*)?\d+$/

/**
 * Non-negative whole number of 1..`maxDigits` digits — no sign, decimal or whitespace can get in
 * (§10 "Only numbers are allowed, with a maximum length of N digits").
 */
const digitsRule = (maxDigits: number) => ({
  pattern: new RegExp(`^\\d{1,${maxDigits}}$`),
  message: `Only numbers are allowed, with a maximum length of ${maxDigits} digits`,
})

export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

/**
 * Required, `**?digits`, inside the domain's server-provided range, not reserved (§10/§26). The
 * range always comes from the Hive bootstrap, never hardcoded. A missing bound skips that check.
 */
export const extensionRules = (hive: Pick<IVRMenuHiveDetails, 'additionalExtStart' | 'additionalExtEnd' | 'additionalExtExclude'>) => [
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

/**
 * Extension rules while the selected domain's range isn't known (still loading, or its Hive request
 * failed): never validated against another domain's range — the field simply can't pass until the
 * right range arrives, which also blocks Save.
 */
export const extensionUnavailableRules = (reason: string) => [
  { required: true, message: 'Extension required in number' },
  {
    validator: async () => {
      throw new Error(reason)
    },
  },
]

/** Human-readable range for tooltips and the range error. */
export const describeExtensionRange = (hive: Pick<IVRMenuHiveDetails, 'additionalExtStart' | 'additionalExtEnd'>) => {
  const { additionalExtStart: start, additionalExtEnd: end } = hive
  if (start !== undefined && end !== undefined) return `between ${start} and ${end}`
  if (start !== undefined) return `${start} or higher`
  if (end !== undefined) return `${end} or lower`
  return 'any number'
}

export const greetLongRules = [{ required: true, message: 'Greet Long is required.' }, noEdgeWhitespaceRule]
export const timeoutRules = [{ required: true, message: 'Timeout is required.' }, digitsRule(5)]
export const contextRules = [{ required: true, message: 'Context is required.' }]
export const domainRules = [{ required: true, message: 'Domain required' }]

// Advanced (§8/§10)
export const pinRules = [digitsRule(20)]
export const confirmAttemptsRules = [{ required: true, message: 'Confirm attempts is required.' }, digitsRule(20)]
export const interDigitTimeoutRules = [digitsRule(5)]
export const maxFailuresRules = [{ required: true, message: 'Max failures is required.' }, digitsRule(20)]
export const maxTimeoutsRules = [{ required: true, message: 'Max timeouts is required.' }, digitsRule(5)]
export const digitLengthRules = [{ required: true, message: 'Digit length is required.' }, digitsRule(20)]
