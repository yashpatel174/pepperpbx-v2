import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Ant Design validation rules for the shared Add/Edit Conference Control form — the audit's Yup
 * schema (conference-controls.md §10) re-expressed as `Form.Item` rules, messages kept verbatim.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/

export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

export const controlDigitsRules = [{ required: true, message: 'Digits required' }]

export const controlActionRules = [{ required: true, message: 'Action is required' }, noEdgeWhitespaceRule]
