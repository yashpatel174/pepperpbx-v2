import { Skeleton } from 'antd'

interface LoadingStateProps {
  rows?: number
}

const LoadingState = ({ rows = 8 }: LoadingStateProps) => (
  <Skeleton active paragraph={{ rows }} />
)

export default LoadingState
