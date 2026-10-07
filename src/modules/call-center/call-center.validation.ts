import type { HiveCallCenterDetails } from './call-center.types'
import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit/Copy Call Center Queue forms. Kept here
 * (not inline in the form sections) so every field using a given rule shares the exact validator —
 * Call-Center-owned, matching every sibling module's own module-local convention.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const DIGITS_PATTERN = (max: number) => new RegExp(`^\\d{0,${max}}$`)

/** call-center.md §10: "Name required" / "Name should be only of alphabets and numbers". */
export const nameRequiredRule = { required: true, message: 'Name is required' }
export const nameFormatRule = {
  pattern: ALPHANUMERIC_WITH_SPACE_PATTERN,
  message: 'Name should be only of alphabets and numbers',
}

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only (call-center.md §10). */
/** Optional numeric fields, ≤20 digits (call-center.md §10's shared numeric-field rule). */
export const numericUpTo20DigitsRule = {
  pattern: DIGITS_PATTERN(20),
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

export const requiredSelectRule = (message: string) => ({ required: true, message })

/**
 * `queue_extension` (and the Copy popup's `new_extension`, which the audit documents as sharing
 * "the same extension-range rule as queue form" — call-center.md §8/§9): required, numeric, and
 * within the domain's server-provided range, excluding any reserved numbers. The range itself is
 * NOT hardcoded here — it's read from the Hive bootstrap response (call-center.md §26/§33:
 * "PepperPBX must preserve this exact range", sourced from `additionalExtStart/End/Exclude` in
 * Axion), matching the server-driven-range pattern the audit describes rather than a frontend
 * constant.
 */
export const extensionRangeRule = (hive: Pick<HiveCallCenterDetails, 'extensionRangeStart' | 'extensionRangeEnd' | 'extensionExclude'>) => [
  { required: true, message: 'Extension is required' },
  { pattern: /^\d+$/, message: 'Extension must be numeric' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value || !/^\d+$/.test(value)) return
      const numeric = Number(value)
      if (numeric < hive.extensionRangeStart || numeric > hive.extensionRangeEnd) {
        throw new Error(`Value must be between ${hive.extensionRangeStart} and ${hive.extensionRangeEnd}`)
      }
      if (hive.extensionExclude.includes(value)) {
        throw new Error('This extension is reserved and cannot be used.')
      }
    },
  },
]

export const descriptionRules = [noEdgeWhitespaceRule]
