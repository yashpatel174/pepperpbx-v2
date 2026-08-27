import React, { useEffect, useMemo, useState } from 'react'
import { Form, Input, Button, Card, message, Typography, Space, Divider, theme } from 'antd'
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../../../store/auth'
import * as authService from '../../../services/auth/auth.service'
import { isMockMode, MOCK_USERS } from '../../../services/auth/auth.mock'
import { toRgba } from '../../../config/theme'
import SessionExpired from '../../../components/feedback/SessionExpired'

const { Title, Text } = Typography

interface LoginFormValues {
  username: string
  password: string
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const mockEnabled = isMockMode()
  const { token } = theme.useToken()
  const sessionExpired = new URLSearchParams(window.location.search).get('sessionExpired') === '1'

  const backgroundStyle = useMemo(() => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: token.colorBgLayout,
    backgroundImage: `
      radial-gradient(circle at 15% 20%, ${toRgba(token.colorPrimary, 0.18)}, transparent 55%),
      radial-gradient(circle at 85% 10%, ${toRgba(token.green8, 0.16)}, transparent 50%),
      linear-gradient(0deg, ${toRgba(token.colorSplit, 0.8)} 1px, transparent 1px),
      linear-gradient(90deg, ${toRgba(token.colorSplit, 0.6)} 1px, transparent 1px)
    `,
    backgroundSize: 'auto, auto, 32px 32px, 32px 32px',
    backgroundAttachment: 'fixed'
  }), [token])

  // Auto-fill form in development mode for demo
  useEffect(() => {
    if (mockEnabled) {
      const urlParams = new URLSearchParams(window.location.search)
      const demoUser = urlParams.get('demo') || 'demo'
      const mockUser = MOCK_USERS[demoUser as keyof typeof MOCK_USERS] || MOCK_USERS.demo

      form.setFieldsValue({
        username: mockUser.username,
        password: mockUser.password,
      })
    }
  }, [form, mockEnabled])

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      const result = await authService.login(values)
      login(result.user, result.tokens)

      message.success('Login successful!')

      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
      navigate(redirect)
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Login failed, please check your username and password'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (userKey: keyof typeof MOCK_USERS) => {
    const mockUser = MOCK_USERS[userKey]
    form.setFieldsValue({
      username: mockUser.username,
      password: mockUser.password,
    })
    form.submit()
  }

  return (
    <div style={backgroundStyle}>
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>Login</Title>
            <Text type="secondary">Welcome back, please login to your account</Text>
          </div>

          {sessionExpired && <SessionExpired />}

          <Form
            name="login"
            form={form}
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please enter username or email' },
                { min: 3, message: 'Username must be at least 3 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username or email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Login
              </Button>
            </Form.Item>
          </Form>

          {mockEnabled && (
            <>
              <Divider plain>Quick Login (Demo)</Divider>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleQuickLogin('demo')}
                  block
                  style={{ marginBottom: 8 }}
                >
                  Login as Demo User
                </Button>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    onClick={() => handleQuickLogin('admin')}
                    style={{ flex: 1 }}
                  >
                    Admin
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleQuickLogin('user')}
                    style={{ flex: 1 }}
                  >
                    User
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleQuickLogin('demo')}
                    style={{ flex: 1 }}
                  >
                    Demo
                  </Button>
                </Space>
              </Space>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/auth/register">Sign up</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default LoginPage
