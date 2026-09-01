import { Button, Card, Col, Divider, Form, Input, Row, Segmented, Select, Space, Switch, Typography } from 'antd'
import { callGroupOptions, contextOptions, extensionStatusLabels } from '../extension.constants'
import { isExtensionNumberTaken } from '../extension.service'
import type { ExtensionFormValues } from '../extension.types'

const { Title } = Typography
const { TextArea } = Input

export interface ExtensionFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — ExtensionForm only ever mounts once real values are ready. */
  initialValues: ExtensionFormValues
  /** Current record's id, so the duplicate-number check excludes itself in edit mode. */
  excludeId?: string
  submitting: boolean
  onSubmit: (values: ExtensionFormValues) => void
  onCancel: () => void
}

const notWhitespaceOnly = (_: unknown, value?: string) =>
  !value || value.trim().length > 0 ? Promise.resolve() : Promise.reject(new Error('This field cannot be empty.'))

/**
 * Shared by AddExtensionPage and EditExtensionPage — owns fields, layout, validation, and
 * form state. Pages own routing, data loading, and the actual create/update service call.
 */
const ExtensionForm = ({ mode, initialValues, excludeId, submitting, onSubmit, onCancel }: ExtensionFormProps) => {
  const [form] = Form.useForm<ExtensionFormValues>()
  const voicemailEnabled = Form.useWatch('voicemailEnabled', form)

  return (
    <Form<ExtensionFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting}
    >
      <Card>
        <Title level={5} style={{ marginTop: 0 }}>General</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="extension"
              label="Extension"
              validateFirst
              rules={[
                { required: true, message: 'Extension number is required.' },
                { pattern: /^\d+$/, message: 'Extension must contain digits only.' },
                {
                  validator: async (_, value: string) => {
                    if (!value) return
                    const taken = await isExtensionNumberTaken(value, excludeId)
                    if (taken) throw new Error('This extension number is already in use.')
                  },
                },
              ]}
            >
              <Input placeholder="e.g. 101" aria-label="Extension number" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="status" label="Status">
              <Segmented
                aria-label="Extension status"
                options={[
                  { label: extensionStatusLabels.enabled, value: 'enabled' },
                  { label: extensionStatusLabels.disabled, value: 'disabled' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="description" label="Description" rules={[{ validator: notWhitespaceOnly }]}>
              <TextArea rows={2} placeholder="Optional description" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5}>Caller ID</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="effectiveCallerIdName"
              label="Effective Caller ID Name"
              rules={[{ validator: notWhitespaceOnly }]}
            >
              <Input placeholder="Displayed on internal calls" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="outboundCallerIdName"
              label="Outbound Caller ID Name"
              rules={[{ validator: notWhitespaceOnly }]}
            >
              <Input placeholder="Displayed on outbound calls" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5}>Calling / Routing</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="callGroup" label="Call Group">
              <Select
                allowClear
                placeholder="Select a call group"
                options={callGroupOptions.map((group) => ({ label: group, value: group }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="context" label="Context" rules={[{ required: true, message: 'Context is required.' }]}>
              <Select
                placeholder="Select a context"
                options={contextOptions.map((context) => ({ label: context, value: context }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Title level={5}>Voicemail / Features</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="voicemailEnabled" label="Voicemail Enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="directoryListing" label="Directory Listing" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          {voicemailEnabled && (
            <>
              <Col xs={24} md={12}>
                <Form.Item
                  name="voicemailEmail"
                  label="Voicemail Email"
                  rules={[
                    { required: true, message: 'Voicemail email is required when voicemail is enabled.' },
                    { type: 'email', message: 'Enter a valid email address.' },
                  ]}
                >
                  <Input placeholder="voicemail@example.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="voicemailPassword"
                  label="Voicemail Password"
                  extra={mode === 'edit' ? 'Leave blank to keep the current voicemail password.' : undefined}
                  rules={[{ min: 4, message: 'Voicemail password must be at least 4 characters.' }]}
                >
                  <Input.Password placeholder={mode === 'edit' ? 'Unchanged' : 'Optional'} autoComplete="new-password" />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        <Divider />
        <Title level={5}>Advanced</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="sipSecret"
              label="SIP Secret"
              extra={mode === 'edit' ? 'Leave blank to keep the current secret.' : undefined}
              rules={[
                { required: mode === 'create', message: 'A SIP secret is required.' },
                { min: 8, message: 'SIP secret must be at least 8 characters.' },
              ]}
            >
              <Input.Password placeholder={mode === 'edit' ? 'Unchanged' : 'Enter a secret'} autoComplete="new-password" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="callRecording" label="Call Recording" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={submitting}>Save</Button>
      </Space>
    </Form>
  )
}

export default ExtensionForm
