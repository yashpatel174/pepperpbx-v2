import { Button, Card, Col, Form, Input, Row, Switch, theme, Tooltip, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { newConferenceProfileParam } from '../conference-profile.constants'
import { noEdgeWhitespaceRule, paramNameRules, paramValueRules } from '../conference-profile.validation'

const { TextArea } = Input

/**
 * Edit-only "Profile Parameters" card — the `conference_profile_params` field array
 * (conference-profiles.md §8/§26): one row per key-value parameter with Name, Value, Description
 * and Enabled, plus a per-row Delete. Rendered inside ConferenceProfileForm, so the rows are
 * validated and submitted with the rest of the form on Save. Removing a row only changes form
 * state; it's persisted by the next Save, as in Axion.
 */
const ConferenceProfileParamsSection = () => {
  const { token } = theme.useToken()

  return (
    <Form.List name="conference_profile_params">
      {(fields, { add, remove }) => (
        <Card
          title={
            <span>
              Profile Parameters{' '}
              <Tooltip title="Name/value parameters that define this profile's conference behavior. Their meaning is defined by the backend.">
                <QuestionCircleOutlined />
              </Tooltip>
            </span>
          }
          extra={
            // TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated.
            <Button type="primary" icon={<PlusOutlined />} onClick={() => add({ ...newConferenceProfileParam })}>
              Add
            </Button>
          }
        >
          {fields.length === 0 && <Typography.Text type="secondary">No parameters added yet.</Typography.Text>}

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
              <Col xs={24} sm={12} lg={5}>
                <Form.Item name={[field.name, 'profile_param_name']} label="Name" validateFirst rules={paramNameRules}>
                  <Input placeholder="Enter name" aria-label="Parameter name" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} lg={5}>
                <Form.Item name={[field.name, 'profile_param_value']} label="Value" validateFirst rules={paramValueRules}>
                  <Input placeholder="Enter value" aria-label="Parameter value" />
                </Form.Item>
              </Col>

              <Col xs={24} lg={8}>
                <Form.Item name={[field.name, 'profile_param_description']} label="Description" rules={[noEdgeWhitespaceRule]}>
                  <TextArea rows={3} placeholder="Enter description" aria-label="Parameter description" />
                </Form.Item>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Item name={[field.name, 'profile_param_enabled']} label="Enabled" valuePropName="checked">
                  <Switch aria-label="Parameter enabled" />
                </Form.Item>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Item label="Action">
                  <Tooltip title="Delete">
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} aria-label="Delete this parameter" />
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

export default ConferenceProfileParamsSection
