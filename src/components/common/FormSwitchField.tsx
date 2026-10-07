import type { CSSProperties, ReactNode } from 'react'
import { Form, Switch, theme, Tooltip } from 'antd'
import type { FormItemProps } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

export interface FormSwitchFieldProps {
  /** Form field name (a nested path for Form.List rows). */
  name: FormItemProps['name']
  /** Text shown to the right of the switch. */
  label: string
  /** Help text for the "?" icon after the label; omit for no icon. */
  tooltip?: ReactNode
  disabled?: boolean
  onChange?: (checked: boolean) => void
  /** Validation rules — when given, the field renders as a styled Form.Item so errors can show. */
  rules?: FormItemProps['rules']
  /** Defaults to `label`. */
  ariaLabel?: string
  /** Overrides for the row wrapper (e.g. `minHeight`, `minWidth`, `whiteSpace`). */
  style?: CSSProperties
}

/**
 * Inline form switch: [Switch] Label (?) — the switch row used across module forms. The switch
 * is bound to the surrounding Form through `valuePropName="checked"`.
 */
const FormSwitchField = ({ name, label, tooltip, disabled, onChange, rules, ariaLabel, style }: FormSwitchFieldProps) => {
  const { token } = theme.useToken()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <Form.Item
        name={name}
        valuePropName="checked"
        rules={rules}
        {...(rules ? { style: { marginBottom: 0 } } : { noStyle: true })}
      >
        <Switch disabled={disabled} onChange={onChange} aria-label={ariaLabel ?? label} />
      </Form.Item>

      <span>{label}</span>

      {tooltip && (
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined
            aria-label={`${label} information`}
            style={{ color: token.colorTextTertiary, fontSize: 12, cursor: 'help', flexShrink: 0 }}
          />
        </Tooltip>
      )}
    </div>
  )
}

export default FormSwitchField
