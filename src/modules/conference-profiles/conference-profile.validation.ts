/**
 * Ant Design validation rules for the shared Add/Edit Conference Profile form — the audit's Yup
 * schema (conference-profiles.md §10) re-expressed as `Form.Item` rules, messages kept verbatim.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/

export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

export const paramNameRules = [{ required: true, message: 'Name is required' }, noEdgeWhitespaceRule]

export const paramValueRules = [{ required: true, message: 'Value is required' }, noEdgeWhitespaceRule]
