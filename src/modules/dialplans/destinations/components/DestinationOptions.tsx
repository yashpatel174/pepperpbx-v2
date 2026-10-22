import { Card, Col, Row } from 'antd'
import FormSwitchField from '../../../../components/common/FormSwitchField'

interface DestinationOptionsProps {
  disabled: boolean
}

/** "Options" card — Record / Enabled SMS-MMS / Enabled switches (destinations.md §8's SwitchForm). */
const DestinationOptions = ({ disabled }: DestinationOptionsProps) => (
  <Card title="Options">
    <Row gutter={[16, 12]}>
      <Col xs={24} >
        <FormSwitchField
          name="destination_record"
          label="Record"
          tooltip="Save the recording"
          disabled={disabled}
          ariaLabel="Record"
        />
      </Col>
      <Col xs={24} >
        <FormSwitchField
          name="sms_enabled"
          label="Enabled SMS/MMS"
          tooltip="Set the status of sms/mms for this destination"
          disabled={disabled}
          ariaLabel="Enabled SMS/MMS"
        />
      </Col>
      <Col xs={24} >
        <FormSwitchField
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
