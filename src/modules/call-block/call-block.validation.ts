import { callBlockNumberLabel } from './call-block.constants'
import type { CallBlockDirection } from './call-block.types'
import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit Call Block form. Kept here (not inline in
 * the form section) so both modes use the exact same validators. Call-Block-owned — deliberately
 * not imported from other modules, matching their own module-local convention.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
/** No leading zero, 1-20 digits total — matches the audit's `maxTwentyNumberWithoutZero` (call-block.md §8/§10). */
const NUMBER_NO_LEADING_ZERO_PATTERN = /^[1-9]\d{0,19}$/
const COUNTRY_CODE_PATTERN = /^\d{0,5}$/

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only. */
/** call_block_name: alphanumeric + space (call-block.md §10). */
export const nameFormatRule = {
  pattern: ALPHANUMERIC_WITH_SPACE_PATTERN,
  message: 'Name should be only of alphabets and numbers',
}

/** call_block_number: numeric, no leading zero, ≤20 digits (call-block.md §8/§10). */
export const numberFormatRule = {
  pattern: NUMBER_NO_LEADING_ZERO_PATTERN,
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

/** call_block_country_code: optional, numeric, ≤5 digits (call-block.md §8/§10). */
export const countryCodeRule = {
  pattern: COUNTRY_CODE_PATTERN,
  message: 'Only numbers are allowed, with a maximum length of 5 digits',
}

/**
 * Mutual required-if-other-empty validation between `call_block_name` and `call_block_number`
 * (call-block.md §8/§9/§10/§26/§33) — at least one must be provided. These are factories (not
 * plain rule objects) so the calling section can supply a live read of the *other* field's value
 * (via `form.getFieldValue`) without this module owning a Form instance itself.
 */
export const nameRequiredIfNumberEmptyRule = (getNumberValue: () => string | undefined) => ({
  validator: async (_: unknown, value?: string) => {
    if (!value && !getNumberValue()) {
      throw new Error('Caller ID Name is required if Number is empty')
    }
  },
})

/** Error message adapts to direction, matching the audit exactly (call-block.md §9/§200). */
export const numberRequiredIfNameEmptyRule = (getNameValue: () => string | undefined, direction: CallBlockDirection) => ({
  validator: async (_: unknown, value?: string) => {
    if (!value && !getNameValue()) {
      throw new Error(`${callBlockNumberLabel(direction)} is required if Caller ID Name is empty`)
    }
  },
})

export const descriptionRules = [noEdgeWhitespaceRule]
