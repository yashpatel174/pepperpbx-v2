import type { ReactNode } from 'react'
import { Button, Divider, Flex, Space, Typography, theme } from 'antd'

export interface ModuleHeaderAction {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export interface ModuleHeaderProps {
  /** Module name, e.g. "Extensions". Combined with `count` as "Extensions (20)" when count is given. */
  title: string
  /** Record count to show next to the title. Omit if the module has no count to show yet. */
  count?: number
  /** The module's main create/add action. Always rendered first, ahead of `actions`. */
  primaryAction?: ModuleHeaderAction
  /** Secondary actions (Export, Import, etc.), rendered in the given order after `primaryAction`. */
  actions?: ModuleHeaderAction[]
  /** Filter/search controls for the row below the title — e.g. a toggle, a search input, a refresh button. */
  filters?: ReactNode
}

/**
 * Shared two-row header/toolbar for PBX module list pages: title+count on row one,
 * primary/secondary actions and filter controls together on row two. Owns layout, spacing,
 * ordering (primary action always first), and responsive wrapping so modules don't each
 * reimplement this.
 */
const ModuleHeader = ({ title, count, primaryAction, actions = [], filters }: ModuleHeaderProps) => {
  const { token } = theme.useToken()
  const titleFontSize = parseFloat(String(token.fontSizeHeading4)) + 2

  return (
    <Flex vertical gap="middle" style={{ width: '100%' }}>
      <Typography.Title level={5} style={{ margin: 0, fontSize: titleFontSize }}>
        {count === undefined ? title : `${title} (${count})`}
      </Typography.Title>

      <Divider style={{ marginBottom: 10, marginTop: 5 }} />

      <Flex wrap gap="middle" justify="space-between" align="center" style={{ width: '100%' }}>
        {filters && (
          <Space wrap size="middle" align="center" style={{ flex: '0 0 auto' }}>
            {filters}
          </Space>
        )}
        <Space wrap size="middle" style={{ flex: '0 0 auto' }}>
          {primaryAction && (
            <Button
              type="primary"
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
              loading={primaryAction.loading}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </Button>
          )}
          {actions.map(action => (
            <Button
              key={action.key}
              icon={action.icon}
              onClick={action.onClick}
              loading={action.loading}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </Flex>
    </Flex>
  )
}

export default ModuleHeader
