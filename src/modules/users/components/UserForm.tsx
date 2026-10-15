import { Button, Card, Col, Form, Input, Row, Select, Space } from 'antd'
import { KeyOutlined } from '@ant-design/icons'
import { accountStatusOptions, languageOptions, PASSWORD_NOT_SAVED_HINT, timezoneOptions, userStatusOptions } from '../users.constants'
import { generateApiKey, isUsernameTaken } from '../users.service'
import { accountStatusRules, confirmPasswordRules, emailRules, groupsRules, passwordRules, usernameRules } from '../users.validation'
import type { UserFormOptions, UserFormValues } from '../users.types'

export interface UserFormProps {
  mode: 'create' | 'edit'
  initialValues: UserFormValues
  /** Excluded from the duplicate-username check when editing. */
  userId?: string
  /** Domains and Group Manager groups the dropdowns offer (id saved, name shown). */
  options: UserFormOptions
  submitting: boolean
  onSubmit: (values: UserFormValues) => void
  /** HTML form id — the page toolbar's Save button targets it via `form={formId}`. */
  formId: string
  /** Reports whether the form has unsaved edits, so the page can guard navigation. */
  onDirtyChange?: (dirty: boolean) => void
}

/**
 * Shared by AddUserPage and EditUserPage. Passwords are required on create and optional on edit
 * (blank keeps the current one); the strength rules still apply whenever one is entered.
 */
const UserForm = ({ mode, initialValues, userId, options, submitting, onSubmit, formId, onDirtyChange }: UserFormProps) => {
  const [form] = Form.useForm<UserFormValues>()

  return (
    <Form<UserFormValues> id={formId} form={form} layout="vertical" initialValues={initialValues} onFinish={onSubmit}
      onValuesChange={() => onDirtyChange?.(true)}
      disabled={submitting}
    >
      <Card title="Account">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="username"
              label="Username"
              validateFirst
              validateDebounce={300}
              rules={[
                ...usernameRules,
                {
                  validator: async (_, value?: string) => {
                    if (!value?.trim()) return
                    if (await isUsernameTaken(value, mode === 'edit' ? userId : undefined)) {
                      throw new Error('A user with this username already exists.')
                    }
                  },
                },
              ]}
            >
              <Input placeholder="Username" autoComplete="off" aria-label="Username" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email Address" validateFirst rules={emailRules}>
              <Input placeholder="Email Address" autoComplete="off" aria-label="Email Address" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="password"
              label="Password"
              validateFirst
              dependencies={['confirm_password']}
              extra={mode === 'edit' ? `Leave blank to keep the current password. ${PASSWORD_NOT_SAVED_HINT}` : PASSWORD_NOT_SAVED_HINT}
              rules={passwordRules(mode === 'create')}
            >
              <Input.Password placeholder="Password" autoComplete="new-password" aria-label="Password" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="confirm_password"
              label="Confirm Password"
              dependencies={['password']}
              hasFeedback
              validateFirst
              rules={confirmPasswordRules(() => form.getFieldValue('password'))}
            >
              <Input.Password placeholder="Confirm Password" autoComplete="new-password" aria-label="Confirm Password" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Profile" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="first_name" label="First Name">
              <Input placeholder="First Name" aria-label="First Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="last_name" label="Last Name">
              <Input placeholder="Last Name" aria-label="Last Name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="organization" label="Organization">
              <Input placeholder="Organization" aria-label="Organization" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="timezone" label="Time Zone">
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Select a time zone"
                options={timezoneOptions}
                aria-label="Time Zone"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="language" label="Language">
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Select a language"
                options={languageOptions}
                aria-label="Language"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Access" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="domain_id" label="Domain">
              <Select
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                placeholder={options.domains.length === 0 ? 'No domains available' : 'Select a domain'}
                notFoundContent="No domains available"
                options={options.domains.map((d) => ({ value: d.id, label: d.name }))}
                aria-label="Domain"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="group_id" label="Groups" rules={groupsRules}>
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Select group"
                notFoundContent="No groups available"
                options={options.groups.map((g) => ({ value: g.id, label: g.name }))}
                aria-label="Groups"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="API Key" extra="Use the generate button to create a key.">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="api_key" noStyle>
                  <Input.Password placeholder="API Key" autoComplete="off" aria-label="API Key" />
                </Form.Item>
                <Button icon={<KeyOutlined />} onClick={() => {
                    form.setFieldValue('api_key', generateApiKey())
                    onDirtyChange?.(true)
                  }}
                >
                  Generate
                </Button>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="status" label="Availability Status">
              <Select allowClear placeholder="Select a status" options={userStatusOptions} aria-label="Availability Status" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="enabled" label="Account Status" rules={accountStatusRules}>
              <Select options={accountStatusOptions} aria-label="Account Status" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  )
}

export default UserForm
