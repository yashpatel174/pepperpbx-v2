import { Card, Col, Form, Input, Row, Select } from "antd";
import FormSwitchField from "../../../components/common/FormSwitchField";
import { registerTransportOptions } from "../gateway.constants";
import { ipOrDomainRule, noEdgeWhitespaceRule, numericFieldRule } from "../gateway.validation";

/**
 * The Advanced Settings card — a separate section from Basic, matching the Axion reference's own
 * card split (and the visual convention already established for Extensions' Add/Edit, without
 * importing anything from that module). Rendered by GatewayForm only when the caller has
 * `gatewayPermission` — see useGatewayPermissions — so there is no per-field disabled state to
 * thread through here; the outer `<Form disabled={submitting}>` still applies while saving.
 */
const GatewayFormAdvancedSection = () => {

  return (
  <Card title="Advanced Settings" style={{ marginTop: 24 }}>
    <Row gutter={16} style={{ marginTop: 8 }}>
      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="auth_username"
          label="Auth Username"
          tooltip="Enter the auth username here"
          rules={[noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter auth username" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="extension"
          label="Extension"
          tooltip="Select the extension to be affected"
          rules={[noEdgeWhitespaceRule]}
        >
          <Input type={'number'} placeholder="Enter extension" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item name="register_transport" label="Register Transport" tooltip="Choose whether to register transport">
          <Select allowClear placeholder="Select transport" options={registerTransportOptions} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="register_proxy"
          label="Register Proxy"
          tooltip="Enter the hostname or IP address of the register proxy. host[:port]"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter register proxy" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="outbound_proxy"
          label="Outbound Proxy"
          tooltip="Enter the hostname or IP address of the outbound proxy. host[:port]"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter outbound proxy" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="sip_cid_type"
          label="SIP CID Type"
          tooltip="Enter the SIP CID type: none, PID, and RPID"
          rules={[noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter SIP CID type" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="codec_prefs"
          label="Codec Preferences"
          tooltip="Enter the codec preferences as a list. Ex: PCMA,PCMU,G722."
          rules={[noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter codec preferences" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="ping"
          label="Ping"
          tooltip="Enter the ping interval here in seconds"
          rules={[numericFieldRule]}
        >
          <Input type="number" min={0} placeholder="Enter ping" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item name="ping_min" label="Ping Min" tooltip="Enter the ping min" rules={[numericFieldRule]}>
          <Input type="number" min={0} placeholder="Enter ping min" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item name="ping_max" label="Ping Max" tooltip="Enter the ping max" rules={[numericFieldRule]}>
          <Input type="number" min={0} placeholder="Enter ping max" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="channels"
          label="Channels"
          tooltip="Maximum number of simultaneous channels available in the gateway"
          rules={[numericFieldRule]}
        >
          <Input type="number" min={0} placeholder="Enter channels" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="hostname"
          label="Hostname"
          tooltip="Enter the hostname/switchname"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input placeholder="Enter hostname" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
  <Col xs={24}>
    <FormSwitchField name="distinct_to" label="Distinct To" tooltip="Enter the distinct to here" />
  </Col>

  <Col xs={24}>
    <FormSwitchField name="caller_id_in_from" label="Caller ID In From" tooltip="Enter the caller ID in from" />
  </Col>

  <Col xs={24}>
    <FormSwitchField name="supress_cng" label="Supress CNG" tooltip="Enter the suppress CNG" />
  </Col>

  <Col xs={24}>
    <FormSwitchField name="extension_in_contact" label="Extension In Contact" tooltip="Enter the extension in contact" />
  </Col>
</Row> 
  </Card>
  );
};

export default GatewayFormAdvancedSection;
