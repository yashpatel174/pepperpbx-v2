import type { FormRule } from 'antd'
import type { ConferenceRoomFormValues } from './conference-room.types'

/**
 * Ant Design validation rules for the shared Add/Edit Conference Room form — the audit's Yup schema
 * (conference-rooms.md §10) re-expressed as `Form.Item` rules, messages kept verbatim.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/
const NO_EDGE_WHITESPACE_PATTERN = /^[^\s]+(\s+[^\s]+)*$/
const NUMERIC_PATTERN = /^\d+$/

export const noEdgeWhitespaceRule = {
  pattern: NO_EDGE_WHITESPACE_PATTERN,
  message: 'Leading and trailing whitespaces are not allowed',
}

export const nameRules = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

type PinField = 'moderator_pin' | 'participant_pin'

/** Optional; no edge whitespace; digits only; must differ from the other PIN when both are set. */
export const pinRules = (otherField: PinField): FormRule[] => [
  noEdgeWhitespaceRule,
  { pattern: NUMERIC_PATTERN, message: 'Only numbers are allowed' },
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      const other: ConferenceRoomFormValues[PinField] = getFieldValue(otherField)
      if (value && other && value === other) {
        throw new Error('Moderator PIN and Participant PIN must be different')
      }
    },
  }),
]

/**
 * Schedule From/To: each is required when the other is set, and From ≤ To (the audit's rule and
 * wording — §8/§10). Values are `YYYY-MM-DD HH:mm` strings, which compare correctly as text.
 */
export const startDatetimeRules: FormRule[] = [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      const stop: string | undefined = getFieldValue('stop_datetime')
      if (!value && stop) throw new Error('Schedule From is required when Schedule To is selected')
      if (value && stop && value > stop) throw new Error('Schedule From must be less than or equal to Schedule To')
    },
  }),
]

export const stopDatetimeRules: FormRule[] = [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      const start: string | undefined = getFieldValue('start_datetime')
      if (!value && start) throw new Error('Schedule To is required when Schedule From is selected')
      if (value && start && value < start) throw new Error('Schedule To must be greater than or equal to Schedule From')
    },
  }),
]
