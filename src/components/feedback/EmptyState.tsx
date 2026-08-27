import type { ReactNode } from 'react'
import { Empty } from 'antd'

interface EmptyStateProps {
  description?: ReactNode
  action?: ReactNode
}

const EmptyState = ({ description = 'No data yet.', action }: EmptyStateProps) => (
  <Empty description={description}>{action}</Empty>
)

export default EmptyState
