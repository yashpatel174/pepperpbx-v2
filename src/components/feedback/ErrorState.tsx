import type { ReactNode } from 'react'
import { Alert, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface ErrorStateProps {
  message: string
  /** Optional detail under the heading — e.g. which options failed to load. */
  description?: ReactNode
  /** `warning` for a partial failure where the page stays usable (e.g. option lists); defaults to `error`. */
  type?: 'error' | 'warning'
  onRetry?: () => void
}

const ErrorState = ({ message, description, type = 'error', onRetry }: ErrorStateProps) => (
  <Alert
    type={type}
    showIcon
    title={message}
    description={description}
    action={
      onRetry && (
        <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
          Retry
        </Button>
      )
    }
  />
)

export default ErrorState
