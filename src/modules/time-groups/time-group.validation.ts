import type { FormRule } from 'antd'
import { timeToMinutes } from './time-group.constants'
import type { TimeGroupRangeFormValues } from './time-group.types'
import { noEdgeWhitespaceRule } from '../../components/common/validationRules'

/**
 * Ant Design validation rules for the Time Group Add/Edit and Copy forms — the audit's Yup schemas
 * (time-groups.md §10) re-expressed as `Form.Item` rules. Messages are Axion's.
 *
 * Deliberately NOT validated, matching Axion (§10/§26): overlapping ranges, "at least one day
 * checked", time-zone presence. Those are unconfirmed backend concerns.
 */

const ALPHANUMERIC_WITH_SPACE_PATTERN = /^[a-zA-Z0-9 ]+$/

/** Shared by the form's Name and the Copy popup's Name (§10). */
export const nameRules: FormRule[] = [
  { required: true, message: 'Name required' },
  { pattern: ALPHANUMERIC_WITH_SPACE_PATTERN, message: 'Name should be only of alphabets and numbers' },
  noEdgeWhitespaceRule,
]

export const domainRules: FormRule[] = [{ required: true, message: 'Domain is required' }]

/** Optional; whitespace-only or edge whitespace is rejected (§10). */
export const descriptionRules: FormRule[] = [noEdgeWhitespaceRule]

const groupOrders = (groups: TimeGroupRangeFormValues[] | undefined) => (groups ?? []).map((group) => group?.order)

/** Main order: optional, but must not match any group's order (§10/§26). */
export const mainOrderRules: FormRule[] = [
  ({ getFieldValue }) => ({
    validator: async (_, value?: number) => {
      if (value === undefined || value === null) return
      if (groupOrders(getFieldValue('groups')).includes(value)) {
        throw new Error('Order must be unique and should not match any group order')
      }
    },
  }),
]

/** Group order: required, unique across groups and different from the main order (§10/§26). */
export const groupOrderRules = (index: number): FormRule[] => [
  { required: true, message: 'Group order is required' },
  ({ getFieldValue }) => ({
    validator: async (_, value?: number) => {
      if (value === undefined || value === null) return
      const clashesWithGroup = groupOrders(getFieldValue('groups')).some((order, other) => other !== index && order === value)
      if (clashesWithGroup || getFieldValue('order') === value) {
        throw new Error('Group order must be unique and should not match the main order')
      }
    },
  }),
]

const rangeField = (getFieldValue: (name: (string | number)[]) => unknown, index: number, key: keyof TimeGroupRangeFormValues) =>
  getFieldValue(['groups', index, key])

/** Time From must be before Time To; skipped for Full Day (§10). */
export const timeFromRules = (index: number): FormRule[] => [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      if (rangeField(getFieldValue, index, 'full_day')) return
      const from = timeToMinutes(value)
      const to = timeToMinutes(rangeField(getFieldValue, index, 'time_to') as string | undefined)
      if (from === null) throw new Error('Time From is required')
      if (to !== null && from >= to) throw new Error('Time From must be before Time To')
    },
  }),
]

/** Time To must be after Time From; skipped for Full Day (§10). */
export const timeToRules = (index: number): FormRule[] => [
  ({ getFieldValue }) => ({
    validator: async (_, value?: string) => {
      if (rangeField(getFieldValue, index, 'full_day')) return
      const to = timeToMinutes(value)
      const from = timeToMinutes(rangeField(getFieldValue, index, 'time_from') as string | undefined)
      if (to === null) throw new Error('Time To is required')
      if (from !== null && to <= from) throw new Error('Time To must be after Time From')
    },
  }),
]
