import { noEdgeWhitespaceRule } from '../../components/common/validationRules'
import { defaultExtEnd, defaultExtStart } from './voicemail.constants'
import type { HiveVoicemailDetails } from './voicemail.types'

export { noEdgeWhitespaceRule }

/** voicemail.md §11: digits, optionally prefixed by `**`. */
const VOICEMAIL_ID_PATTERN = /^(?:\*\*\d+|\d+)$/

type RangeSource = Pick<HiveVoicemailDetails, 'additionalExtStart' | 'additionalExtEnd' | 'additionalExtExclude'>

/**
 * Voicemail ID rules (voicemail.md §11), shared by the Add/Edit form and the Copy popup
 * (`copyValidation` reuses the same three rules and messages).
 *
 * Order matches the audit: required → pattern → range → reserved. Deliberate fix vs Axion: the
 * audit's range test has no upper-bound fallback (`Number(null)` = 0, so it fails until the hive
 * response loads) — PepperPBX mounts the form only after the hive response, and falls back to
 * 999999 anyway, as the message already does.
 */
export const voicemailIdRules = (hive: RangeSource) => {
  const start = hive.additionalExtStart ?? defaultExtStart
  const end = hive.additionalExtEnd ?? defaultExtEnd
  const rangeMessage = `Value must be between ${start} and ${end}`

  return [
    { required: true, message: 'Voicemail ID required in number' },
    { pattern: VOICEMAIL_ID_PATTERN, message: rangeMessage },
    {
      validator: async (_: unknown, value?: string) => {
        if (!value || !VOICEMAIL_ID_PATTERN.test(value)) return
        const numValue = value.replace(/^\*\*/, '')
        const numeric = Number(numValue)
        if (numeric < start || numeric > end) throw new Error(rangeMessage)
        if (hive.additionalExtExclude.includes(numValue) || hive.additionalExtExclude.includes(value)) {
          throw new Error('This extension is reserved, you can not use this extension.')
        }
      },
    },
  ]
}

/** voicemail.md §11: required, no whitespace anywhere (UI maxLength 30). No min length / complexity rule. */
export const passwordRules = [
  { required: true, message: 'Password required' },
  { pattern: /^\S*$/, message: 'Leading and trailing whitespaces are not allowed' },
]

/** voicemail.md §11: optional `+`, up to 20 digits. */
export const alternateGreetIdRules = [
  { pattern: /^\+?[0-9]{0,20}$/, message: 'Only numbers are allowed, with a maximum length of 20 digits' },
]

const EMAIL = '[^\\s@,]+@[^\\s@,]+\\.[^\\s@,]+'

/**
 * voicemail.md §11: `email(,email)*`, no spaces, no count limit. The audit names the pattern
 * (`multiEmailWithCommaWithoutLimit`) but does not print it — this email shape is an approximation.
 * TODO: align with the backend's exact email pattern once confirmed.
 */
export const mailToRules = [
  { pattern: new RegExp(`^${EMAIL}(?:,${EMAIL})*$`), message: 'You can add multiple emails with comma separated' },
]

export const descriptionRules = [noEdgeWhitespaceRule]
