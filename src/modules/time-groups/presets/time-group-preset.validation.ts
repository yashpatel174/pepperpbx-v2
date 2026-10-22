import type { FormRule } from 'antd'
import { timeToMinutes } from '../time-group.constants'
import { presetDateToNumber } from './time-group-preset.constants'

/**
 * Preset form rules — Axion's `festivalValidationSchema` (name, domain, description, and per
 * festival Date From/To + Time From/To). Name/Domain/Description are the same rules the Time Group
 * form uses, so they're re-exported rather than redefined; Copy uses `nameRules` too, matching
 * Axion's `copyPresetFormSchema`. No "at least one holiday" rule — Axion has none.
 */
export { descriptionRules, domainRules, nameRules } from '../time-group.validation'

type GetFieldValue = (name: (string | number)[]) => unknown

const festivalField = (getFieldValue: GetFieldValue, index: number, key: string) => getFieldValue(['festivals', index, key])

/** Date From must not be after Date To (Axion's `isSameOrBefore`). */
export const dateFromRules = (index: number): FormRule[] => [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      const from = presetDateToNumber(value)
      const to = presetDateToNumber(festivalField(getFieldValue, index, 'date_to') as string | undefined)
      if (from === null) throw new Error('Date From is required')
      if (to !== null && from > to) throw new Error('Date From must be before Date To')
    },
  }),
]

/** Date To must not be before Date From (Axion's `isSameOrAfter`). */
export const dateToRules = (index: number): FormRule[] => [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      const to = presetDateToNumber(value)
      const from = presetDateToNumber(festivalField(getFieldValue, index, 'date_from') as string | undefined)
      if (to === null) throw new Error('Date To is required')
      if (from !== null && to < from) throw new Error('Date To must be after Date From')
    },
  }),
]

/** Time From must be before Time To; skipped for Full Day. */
export const festivalTimeFromRules = (index: number): FormRule[] => [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      if (festivalField(getFieldValue, index, 'full_day')) return
      const from = timeToMinutes(value)
      const to = timeToMinutes(festivalField(getFieldValue, index, 'time_to') as string | undefined)
      if (from === null) throw new Error('Time From is required')
      if (to !== null && from >= to) throw new Error('Time From must be before Time To')
    },
  }),
]

/** Time To must be after Time From; skipped for Full Day. */
export const festivalTimeToRules = (index: number): FormRule[] => [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      if (festivalField(getFieldValue, index, 'full_day')) return
      const to = timeToMinutes(value)
      const from = timeToMinutes(festivalField(getFieldValue, index, 'time_from') as string | undefined)
      if (to === null) throw new Error('Time To is required')
      if (from !== null && to <= from) throw new Error('Time To must be after Time From')
    },
  }),
]
