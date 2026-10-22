import { Card, Col, Form, Input, Row, Select } from "antd";
import FormSwitchField from "../../../components/common/FormSwitchField";
import { callBlockDirectionOptions, callBlockNumberLabel } from "../call-block.constants";
import {
  countryCodeRule,
  descriptionRules,
  nameFormatRule,
  nameRequiredIfNumberEmptyRule,
  noEdgeWhitespaceRule,
  numberFormatRule,
  numberRequiredIfNameEmptyRule,
} from "../call-block.validation";
import type { CallBlockDirection, HiveCallBlockDetails, SelectOption } from "../call-block.types";

const { TextArea } = Input;

interface CallBlockBasicSectionProps {
  mode: "create" | "edit";
  hive: HiveCallBlockDetails;
  extensionOptions: SelectOption[];
  actionOptions: SelectOption[];
  optionsLoading?: boolean;
  disabled?: boolean;
  onDomainChange: (value: string) => void;
}

/**
 * Core call-block fields card, shared by both Add and Edit via CallBlockForm's `mode` prop — the
 * audit documents the same BasicForm fields in both screens (call-block.md §4/§8), only Domain is
 * mode-locked (disabled on Edit, call-block.md §15/§33 — a rule can't move between domains after
 * creation).
 *
 * `call_block_name` and `call_block_number` are mutually required-if-other-empty (call-block.md
 * §8/§9/§10/§26/§33) — implemented via AntD `Form.Item dependencies` so each field re-validates
 * when the other changes, matching the audit's react-hook-form `trigger(['call_block_name',
 * 'call_block_number'])` equivalent. The Number field's label and required-message adapt to
 * Direction (call-block.md §9/§25/§33's core "direction-aware UX" business rule).
 */
const CallBlockBasicSection = ({
  mode,
  hive,
  extensionOptions,
  actionOptions,
  optionsLoading,
  disabled,
  onDomainChange,
}: CallBlockBasicSectionProps) => {
  const form = Form.useFormInstance();
  const direction = (Form.useWatch("call_block_direction", form) as CallBlockDirection | undefined) ?? "inbound";
  const numberLabel = callBlockNumberLabel(direction);

  return (
    <Card>
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="call_block_direction"
            label="Direction"
            tooltip="Select the direction of the calls to block"
            rules={[{ required: true, message: "Direction is required" }]}
          >
            <Select options={callBlockDirectionOptions} placeholder="Select direction" aria-label="Direction" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item name="extension_uuid" label="Extension" tooltip="The extension this rule applies to (optional)">
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="Select extension"
              options={extensionOptions}
              loading={optionsLoading}
              aria-label="Extension"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="call_block_name"
            label="Caller ID Name"
            tooltip="At least one of Caller ID Name or Number is required"
            dependencies={["call_block_number"]}
            validateFirst
            rules={[
              nameFormatRule,
              noEdgeWhitespaceRule,
              nameRequiredIfNumberEmptyRule(() => form.getFieldValue("call_block_number")),
            ]}
          >
            <Input placeholder="Enter caller ID name" aria-label="Caller ID name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="call_block_action"
            label="Action"
            tooltip="Set an action for calls from this number."
            rules={[{ required: true, message: "Action is required" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select action"
              options={actionOptions}
              loading={optionsLoading}
              aria-label="Action"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="call_block_country_code"
            label="Country Code"
            tooltip="Optional country codeEnter the country code and caller ID number to block."
            rules={[countryCodeRule]}
          >
            <Input type={"number"} min={0} placeholder="Enter country code" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="call_block_number"
            label={numberLabel}
            dependencies={["call_block_name"]}
            validateFirst
            rules={[
              numberFormatRule,
              noEdgeWhitespaceRule,
              numberRequiredIfNameEmptyRule(() => form.getFieldValue("call_block_name"), direction),
            ]}
          >
            <Input type={"number"} min={0} placeholder={`Enter ${numberLabel.toLowerCase()}`} aria-label={numberLabel} />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="domain_name"
            label="Domain"
            tooltip="Set the domain"
            rules={[{ required: true, message: "Domain is required" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select domain"
              disabled={mode === "edit"}
              onChange={onDomainChange}
              options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
              aria-label="Domain"
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={16}>
          <Form.Item
            name="call_block_description"
            label="Description"
            tooltip="Enter a description"
            rules={descriptionRules}
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <FormSwitchField
            name="call_block_enabled"
            label="Enabled"
            tooltip="Set to true to enable call blocking for this number"
            disabled={disabled}
            style={{ minHeight: 32 }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default CallBlockBasicSection;
