import { Card, Col, Form, Input, Row, Select, Switch, theme, Tooltip } from "antd";
import { registerTransportOptions } from "../gateway.constants";
import { ipOrDomainRule, noEdgeWhitespaceRule, numericFieldRule } from "../gateway.validation";
import { QuestionCircleOutlined } from "@ant-design/icons";

/**
 * The Advanced Settings card — a separate section from Basic, matching the Axion reference's own
 * card split (and the visual convention already established for Extensions' Add/Edit, without
 * importing anything from that module). Rendered by GatewayForm only when the caller has
 * `gatewayPermission` — see useGatewayPermissions — so there is no per-field disabled state to
 * thread through here; the outer `<Form disabled={submitting}>` still applies while saving.
 */
const GatewayFormAdvancedSection = () => {
  const { token } = theme.useToken();

  return (
  <Card title="Advanced Settings" style={{ marginTop: 24 }}>
    <Row gutter={16} style={{ marginTop: 8 }}>
      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="auth_username"
          label="Auth Username"
          tooltip="Enter the auth username here"
          rules={[noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="extension"
          label="Extension"
          tooltip="Select the extension to be affected"
          rules={[noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item name="register_transport" label="Register Transport" tooltip="Choose whether to register transport">
          <Select allowClear placeholder="Select transport" options={registerTransportOptions} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="register_proxy"
          label="Register Proxy"
          tooltip="Enter the hostname or IP address of the register proxy. host[:port]"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="outbound_proxy"
          label="Outbound Proxy"
          tooltip="Enter the hostname or IP address of the outbound proxy. host[:port]"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="sip_cid_type"
          label="SIP CID Type"
          tooltip="Enter the SIP CID type: none, PID, and RPID"
          rules={[noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="codec_prefs"
          label="Codec Preferences"
          tooltip="Enter the codec preferences as a list. Ex: PCMA,PCMU,G722."
          rules={[noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="ping"
          label="Ping"
          tooltip="Enter the ping interval here in seconds"
          rules={[numericFieldRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item name="ping_min" label="Ping Min" tooltip="Enter the ping min" rules={[numericFieldRule]}>
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item name="ping_max" label="Ping Max" tooltip="Enter the ping max" rules={[numericFieldRule]}>
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="channels"
          label="Channels"
          tooltip="Maximum number of simultaneous channels available in the gateway"
          rules={[numericFieldRule]}
        >
          <Input />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} md={8}>
        <Form.Item
          name="hostname"
          label="Hostname"
          tooltip="Enter the hostname/switchname"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input />
        </Form.Item>
      </Col>
    </Row>
    {/* <Row gutter={[16, 8]}>
      <Col xs={24} sm={12} md={6}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Form.Item name="distinct_to" valuePropName="checked" noStyle>
            <Switch aria-label="Distinct To" />
          </Form.Item>
          <span>Distinct To</span>
          <Tooltip title="Enter the distinct to here">
            <QuestionCircleOutlined
              aria-label="Distinct To information"
              style={{ color: token.colorTextTertiary, fontSize: 12, cursor: "help" }}
            />
          </Tooltip>
        </div>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Form.Item name="caller_id_in_from" valuePropName="checked" noStyle>
            <Switch aria-label="Caller ID In From" />
          </Form.Item>
          <span>Caller ID In From</span>
          <Tooltip title="Enter the caller ID in from">
            <QuestionCircleOutlined
              aria-label="Caller ID In From information"
              style={{ color: token.colorTextTertiary, fontSize: 12, cursor: "help" }}
            />
          </Tooltip>
        </div>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Form.Item name="supress_cng" valuePropName="checked" noStyle>
            <Switch aria-label="Supress CNG" />
          </Form.Item>
          <span>Supress CNG</span>
          <Tooltip title="Enter the suppress CNG">
            <QuestionCircleOutlined
              aria-label="Supress CNG information"
              style={{ color: token.colorTextTertiary, fontSize: 12, cursor: "help" }}
            />
          </Tooltip>
        </div>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Form.Item name="extension_in_contact" valuePropName="checked" noStyle>
            <Switch aria-label="Extension In Contact" />
          </Form.Item>
          <span>Extension In Contact</span>
          <Tooltip title="Enter the extension in contact">
            <QuestionCircleOutlined
              aria-label="Extension In Contact information"
              style={{ color: token.colorTextTertiary, fontSize: 12, cursor: "help" }}
            />
          </Tooltip>
        </div>
      </Col>
    </Row> */}
    <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
  <Col xs={24}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Form.Item name="distinct_to" valuePropName="checked" noStyle>
        <Switch aria-label="Distinct To" />
      </Form.Item>

      <span>Distinct To</span>

      <Tooltip title="Enter the distinct to here">
        <QuestionCircleOutlined
          aria-label="Distinct To information"
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
            cursor: "help",
          }}
        />
      </Tooltip>
    </div>
  </Col>

  <Col xs={24}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Form.Item name="caller_id_in_from" valuePropName="checked" noStyle>
        <Switch aria-label="Caller ID In From" />
      </Form.Item>

      <span>Caller ID In From</span>

      <Tooltip title="Enter the caller ID in from">
        <QuestionCircleOutlined
          aria-label="Caller ID In From information"
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
            cursor: "help",
          }}
        />
      </Tooltip>
    </div>
  </Col>

  <Col xs={24}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Form.Item name="supress_cng" valuePropName="checked" noStyle>
        <Switch aria-label="Supress CNG" />
      </Form.Item>

      <span>Supress CNG</span>

      <Tooltip title="Enter the suppress CNG">
        <QuestionCircleOutlined
          aria-label="Supress CNG information"
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
            cursor: "help",
          }}
        />
      </Tooltip>
    </div>
  </Col>

  <Col xs={24}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Form.Item name="extension_in_contact" valuePropName="checked" noStyle>
        <Switch aria-label="Extension In Contact" />
      </Form.Item>

      <span>Extension In Contact</span>

      <Tooltip title="Enter the extension in contact">
        <QuestionCircleOutlined
          aria-label="Extension In Contact information"
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
            cursor: "help",
          }}
        />
      </Tooltip>
    </div>
  </Col>
</Row> 
  </Card>
  );
};

export default GatewayFormAdvancedSection;
