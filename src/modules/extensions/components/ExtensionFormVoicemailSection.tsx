import { Card, Col, Form, Input, Row, Select } from 'antd'
import { voicemailFileOptions } from '../extension.constants'
import { voicemailMailToRule, voicemailPasswordRules } from '../extension.validation'

interface ExtensionFormVoicemailSectionProps {
  mode: 'create' | 'edit'
  disabled: boolean
}

/**
 * Rendered by the parent ExtensionForm only when `voicemail_enabled` is truthy.
 * Contains voicemail-to, delivery format, and the optional 6-digit password
 * (Edit shows a hint).
 */
const ExtensionFormVoicemailSection = ({
  mode,
  disabled,
}: ExtensionFormVoicemailSectionProps) => (
  <Card title="Voicemail">
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="voicemail_mail_to"
          label="Voicemail To"
          tooltip="Enter the email address for voicemail notifications"
          rules={[voicemailMailToRule]}
        >
          <Input placeholder="Enter email address" disabled={disabled} />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="voicemail_file"
          label="Voicemail File"
          tooltip="Select the voicemail file for this extension"
        >
          <Select
            allowClear
            placeholder="Select delivery option"
            options={voicemailFileOptions}
            disabled={disabled}
          />
        </Form.Item>
      </Col>

      <Col xs={24} md={12}>
        <Form.Item
          name="voicemail_password"
          label="Voicemail Password"
          tooltip="Enter the voicemail password"
          extra={mode === 'edit' ? 'Re-enter to change the current voicemail password.' : undefined}
          validateFirst
          rules={voicemailPasswordRules(mode)}
        >
          <Input.Password
            placeholder={mode === 'edit' ? 'Unchanged' : '6-digit PIN'}
            disabled={disabled}
          />
        </Form.Item>
      </Col>
    </Row>
  </Card>
)

export default ExtensionFormVoicemailSection