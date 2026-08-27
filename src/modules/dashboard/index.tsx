import { Card, Space, Typography } from 'antd'
import useAuthStore from '../../store/auth'
import EmptyState from '../../components/feedback/EmptyState'

const DashboardPage = () => {
  const user = useAuthStore(state => state.user)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Welcome{user?.username ? `, ${user.username}` : ''}
        </Typography.Title>
        <Typography.Text type="secondary">
          This is the Axion PBX administration dashboard.
        </Typography.Text>
      </Card>

      <Card title="Overview">
        <EmptyState description="PBX overview widgets will appear here once modules are implemented." />
      </Card>
    </Space>
  )
}

export default DashboardPage
