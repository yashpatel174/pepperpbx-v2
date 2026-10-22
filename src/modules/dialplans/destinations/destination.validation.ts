import { noEdgeWhitespaceRule } from '../../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit/Copy/Import Destination forms. Kept here
 * (not inline in the components) so every form using a given field shares the exact rule.
 * Destination-owned — deliberately not imported from Extensions/Gateways, matching their own
 * module-local convention.
 */

const DIGITS_PATTERN = (max: number) => new RegExp(`^\\d{0,${max}}$`)
const REQUIRED_DIGITS_PATTERN = (max: number) => new RegExp(`^\\d{1,${max}}$`)

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only. */
/** destination_prefix / destination_trunk_prefix: optional, digits only, max 5 digits. */
export const countryOrTrunkPrefixRule = {
  pattern: DIGITS_PATTERN(5),
  message: 'Only numbers are allowed, with a maximum length of 5 digits',
}

/** destination_area_code: optional, digits only, max 6 digits. */
export const areaCodeRule = {
  pattern: DIGITS_PATTERN(6),
  message: 'Only numbers are allowed, with a maximum length of 6 digits',
}

/** destination_caller_id_number: optional, digits only, max 20 digits. */
export const callerIdNumberRule = {
  pattern: DIGITS_PATTERN(20),
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

/**
 * destination_number rules: required, digits only, max 20 digits, and (by construction of the
 * digits-only pattern) no leading/trailing whitespace. Also used, unmodified, by the Copy
 * popup's new_destination_number field (destinations.md §8's Copy popup mini-form).
 */
export const destinationNumberRules = (isTaken: (value: string, excludeUuid?: string) => Promise<boolean>, excludeUuid?: string) => [
  { required: true, message: 'Destination required' },
  { pattern: REQUIRED_DIGITS_PATTERN(20), message: 'Only numbers are allowed, with a maximum length of 20 digits' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value) return
      if (await isTaken(value, excludeUuid)) {
        throw new Error('This destination number is already in use.')
      }
    },
  },
]
