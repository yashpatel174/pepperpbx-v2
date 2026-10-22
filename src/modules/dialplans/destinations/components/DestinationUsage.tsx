import { QuestionCircleOutlined } from '@ant-design/icons'
import { Card, Checkbox, Col, Form, Row, theme, Tooltip } from 'antd'

interface DestinationUsageProps {
  disabled: boolean
}

interface UsageCheckboxProps {
  name: string
  label: string
  tooltip: string
  disabled: boolean
  ariaLabel: string
}

const UsageCheckbox = ({
  name,
  label,
  tooltip,
  disabled,
  ariaLabel,
}: UsageCheckboxProps) => {
  const { token } = theme.useToken()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Form.Item name={name} valuePropName="checked" style={{ marginBottom: 0 }}>
        <Checkbox disabled={disabled} aria-label={ariaLabel}>
          {label}
        </Checkbox>
      </Form.Item>

      <Tooltip title={tooltip}>
        <QuestionCircleOutlined
          aria-label={`${label} information`}
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
            cursor: 'help',
          }}
        />
      </Tooltip>
    </div>
  )
}

/**
 * "Usage" card — Voice/Fax/Text/Emergency checkboxes (destinations.md §8's CheckForm).
 * A sibling section rendered alongside DestinationOptions, not nested inside the main
 * DestinationForm fields — mirrors Extensions' Options/Voicemail card split.
 */
const DestinationUsage = ({ disabled }: DestinationUsageProps) => (
  <Card title="Usage">
    <Row gutter={[16, 12]}>
      <Col xs={24}>
        <UsageCheckbox
          name="destination_type_voice"
          label="Voice"
          tooltip="Set how the destination will be used"
          disabled={disabled}
          ariaLabel="Voice usage"
        />
      </Col>

      <Col xs={24}>
        <UsageCheckbox
          name="destination_type_fax"
          label="Fax"
          tooltip="Set how the destination will be used"
          disabled={disabled}
          ariaLabel="Fax usage"
        />
      </Col>

      <Col xs={24}>
        <UsageCheckbox
          name="destination_type_text"
          label="Text"
          tooltip="Set how the destination will be used"
          disabled={disabled}
          ariaLabel="Text usage"
        />
      </Col>

      <Col xs={24}>
        <UsageCheckbox
          name="destination_type_emergency"
          label="Emergency"
          tooltip="Set how the destination will be used"
          disabled={disabled}
          ariaLabel="Emergency usage"
        />
      </Col>
    </Row>
  </Card>
)

export default DestinationUsage
