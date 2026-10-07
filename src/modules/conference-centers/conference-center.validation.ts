import type { HiveUserConferenceDetails } from './conference-center.types'
import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Ant Design validation rules for the shared Add/Edit Conference Center form — the audit's Yup
 * schema (conference-centers.md §10) re-expressed as `Form.Item` rules.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
/** Optional `**` prefix followed by digits. */
const EXTENSION_PATTERN = /^(?:\*\*)?\d+$/
const PIN_LENGTH_PATTERN = /^\d{1,20}$/

export const nameRules = [
  { required: true, message: 'Name is required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
]

/**
 * Required, `**?digits`, numeric part inside the hive's range and not in its exclusion list. The
 * range always comes from the Hive User Details bootstrap — never a hardcoded table.
 */
export const extensionRules = (hive: Pick<HiveUserConferenceDetails, 'extensionRangeStart' | 'extensionRangeEnd' | 'extensionExclude'>) => [
  { required: true, message: 'Extension is required' },
  { pattern: EXTENSION_PATTERN, message: 'Only numbers are allowed, optionally prefixed with "**"' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value || !EXTENSION_PATTERN.test(value)) return
      const digits = value.startsWith('**') ? value.slice(2) : value
      const numeric = Number(digits)
      if (numeric < hive.extensionRangeStart || numeric > hive.extensionRangeEnd) {
        throw new Error(`Value must be between ${hive.extensionRangeStart} and ${hive.extensionRangeEnd}`)
      }
      if (hive.extensionExclude.includes(digits)) {
        throw new Error('This extension is reserved, you can not use this extension.')
      }
    },
  },
]

/** Required; numeric, at most 20 digits (conference-centers.md §10). The Select only offers 3–100. */
export const pinLengthRules = [
  { required: true, message: 'PIN length is required' },
  {
    validator: async (_: unknown, value?: number | string) => {
      if (value === undefined || value === null || value === '') return
      if (!PIN_LENGTH_PATTERN.test(String(value))) {
        throw new Error('Only numbers are allowed, with a maximum length of 20 digits')
      }
    },
  },
]
