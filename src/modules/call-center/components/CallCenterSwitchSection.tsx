import { Card, Col, Form, Row, Switch } from 'antd'

interface SwitchFieldProps {
  name: string
  label: string
  disabled?: boolean
}

const SwitchField = ({ name, label, disabled }: SwitchFieldProps) => (
  <Col xs={24}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch disabled={disabled} aria-label={label} />
      </Form.Item>

      <span>{label}</span>
    </div>
  </Col>
)

interface CallCenterSwitchSectionProps {
  disabled?: boolean
}

const CallCenterSwitchSection = ({ disabled }: CallCenterSwitchSectionProps) => (
  <Card title="Switch">
    <Row gutter={[16, 16]}>
      <SwitchField
        name="queue_record_template"
        label="Record"
        disabled={disabled}
      />

      <SwitchField
        name="queue_tier_rules_apply"
        label="Tier Rules Apply"
        disabled={disabled}
      />

      <SwitchField
        name="queue_abandoned_resume_allowed"
        label="Abandoned Resume Allowed"
        disabled={disabled}
      />

      <SwitchField
        name="queue_announce_position"
        label="Announce Position"
        disabled={disabled}
      />

      <SwitchField
        name="queue_tier_rule_wait_multiply_level"
        label="Tier Rule Wait Multiply Level"
        disabled={disabled}
      />

      <SwitchField
        name="queue_tier_rule_no_agent_no_wait"
        label="Tier Rule No Agent No Wait"
        disabled={disabled}
      />
    </Row>
  </Card>
)

export default CallCenterSwitchSection