import type { CSSProperties, ReactNode } from 'react'
import { Tag, Tooltip } from 'antd'
import type { TagProps } from 'antd'
import { CheckCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'

export interface StatusToggleTagProps extends Omit<TagProps, 'icon' | 'style'> {
  /** Picks the green/check vs orange/minus look. */
  enabled: boolean
  /** Tooltip shown around the pill — pass `undefined` for none, exactly as the calling table did. */
  tooltip?: ReactNode
  /** Per-module overrides merged over the base pill style (e.g. `cursor`, `opacity`). */
  style?: CSSProperties
  /** Style applied to the status icon — only for tables that already styled their icon. */
  iconStyle?: CSSProperties
}

/**
 * The status pill shared by every module's list table (Enabled/Disabled Tag inside a Tooltip).
 * Centralizes the markup and base pill style only — click handling, permission gating, cursor/
 * opacity, labels and any accessibility props stay with each calling table and are passed through.
 */
const StatusToggleTag = ({ enabled, tooltip, style, iconStyle, ...tagProps }: StatusToggleTagProps) => (
  <Tooltip title={tooltip}>
    <Tag
      {...tagProps}
      icon={enabled ? <CheckCircleOutlined style={iconStyle} /> : <MinusCircleOutlined style={iconStyle} />}
      style={{
        cursor: 'pointer',
        backgroundColor: enabled ? '#00D27A' : '#f16b3e',
        color: '#fff',
        borderColor: enabled ? '#00D27A' : '#f16b3e',
        fontWeight: 500,
        borderRadius: '999px',
        padding: '4px 14px',
        minHeight: '28px',
        lineHeight: '20px',
        ...style,
      }}
    />
  </Tooltip>
)

export default StatusToggleTag
