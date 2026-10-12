import { Card, Col, Form, Input, Row, Select } from "antd";
import { orderOptions } from "../outbound-route.constants";
import { isOutboundRouteNameTaken } from "../outbound-route.service";
import {
  callerIdNumberRules,
  ipOrDomainRule,
  maxTwentyDigitsRule,
  noEdgeWhitespaceRule,
  routeNameRules,
} from "../outbound-route.validation";
import type { HiveOutboundRouteDetails, SbcDomainOption } from "../outbound-route.types";
import FormSwitchField from "../../../../components/common/FormSwitchField";

const { TextArea } = Input;

interface OutboundRouteBasicSectionProps {
  mode: "create" | "edit";
  excludeUuid?: string;
  hive: HiveOutboundRouteDetails;
  sbcDomains: SbcDomainOption[];
  optionsLoading?: boolean;
  onDomainChange: (value: string) => void;
}

/**
 * Basic-information card, shared by both Add and Edit via OutboundRouteForm's `mode` prop.
 */
const OutboundRouteBasicSection = ({
  mode,
  excludeUuid,
  hive,
  sbcDomains,
  optionsLoading,
  onDomainChange,
}: OutboundRouteBasicSectionProps) => {
  return (
    <Card>
      <Row gutter={16} align="middle">
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="outbound_route_name"
            label="Outbound Route Name"
            tooltip="Enter a name for this outbound route"
            validateFirst
            rules={routeNameRules(isOutboundRouteNameTaken, excludeUuid)}
          >
            <Input placeholder="Enter outbound route name" aria-label="Outbound route name" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="outbound_caller_id_name"
            label="Outbound Caller ID Name"
            tooltip="Enter the outbound caller ID name"
            rules={[noEdgeWhitespaceRule]}
          >
            <Input placeholder="Enter caller id name" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="outbound_caller_id_number"
            label="Outbound Caller ID Number"
            tooltip="Enter the outbound caller ID number"
            validateFirst
            rules={callerIdNumberRules}
          >
            <Input type={"number"} min={0} placeholder="Enter caller id number" aria-label="Outbound caller id number" />
          </Form.Item>
        </Col>

        {mode === "create" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="prefix_number" label="Prefix" tooltip="Enter a dial prefix" rules={[noEdgeWhitespaceRule]}>
              <Input placeholder="Enter prefix" />
            </Form.Item>
          </Col>
        )}

        {mode === "create" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="limit"
              label="Limit"
              tooltip="Enter the maximum concurrent calls"
              rules={[maxTwentyDigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter limit" />
            </Form.Item>
          </Col>
        )}

        {mode === "edit" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="dialplan_number"
              label="Number"
              tooltip="Enter the number"
              rules={[maxTwentyDigitsRule, noEdgeWhitespaceRule]}
            >
              <Input type={"number"} min={0} placeholder="Enter number" />
            </Form.Item>
          </Col>
        )}

        {mode === "edit" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="hostname"
              label="Hostname"
              tooltip="Enter a hostname or IP address"
              rules={[ipOrDomainRule, noEdgeWhitespaceRule]}
            >
              <Input placeholder="e.g. sip.example.test" />
            </Form.Item>
          </Col>
        )}

        {mode === "edit" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="dialplan_context" label="Context" tooltip="Server-derived from the domain; not editable">
              <Input disabled placeholder="Context" aria-label="Context" />
            </Form.Item>
          </Col>
        )}

        {mode === "create" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="accountcode" label="Account Code" tooltip="Server-derived; not editable">
              <Input disabled placeholder="Account code" aria-label="Account code" />
            </Form.Item>
          </Col>
        )}

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="domain_name"
            label="Domain"
            tooltip="Select the domain"
            rules={[{ required: true, message: "Domain Name is required" }, noEdgeWhitespaceRule]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select domain"
              disabled={mode === "edit"}
              onChange={onDomainChange}
              options={hive.domainOptions.map((domain) => ({
                label: domain,
                value: domain,
              }))}
              aria-label="Domain"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="sbcDomainIp"
            label="SBC Domain"
            tooltip="Select the SBC domain"
            rules={[{ required: true, message: "SBC Domain is required" }]}
          >
            <Select
              placeholder="Select SBC domain"
              options={sbcDomains}
              loading={optionsLoading}
              aria-label="SBC domain"
            />
          </Form.Item>
        </Col>

        {mode === "create" && (
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="toll_allow"
              label="Toll Allow"
              tooltip="Enter allowed toll types"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter toll allow" />
            </Form.Item>
          </Col>
        )}

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="dialplan_order"
            label="Order"
            tooltip="The order number determines the order of the outbound routes when there is more than one."
            rules={[{ required: true, message: "Order is required" }]}
          >
            <Select showSearch options={orderOptions} placeholder="Select order" aria-label="Order" />
          </Form.Item>
        </Col>

        <Col xs={24} lg={16}>
          <Form.Item
            name="dialplan_description"
            label="Description"
            tooltip="Enter a description (optional)"
            rules={[noEdgeWhitespaceRule]}
          >
            <TextArea rows={2} placeholder="Enter description" />
          </Form.Item>
        </Col>
        {mode === "create" && (
          <Col xs={24} sm={12} lg={8}>
            <FormSwitchField
              style={{ minHeight: 32 }}
              name="pin_numbers_enabled"
              label="PIN Numbers"
              tooltip="Select the PIN number"
              ariaLabel="PIN Numbers"
            />
          </Col>
        )}
        {mode === "edit" && (
          <>
            <Col xs={0} sm={0} md={0} lg={8} />

            <Col xs={24} sm={12} lg={8}>
              <FormSwitchField
                style={{ minHeight: 32 }}
                name="dialplan_continue"
                label="Continue"
                tooltip="Select the continue"
                ariaLabel="Continue"
              />
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <FormSwitchField
                style={{ minHeight: 32 }}
                name="dialplan_destination"
                label="Destination"
                tooltip="Select the destination"
                ariaLabel="Destination"
              />
            </Col>
          </>
        )}
        <Col xs={24} sm={12} lg={8}>
          <FormSwitchField style={{ minHeight: 32 }} name="dialplan_enabled" label="Enabled" tooltip="Select the enabled" ariaLabel="Enabled" />
        </Col>
      </Row>
    </Card>
  );
};

export default OutboundRouteBasicSection;
