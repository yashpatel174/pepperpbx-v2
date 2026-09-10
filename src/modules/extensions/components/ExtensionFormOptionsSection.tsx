import { QuestionCircleOutlined } from "@ant-design/icons";
import { Card, Col, Form, Row, Switch, Tooltip } from "antd";
import { enabledRule } from "../extension.validation";

interface ExtensionFormOptionsSectionProps {
  disabled: boolean;
}

interface OptionSwitchProps {
  name: string;
  label: string;
  tooltip: string;
  disabled: boolean;
  ariaLabel: string;
  onChange?: (checked: boolean) => void;
  rules?: Parameters<typeof Form.Item>[0]["rules"];
}

const OptionSwitch = ({
  name,
  label,
  tooltip,
  disabled,
  ariaLabel,
  onChange,
  rules,
}: OptionSwitchProps) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Form.Item
        name={name}
        valuePropName="checked"
        rules={rules}
        style={{ marginBottom: 0 }}
      >
        <Switch
          disabled={disabled}
          onChange={onChange}
          aria-label={ariaLabel}
        />
      </Form.Item>

      <span>{label}</span>

      <Tooltip title={tooltip}>
        <QuestionCircleOutlined
          aria-label={`${label} information`}
          style={{
            color: "#8c8c8c",
            fontSize: 12,
            cursor: "help",
          }}
        />
      </Tooltip>
    </div>
  );
};

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
          <OptionSwitch
            name="call_screen_enabled"
            label="Call Screen"
            tooltip="Choose whether to enable or disable call screening"
            disabled={disabled}
            ariaLabel="Call screen enabled"
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
            name="force_ping"
            label="Force Ping"
            tooltip="Use options to detect if extension is reachable"
            disabled={disabled}
            ariaLabel="Force ping"
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
            name="directory_visible"
            label="Directory Visible"
            tooltip="Select whether to hide the name from the directory"
            disabled={disabled}
            ariaLabel="Directory visible"
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
            name="directory_exten_visible"
            label="Directory Extension Visible"
            tooltip="Select whether to announce the extension when calling the directory"
            disabled={disabled}
            ariaLabel="Directory extension visible"
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
            name="voicemail_transcription_enabled"
            label="Voicemail Transcription Enabled"
            tooltip="Choose if voicemail transcription is enabled for this extension"
            disabled={disabled || !voicemailEnabled}
            ariaLabel="Voicemail transcription enabled"
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
            name="voicemail_local_after_email"
            label="Voicemail Keep Local"
            tooltip="Choose whether to keep the voicemail in the system after sending the email notification"
            disabled={disabled || !voicemailEnabled}
            ariaLabel="Keep voicemail after email"
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
            name="voicemail_enabled"
            label="Voicemail Enabled"
            tooltip="Enable/disable voicemail for this extension"
            disabled={disabled}
            ariaLabel="Voicemail enabled"
            onChange={handleVoicemailEnabledChange}
          />
        </Col>

        <Col xs={24}>
          <OptionSwitch
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