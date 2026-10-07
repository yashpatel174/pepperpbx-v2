import { Card, Col, Form, Input, Row, Select } from "antd";
import FormSwitchField from "../../../components/common/FormSwitchField";
import { GLOBAL_DOMAIN_OPTION } from "../gateway.constants";
import { isGatewayNameTaken } from "../gateway.service";
import type { HiveGatewayDetails, SbcDomainOption, SipProfileOption } from "../gateway.types";
import { gatewayNameRule, ipOrDomainRule, noEdgeWhitespaceRule, numericFieldRule } from "../gateway.validation";

const { TextArea } = Input;

interface GatewayFormBasicSectionProps {
  mode: "create" | "edit";
  excludeUuid?: string;
  hive: HiveGatewayDetails;
  sbcDomains: SbcDomainOption[];
  sipProfiles: SipProfileOption[];
  /** True while domain-dependent options are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean;
  registerEnabled: boolean;
  onDomainChange: (value: string) => void;
}

const GatewayFormBasicSection = ({
  mode,
  excludeUuid,
  hive,
  sbcDomains,
  sipProfiles,
  optionsLoading,
  registerEnabled,
  onDomainChange,
}: GatewayFormBasicSectionProps) => {

  return (
  <Card>
    <Row gutter={16}>
      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="gateway"
          label="Gateway"
          tooltip="Enter the gateway name here"
          validateFirst
          rules={[
            { required: true, message: "Gateway required" },
            gatewayNameRule,
            noEdgeWhitespaceRule,
            {
              validator: async (_, value: string) => {
                if (!value) return;

                if (await isGatewayNameTaken(value, excludeUuid)) {
                  throw new Error("This gateway name is already in use.");
                }
              },
            },
          ]}
        >
          <Input placeholder="Enter gateway name" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="username"
          label="Username"
          tooltip="Enter the username here"
          rules={[
            {
              required: registerEnabled,
              message: "Username required",
            },
            noEdgeWhitespaceRule,
          ]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="password"
          label="Password"
          tooltip="Enter the password here"
          rules={[
            {
              // Create requires a password when registering; Edit always allows it blank so the
              // existing password is preserved (see gateway.service.ts's updateGateway).
              required: mode === "create" && registerEnabled,
              message: "Password required",
            },
            noEdgeWhitespaceRule,
          ]}
        >
          <Input.Password placeholder="Enter password" autoComplete="new-password" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item name="from_user" label="From User" tooltip="Enter the from user here" rules={[noEdgeWhitespaceRule]}>
          <Input placeholder="Enter from user" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="domain_name"
          label="Domain"
          tooltip="Select the domain"
          rules={[
            {
              required: true,
              message: "Domain Name is required",
            },
            noEdgeWhitespaceRule,
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Select domain"
            disabled={mode === "edit"}
            onChange={onDomainChange}
            options={[
              GLOBAL_DOMAIN_OPTION,
              ...hive.domainOptions.map((domain) => ({
                label: domain,
                value: domain,
              })),
            ]}
            aria-label="Domain"
          />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="sbcDomainIp"
          label="SBC Domain"
          tooltip="Select the SBC Domain"
          rules={[
            {
              required: true,
              message: "SBC Domain required",
            },
          ]}
        >
          <Select placeholder="Select SBC domain" options={sbcDomains} loading={optionsLoading} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="proxy"
          label="Proxy"
          tooltip="Enter the hostname or IP address of the proxy. host[:port]"
          validateFirst
          rules={[
            {
              required: true,
              message: "Proxy required",
            },
            ipOrDomainRule,
            noEdgeWhitespaceRule,
          ]}
        >
          <Input placeholder="e.g. 203.0.113.10" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="realm"
          label="Realm"
          tooltip="Enter the realm here"
          validateFirst
          rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
        >
          <Input placeholder="e.g. sip.example.test" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="expire_seconds"
          label="Expire Seconds"
          tooltip="Enter the expire seconds here"
          rules={[
            {
              required: true,
              message: "Expire Seconds required",
            },
            numericFieldRule,
          ]}
        >
          <Input type="number" min={0} placeholder="Enter expire seconds" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="retry_seconds"
          label="Retry Seconds"
          tooltip="Enter the retry seconds here"
          rules={[
            {
              required: true,
              message: "Retry Seconds required",
            },
            numericFieldRule,
          ]}
        >
          <Input type="number" min={0} placeholder="Enter retry seconds" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item name="context" label="Context" tooltip="Enter the context here" rules={[noEdgeWhitespaceRule]}>
          <Input placeholder="Enter context" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <Form.Item name="profile" label="Profile" tooltip="Enter the profile here">
          <Select allowClear placeholder="Select SIP profile" options={sipProfiles} loading={optionsLoading} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12} lg={8}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px 20px",
            minHeight: 32,
          }}
        >
          <FormSwitchField name="register" label="Register" tooltip="Choose whether to register" style={{ minHeight: 32, minWidth: 120 }} />
          <FormSwitchField name="enabled" label="Enabled" tooltip="Set the status of the gateway" style={{ minHeight: 32, minWidth: 120 }} />
        </div>
      </Col>
      <Col xs={24} lg={16}>
        <Form.Item
          name="description"
          label="Description"
          tooltip="Enter the description"
          rules={[noEdgeWhitespaceRule]}
        >
          <TextArea rows={3} placeholder="Enter description" />
        </Form.Item>
      </Col>
    </Row>
  </Card>
  );
};

export default GatewayFormBasicSection;
