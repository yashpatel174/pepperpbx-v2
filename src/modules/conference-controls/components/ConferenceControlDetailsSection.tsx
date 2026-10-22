import { Button, Card, Col, Form, Input, Row, Select, Switch, theme, Tooltip, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { controlDigitOptions, newConferenceControlDetail } from '../conference-control.constants'
import { controlActionRules, controlDigitsRules, noEdgeWhitespaceRule } from '../conference-control.validation'

/**
 * Edit-only "Control" card — the `conference_control_details` field array (conference-controls.md
 * §8/§26): one row per DTMF mapping with Digits (0–999), Action (free text), Data and Enabled.
 * Rendered inside ConferenceControlForm, so the rows are validated and submitted with the rest of
 * the form on Save. Removing a row only changes form state; it's persisted by the next Save, as in
 * Axion. The row-remove button is labelled "Remove" rather than Axion's misleading "Action" (§28).
 */
const ConferenceControlDetailsSection = () => {
  const { token } = theme.useToken()

  return (
    <Form.List name="conference_control_details">
      {(fields, { add, remove }) => (
        <Card
          title={
            <span>
              Control{' '}
              <Tooltip title="Map DTMF digits to conference actions. Each row is one keypad mapping.">
                <QuestionCircleOutlined />
              </Tooltip>
            </span>
          }
          extra={
            // TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated.
            <Button type="primary" icon={<PlusOutlined />} onClick={() => add({ ...newConferenceControlDetail })}>
              Add
            </Button>
          }
        >
          {fields.length === 0 && <Typography.Text type="secondary">No controls added yet.</Typography.Text>}

          {fields.map((field, index) => (
            <Row
              key={field.key}
              gutter={[16, 0]}
              align="top"
              style={{
                paddingTop: index === 0 ? 0 : token.paddingSM,
                borderTop: index === 0 ? undefined : `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Col xs={24} sm={12} lg={4}>
                <Form.Item name={[field.name, 'control_digits']} label="Digits" rules={controlDigitsRules}>
                  <Select  showSearch optionFilterProp="label" placeholder="Select digits" options={controlDigitOptions} aria-label="Digits" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={7}>
                <Form.Item name={[field.name, 'control_action']} label="Action" validateFirst rules={controlActionRules}>
                  <Input placeholder="Enter action" aria-label="Action" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={7}>
                <Form.Item name={[field.name, 'control_data']} label="Data" rules={[noEdgeWhitespaceRule]}>
                  <Input placeholder="Enter data" aria-label="Data" />
                </Form.Item>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Item name={[field.name, 'control_detail_enabled']} label="Enabled" valuePropName="checked">
                  <Switch aria-label="Control enabled" />
                </Form.Item>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Item label="Action">
                  <Tooltip title="Delete">
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} aria-label="Remove this control" />
                  </Tooltip>
                </Form.Item>
              </Col>
            </Row>
          ))}
        </Card>
      )}
    </Form.List>
  )
}

export default ConferenceControlDetailsSection
