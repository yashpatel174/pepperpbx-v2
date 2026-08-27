import { Alert, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <Alert
    type="error"
    showIcon
    message={message}
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
