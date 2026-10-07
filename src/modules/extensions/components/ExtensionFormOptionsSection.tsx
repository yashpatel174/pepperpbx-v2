import { Card, Col, Form, Row } from "antd";
import { enabledRule } from "../extension.validation";
import FormSwitchField from "../../../components/common/FormSwitchField";

interface ExtensionFormOptionsSectionProps {
  disabled: boolean;
}

const ExtensionFormOptionsSection = ({
  disabled,
}: ExtensionFormOptionsSectionProps) => {
  const form = Form.useFormInstance();
  const voicemailEnabled = Form.useWatch("voicemail_enabled", form);

  const handleVoicemailEnabledChange = (checked: boolean) => {
    form.setFieldsValue({
      voicemail_enabled: checked,
      voicemail_transcription_enabled: checked,
      voicemail_local_after_email: checked,
    });
  };

  return (
    <Card title="Options">
      <Row gutter={[16, 8]}>
        <Col xs={24}>
          <FormSwitchField
            name="call_screen_enabled"
            label="Call Screen"
            tooltip="Choose whether to enable or disable call screening"
            disabled={disabled}
            ariaLabel="Call screen enabled"
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="force_ping"
            label="Force Ping"
            tooltip="Use options to detect if extension is reachable"
            disabled={disabled}
            ariaLabel="Force ping"
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="directory_visible"
            label="Directory Visible"
            tooltip="Select whether to hide the name from the directory"
            disabled={disabled}
            ariaLabel="Directory visible"
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="directory_exten_visible"
            label="Directory Extension Visible"
            tooltip="Select whether to announce the extension when calling the directory"
            disabled={disabled}
            ariaLabel="Directory extension visible"
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="voicemail_transcription_enabled"
            label="Voicemail Transcription Enabled"
            tooltip="Choose if voicemail transcription is enabled for this extension"
            disabled={disabled || !voicemailEnabled}
            ariaLabel="Voicemail transcription enabled"
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="voicemail_local_after_email"
            label="Voicemail Keep Local"
            tooltip="Choose whether to keep the voicemail in the system after sending the email notification"
            disabled={disabled || !voicemailEnabled}
            ariaLabel="Keep voicemail after email"
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="voicemail_enabled"
            label="Voicemail Enabled"
            tooltip="Enable/disable voicemail for this extension"
            disabled={disabled}
            ariaLabel="Voicemail enabled"
            onChange={handleVoicemailEnabledChange}
          />
        </Col>

        <Col xs={24}>
          <FormSwitchField
            name="enabled"
            label="Enabled"
            tooltip="Set the status of the extension"
            disabled={disabled}
            ariaLabel="Extension enabled"
            rules={[enabledRule]}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default ExtensionFormOptionsSection;