import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit Call Center Agent form. Kept here (not
 * inline in the form) so every field sharing a rule uses the exact same validator —
 * Call-Center-Agents-owned, deliberately not imported from the Call Center Queue module or any
 * other module, matching every sibling module's own module-local convention.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_WHITESPACE_PATTERN = /^\S*$/
const DIGITS_PATTERN = (max: number) => new RegExp(`^\\d{0,${max}}$`)

/** call-center.md §12: "Name required" / "Name should be only of alphabets and numbers". */
export const nameRequiredRule = { required: true, message: 'Agent name is required' }
export const nameFormatRule = {
  pattern: ALPHANUMERIC_WITH_SPACE_PATTERN,
  message: 'Name should be only of alphabets and numbers',
}

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only (call-center.md §12). */
/** `agent_call_timeout`: optional, numeric, ≤3 digits (call-center.md §12). */
export const numericUpTo3DigitsRule = {
  pattern: DIGITS_PATTERN(3),
  message: 'Only numbers are allowed, with a maximum length of 3 digits',
}

/** `agent_id`/`agent_no_answer_delay_time`/`agent_max_no_answer`/`agent_wrap_up_time`/
 * `agent_reject_delay_time`/`agent_busy_delay_time`: optional, numeric, ≤20 digits (call-center.md §12). */
export const numericUpTo20DigitsRule = {
  pattern: DIGITS_PATTERN(20),
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

export const contactRequiredRule = { required: true, message: 'Contact is required' }

/** `agent_password`: optional, but no embedded whitespace anywhere (not just leading/trailing) —
 * distinct from noEdgeWhitespaceRule (call-center.md §12: "no confirmed minimum length/complexity,
 * only no embedded whitespace"). UI also caps input at 30 chars via the Password field's maxLength. */
export const noWhitespaceRule = {
  pattern: NO_WHITESPACE_PATTERN,
  message: 'Whitespace is not allowed',
}
