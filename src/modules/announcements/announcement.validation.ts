import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

export { noEdgeWhitespaceRule }

/**
 * Shared Ant Design validation rules for the Add/Edit Announcement form. Kept here (not inline in
 * the form sections) so both modes use the exact same validators. Announcements-owned —
 * deliberately not imported from other modules, matching their own module-local convention.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only. */
/** phrase_name: required, alphanumeric + space — matches the audit's rule exactly (announcements.md §10). */
export const nameRules = [
  { required: true, message: 'Name is required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

/**
 * phrase_language: the audit's Yup schema also applies alphanumeric+no-edge-whitespace rules to
 * this field (§10), but it's a controlled Select bound to a fixed ISO 639-1 code list here, never
 * free-typed — those pattern rules are structurally moot for a Select value, same reasoning
 * already applied to Outbound Routes' Select-bound fields (domain_name/sbcDomainIp/dialplan_order).
 */
export const languageRules = [{ required: true, message: 'Language is required' }]

export const domainRules = [{ required: true, message: 'Domain is required' }]

/** phrase_description: optional, no-edge-ws only (announcements.md §10). */
export const descriptionRules = [noEdgeWhitespaceRule]

/**
 * Structure row rules — announcements.md §10. Each row's three fields, once a row exists, are all
 * required and reject leading/trailing whitespace (the Action free-text mode makes that reachable).
 */
export const structureFunctionRules = [{ required: true, message: 'Function is required.' }, noEdgeWhitespaceRule]
export const structureActionRules = [{ required: true, message: 'Action is required.' }, noEdgeWhitespaceRule]
export const structureOrderRules = [{ required: true, message: 'Order is required.' }, noEdgeWhitespaceRule]
