import type { ConferenceHiveDetails } from './conference.types'

/**
 * Shared Ant Design validation rules for the Add/Edit/Copy Conference forms. Kept here (not
 * inline in the components) so every field using a given rule shares the exact validator —
 * Conference-owned, matching every sibling module's own module-local convention.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/
/** Optional embedded `**` prefix + digits — matches Extensions' own extension pattern and the
 * audit's documented `**?digits` rule (conferences.md §8/§10). */
const EMBEDDED_EXTENSION_NUMBER_PATTERN = /^(?:\*\*\d+|\d+)$/
const PIN_PATTERN = /^\d{0,20}$/
/** Lowercase letters separated by `|`, e.g. "mute|deaf|waste|moderator" (conferences.md §8/§10/§26). */
const FLAGS_PATTERN = /^[a-z]+(\|[a-z]+)*$/

/** conference_name / Copy's new_conference_name: "Name required" / "Name should be only of alphabets and numbers". */
export const nameRequiredRule = { required: true, message: 'Name is required' }
export const nameFormatRule = {
  pattern: ALPHANUMERIC_WITH_SPACE_PATTERN,
  message: 'Name should be only of alphabets and numbers',
}

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only. */
export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

/**
 * conference_extension (and Copy's new_conference_extension, which the audit documents as sharing
 * "the same extension-range rule as the main form" — conferences.md §8/§9): required, matches the
 * optional-`**`-prefix pattern, and within the domain's server-provided range, excluding any
 * reserved numbers. The range itself is NOT hardcoded here — it's read from the Hive bootstrap
 * response (conferences.md §26/§33: "preserve the backend-driven extension-range mechanism...
 * rather than substituting the static extensionConfig.conference table"), matching the
 * server-driven-range pattern already established for Extensions/Call Center Queue.
 */
export const extensionRangeRule = (hive: Pick<ConferenceHiveDetails, 'extensionRangeStart' | 'extensionRangeEnd' | 'extensionExclude'>) => [
  { required: true, message: 'Extension is required' },
  { pattern: EMBEDDED_EXTENSION_NUMBER_PATTERN, message: 'Only numbers are allowed, optionally prefixed with "**"' },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value) return
      const plain = value.startsWith('**') ? value.slice(2) : value
      if (!/^\d+$/.test(plain)) return
      const numeric = Number(plain)
      if (numeric < hive.extensionRangeStart || numeric > hive.extensionRangeEnd) {
        throw new Error(`Value must be between ${hive.extensionRangeStart} and ${hive.extensionRangeEnd}`)
      }
      if (hive.extensionExclude.includes(plain)) {
        throw new Error('This extension is reserved, you can not use this extension.')
      }
    },
  },
]

/** conference_pin_number: optional, numeric ≤20 digits, no edge whitespace (conferences.md §8/§10
 * — "always optional, no 'required when enabled' logic"). */
export const pinNumberRule = {
  pattern: PIN_PATTERN,
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

/** conference_flags: optional, lowercase letters separated by `|` (conferences.md §8/§10/§26). */
export const flagsRule = {
  pattern: FLAGS_PATTERN,
  message: 'Only allow small letters, no special characters, and separated by | sign',
}

/** conference_email_address: optional, standard email format — uses Ant Design's own built-in
 * `type: 'email'` rule rather than a hand-rolled regex, since the audit documents no stricter
 * constraint than "email format" (conferences.md §8/§10). */
export const emailRule = { type: 'email' as const, message: 'Invalid email' }

export const descriptionRules = [noEdgeWhitespaceRule]
