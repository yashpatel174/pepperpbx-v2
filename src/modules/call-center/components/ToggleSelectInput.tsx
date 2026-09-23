import { useMemo, useState } from 'react'
import { Button, Input, Select, Space, Tooltip } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import type { SelectOption } from '../call-center.types'

export interface ToggleSelectOptionGroup {
  label: string
  options: SelectOption[]
}

/** A flat option list, or a list already grouped into labeled sections — matches whatever shape
 * the module's existing option source (call-center.service.ts) already provides. */
export type ToggleSelectOptions = (SelectOption | ToggleSelectOptionGroup)[]

export interface ToggleSelectInputProps {
  /** Injected by Ant Design's `Form.Item` when this is used as its child — same integration
   * pattern as a plain `<Select>`/`<Input>`, no `Form.useWatch` needed. */
  value?: string
  onChange?: (value: string) => void
  /** The field's predefined options (module-owned — see call-center.mock.ts/service.ts). Never
   * mutated; the current value is derived into a display-only "Other" group when missing. */
  options: ToggleSelectOptions
  placeholder?: string
  /** Axion's `isSelectInitial` — whether the field starts in Select mode. Defaults to `true`,
   * matching every field this component is currently used for (call-center.md §8). */
  isSelectInitial?: boolean
  /**
   * Whether the current user may toggle between Select and Text mode. Reproduces Axion's
   * `pbx_admin || pbx_axiontech` gate (`ToggleSelectInputCallCenter`) — PepperPBX has no
   * confirmed equivalent backend permission yet, so this is a placeholder wired to the caller's
   * own privilege check (see CallCenterBasicSection.tsx). TODO: replace with a real permission
   * string once the backend contract for this exact Axion behavior is confirmed.
   */
  canToggle: boolean
  loading?: boolean
  disabled?: boolean
  'aria-label'?: string
}

const isOptionGroup = (option: SelectOption | ToggleSelectOptionGroup): option is ToggleSelectOptionGroup => 'options' in option

const flattenOptions = (options: ToggleSelectOptions): SelectOption[] => options.flatMap((option) => (isOptionGroup(option) ? option.options : [option]))

/**
 * PepperPBX's Ant Design equivalent of Axion's `ToggleSelectInputCallCenter` — lets a privileged
 * user switch a field between a searchable Select (predefined options) and a free-text Input
 * (custom value), without ever changing the field's own value. Toggling is visible only when
 * `canToggle` is true; other users only ever see the Select. Module-local since only Call Center
 * currently needs this (call-center.md §8's Greeting/Timeout Destination/Announce Sound fields).
 */
const ToggleSelectInput = ({
  value,
  onChange,
  options,
  placeholder,
  isSelectInitial = true,
  canToggle,
  loading,
  disabled,
  'aria-label': ariaLabel,
}: ToggleSelectInputProps) => {
  const [isSelect, setIsSelect] = useState(isSelectInitial)

  // Derived, never mutates `options` — if the current value isn't among the predefined options,
  // it's appended as an "Other" group so switching back to Select never loses/hides it (matches
  // Axion's documented behavior exactly). Recomputes whenever the live value or options change.
  const displayOptions = useMemo<ToggleSelectOptions>(() => {
    if (!value) return options
    const alreadyPresent = flattenOptions(options).some((option) => option.value === value)
    if (alreadyPresent) return options
    return [...options, { label: 'Other', options: [{ label: value, value }] }]
  }, [options, value])

  return (
    <Space.Compact style={{ width: '100%' }}>
      {isSelect ? (
        <Select
          showSearch
          optionFilterProp="label"
          value={value || undefined}
          onChange={(nextValue) => onChange?.(nextValue)}
          options={displayOptions}
          placeholder={placeholder}
          loading={loading}
          disabled={disabled}
          style={{ flex: 1 }}
          aria-label={ariaLabel}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{ flex: 1 }}
          aria-label={ariaLabel}
        />
      )}

      {canToggle && (
        <Tooltip title={isSelect ? 'Switch to a custom text value' : 'Switch back to select from list'}>
          <Button
            htmlType="button"
            icon={<LeftOutlined />}
            disabled={disabled}
            onClick={() => setIsSelect((previous) => !previous)}
            aria-label={isSelect ? 'Switch to text input' : 'Switch to select input'}
          />
        </Tooltip>
      )}
    </Space.Compact>
  )
}

export default ToggleSelectInput
