import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const PermissionDenied = () => {
  const navigate = useNavigate()

  return (
    <Result
      status="403"
      title="403"
      subTitle="You don't have permission to access this page."
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      }
    />
  )
}

export default PermissionDenied
