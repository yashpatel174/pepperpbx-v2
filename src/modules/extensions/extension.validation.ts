/**
 * Shared Ant Design validation rules for the Add/Edit extension form. Rules are kept here
 * (not inline in ExtensionForm) so Add and Edit — and the conditional field sets — use the
 * exact same validators, matching Axion's wording and regexes.
 */

import type { Rule } from 'antd/es/form'

const EMBEDDED_EXTENSION_NUMBER_PATTERN = /^(?:\*\*\d+|\d+)$/
const NUMERIC_TWENTY_PATTERN = /^\+?[0-9]{0,20}$/
const CALL_TIMEOUT_PATTERN = /^\+?[0-9]{0,3}$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/
const IP_OR_CIDR_OR_PORT_PATTERN =
  /^(?:(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\/([1-2][0-9]|3[0-2]|[1-9]))?(:\d{1,5})?$/
const DOMAIN_OR_HTTP_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9-_]*)*$/
const MISSED_CALL_EMAILS_PATTERN = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,},?){1,5}$/
const VOICEMAIL_EMAILS_PATTERN =
  /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(,([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))*$/
const VOICEMAIL_PASSWORD_PATTERN = /^\d{6,20}$/

/** `!value || /^[^\s]+(\s+[^\s]+)*$/` — rejects leading/trailing whitespace only. */
export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

/** Optional numeric string: no whitespace, optional leading `+`, at most 20 digits. */
export const numericFieldRule = {
  pattern: NUMERIC_TWENTY_PATTERN,
  message: 'Only numbers are allowed, with a maximum length of 20 digits',
}

/** call_timeout: 0-999 (max 3 digits). */
export const callTimeoutRule = {
  pattern: CALL_TIMEOUT_PATTERN,
  message: 'Only numbers are allowed, with a maximum length of 3 digits',
}

/** CIDR field: bare IP, IP/CIDR, IP:port, bare domain, or http(s) domain. */
export const cidrRule = {
  validator: (_: unknown, value?: string) => {
    if (!value) return Promise.resolve()
    if (IP_OR_CIDR_OR_PORT_PATTERN.test(value) || DOMAIN_OR_HTTP_PATTERN.test(value)) {
      return Promise.resolve()
    }
    return Promise.reject(new Error('Invalid Domain name or IP address format'))
  },
}

/** `enabled` must be a present boolean (defaults true; never null/undefined). */
export const enabledRule = {
  validator: (_: unknown, value?: boolean) =>
    typeof value === 'boolean' ? Promise.resolve() : Promise.reject(new Error('Enabled required')),
}

/**
 * Extension number rules. Strips the optional `**` embedded-extension prefix before the
 * range comparison; rejected when outside additionalExtStart..End or in additionalExtExclude.
 */
export const extensionNumberRules = ({
  additionalExtStart,
  additionalExtEnd,
  additionalExtExclude,
  excludeUuid,
  isTaken,
}: {
  additionalExtStart: number
  additionalExtEnd: number
  additionalExtExclude: string[]
  excludeUuid?: string
  isTaken: (extension: string, excludeUuid?: string) => Promise<boolean>
}) => [
  { required: true, message: 'Enter extension' },
  { pattern: EMBEDDED_EXTENSION_NUMBER_PATTERN, message: 'Enter extension' },
  {
    validator: (_: unknown, value?: string) => {
      if (!value) return Promise.resolve()
      const plain = value.startsWith('**') ? value.slice(2) : value
      const parsed = Number(plain)
      if (!/^\d+$/.test(plain)) return Promise.resolve()
      if (parsed < additionalExtStart || parsed > additionalExtEnd) {
        return Promise.reject(new Error(`Value must be between ${additionalExtStart} and ${additionalExtEnd}`))
      }
      if (additionalExtExclude.includes(plain)) {
        return Promise.reject(new Error('This extension is reserved, you can not use this extension.'))
      }
      return Promise.resolve()
    },
  },
  {
    validator: async (_: unknown, value?: string) => {
      if (!value || value.startsWith('**')) return
      if (await isTaken(value, excludeUuid)) {
        throw new Error('This extension number is already in use.')
      }
    },
  },
]

/** Conditional on missed_call_app === 'email' — up to 5 comma-separated emails. */
export const missedCallEmailRules = [
  { required: true, message: 'Missed call email required' },
  { pattern: MISSED_CALL_EMAILS_PATTERN, message: 'Invalid email' },
]

/** Optional when voicemail is enabled — unlimited comma-separated emails. */
export const voicemailMailToRule = {
  pattern: VOICEMAIL_EMAILS_PATTERN,
  message: 'You can add multiple emails with comma separated',
}

/**
 * Voicemail password rules, mode-aware: Create requires a 6-20 digit PIN up front. Edit allows
 * leaving it blank to keep the existing password unchanged (see ExtensionFormVoicemailSection's
 * "Unchanged" placeholder/hint) — the 6-20 digit format still applies to whatever is typed.
 */
export const voicemailPasswordRules = (mode: 'create' | 'edit'): Rule[] =>
  mode === 'create'
    ? [
        { required: true, message: 'Voicemail Password is required' },
        { pattern: VOICEMAIL_PASSWORD_PATTERN, message: 'Voicemail password must be between 6 and 20 digits' },
      ]
    : [
        {
          validator: (_: unknown, value?: string) => {
            if (!value) return Promise.resolve()
            return VOICEMAIL_PASSWORD_PATTERN.test(value)
              ? Promise.resolve()
              : Promise.reject(new Error('Voicemail password must be between 6 and 20 digits'))
          },
        },
      ]

/**
 * Password (edit only): optional — leaving it blank preserves the existing backend password.
 * When provided it must not contain spaces.
 */
export const editPasswordRules = [
  { pattern: /^\S*$/, message: 'Password cannot contain spaces' },
]