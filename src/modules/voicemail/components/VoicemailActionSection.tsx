import { Card, Col, Row } from 'antd'
import FormSwitchField from '../../../components/common/FormSwitchField'

/** "Action" card — the six switches for voicemail actions. */
const VoicemailActionSection = () => (
  <Card title="Action">
    <Row gutter={16}>
      <Col xs={24} md={12} lg={8}>
        <FormSwitchField
          name="voicemail_tutorial"
          label="Play Tutorial"
          tooltip="Play the voicemail tutorial after the next voicemail login"
          style={{ minHeight: 32 }}
        />
      </Col>

      <Col xs={24} md={12} lg={8}>
        <FormSwitchField
          name="voicemail_transcription_enabled"
          label="Transcription Enabled"
          tooltip="Choose if voicemail transcription is enabled for this extension"
          style={{ minHeight: 32 }}
        />
      </Col>

      <Col xs={24} md={12} lg={8}>
        <FormSwitchField
          name="voicemail_local_after_email"
          label="Keep Local"
          tooltip="Choose whether to keep the voicemail in the system after sending the email notification"
          style={{ minHeight: 32 }}
        />
      </Col>

      <Col xs={24} md={12} lg={8}>
        <FormSwitchField
          name="voicemail_play_cid"
          label="Play CID"
          tooltip="Play the caller ID before playing the voicemail message"
          style={{ minHeight: 32 }}
        />
      </Col>

      <Col xs={24} md={12} lg={8}>
        <FormSwitchField
          name="voicemail_play_envelope"
          label="Play Envelope"
          tooltip="Play the message envelope (date/time received) before playing the voicemail message"
          style={{ minHeight: 32 }}
        />
      </Col>

      <Col xs={24} md={12} lg={8}>
        <FormSwitchField
          name="voicemail_enabled"
          label="Enabled"
          tooltip="Select to enable or disable this voicemail"
          style={{ minHeight: 32 }}
        />
      </Col>
    </Row>
  </Card>
)

export default VoicemailActionSection