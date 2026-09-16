import { QuestionCircleOutlined } from '@ant-design/icons'
import { Card, Col, Form, Row, Switch, theme, Tooltip } from 'antd'

interface DestinationOptionsProps {
  disabled: boolean
}

interface OptionSwitchProps {
  name: string
  label: string
  tooltip: string
  disabled: boolean
  ariaLabel: string
}

const OptionSwitch = ({ name, label, tooltip, disabled, ariaLabel }: OptionSwitchProps) => {
  const { token } = theme.useToken()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Form.Item name={name} valuePropName="checked" style={{ marginBottom: 0 }}>
        <Switch disabled={disabled} aria-label={ariaLabel} />
      </Form.Item>
      <span>{label}</span>
      <Tooltip title={tooltip}>
        <QuestionCircleOutlined
          aria-label={`${label} information`}
          style={{ color: token.colorTextTertiary, fontSize: 12, cursor: 'help' }}
        />
      </Tooltip>
    </div>
  )
}

/** "Options" card — Record / Enabled SMS-MMS / Enabled switches (destinations.md §8's SwitchForm). */
const DestinationOptions = ({ disabled }: DestinationOptionsProps) => (
  <Card title="Options">
    <Row gutter={[16, 12]}>
      <Col xs={24} >
        <OptionSwitch
          name="destination_record"
          label="Record"
          tooltip="Save the recording"
          disabled={disabled}
          ariaLabel="Record"
        />
      </Col>
      <Col xs={24} >
        <OptionSwitch
          name="sms_enabled"
          label="Enabled SMS/MMS"
          tooltip="Set the status of sms/mms for this destination"
          disabled={disabled}
          ariaLabel="Enabled SMS/MMS"
        />
      </Col>
      <Col xs={24} >
        <OptionSwitch
          name="destination_enabled"
          label="Enabled"
          tooltip="Select to enable or disable"
          disabled={disabled}
          ariaLabel="Destination enabled"
        />
      </Col>
    </Row>
  </Card>
)

export default DestinationOptions
