import { Card, Col, Form, Input, Row, Select, theme } from "antd";
import { extensionReuseNote } from "../../../components/common/extensionReuseNote";
import {
  descriptionRules,
  extensionRangeRule,
  nameFormatRule,
  nameRequiredRule,
  noEdgeWhitespaceRule,
  numericUpTo20DigitsRule,
  requiredSelectRule,
} from "../call-center.validation";
import { queueStrategyOptions, timeBaseScoreOptions } from "../call-center.constants";
import type { HiveCallCenterDetails, SelectOption } from "../call-center.types";
import useCallCenterPermissions from "../useCallCenterPermissions";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";

const { TextArea } = Input;

interface CallCenterBasicSectionProps {
  mode: "create" | "edit";
  hive: HiveCallCenterDetails;
  greetingOptions: SelectOption[];
  timeoutActionOptions: SelectOption[];
  announceOptions: SelectOption[];
  musicOnHoldOptions: SelectOption[];
  optionsLoading?: boolean;
  disabled?: boolean;
  onDomainChange: (value: string) => void;
}

/**
 * Core queue fields card, shared by both Add and Edit via CallCenterForm's `mode` prop — matches
 * the audit's documented `BasicForm` field set exactly (call-center.md §8). Only Domain is
 * mode-locked (disabled on Edit, call-center.md §9/§15/§33 — a queue can't move between domains
 * after creation).
 *
 * `queue_greeting`/`queue_timeout_action`/`queue_announce_sound` use the shared
 * `ToggleSelectInput` (components/common) — PepperPBX's equivalent of Axion's
 * `ToggleSelectInputCallCenter` "select or type your own" control. All three are optional, so
 * their Select is clearable.
 */
const CallCenterBasicSection = ({
  mode,
  hive,
  greetingOptions,
  timeoutActionOptions,
  announceOptions,
  musicOnHoldOptions,
  optionsLoading,
  disabled,
  onDomainChange,
}: CallCenterBasicSectionProps) => {
  // TODO: reproduces Axion's `pbx_admin || pbx_axiontech` gate on the Select/Text toggle
  // (ToggleSelectInputCallCenter) — no confirmed equivalent backend permission exists yet, so
  // this reuses the module's own highest-privilege tier as a placeholder. Replace with a real
  // permission check once the backend contract for this exact Axion behavior is confirmed.
  const { canManageAll } = useCallCenterPermissions();
  const { token } = theme.useToken();

  return (
    <Card title="Queue Details">
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_name"
            label="Queue Name"
            tooltip="Enter the queue name"
            validateFirst
            rules={[nameRequiredRule, nameFormatRule, noEdgeWhitespaceRule]}
          >
            <Input placeholder="Enter queue name" aria-label="Queue name" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_extension"
            label="Extension"
            tooltip={`Must be between ${hive.extensionRangeStart} and ${hive.extensionRangeEnd}`}
            extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
            validateFirst
            rules={extensionRangeRule(hive)}
          >
            <Input type={'number'} min={2000 } max={2999} placeholder="Enter extension" disabled={mode === "edit" && disabled} aria-label="Extension" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_greeting"
            label="Greeting"
            tooltip="Select the desired greeting"
            rules={[noEdgeWhitespaceRule]}
          >
            <ToggleSelectInput
              options={greetingOptions}
              placeholder="Select or enter greeting"
              loading={optionsLoading}
              disabled={disabled}
              canToggle={canManageAll}
              allowClear
              aria-label="Greeting"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_strategy"
            label="Strategy"
            tooltip="Select the queue ring strategy"
            rules={[requiredSelectRule("Strategy is required")]}
          >
            <Select placeholder="Select strategy" options={queueStrategyOptions} aria-label="Strategy" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_moh_sound"
            label="Music On Hold"
            tooltip="Select the desired hold music"
            rules={[requiredSelectRule("Music on hold is required")]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select music on hold"
              options={musicOnHoldOptions}
              loading={optionsLoading}
              aria-label="Music on hold"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_distinctive_ring"
            label="Distinctive Ring"
            tooltip="Enter the sound for a distinctive ring."
            rules={[noEdgeWhitespaceRule]}
          >
            <Input placeholder="Enter distinctive ring" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_time_base_score"
            label="Time Base Score"
            tooltip="Select the time base score"
            rules={[requiredSelectRule("Time base score is required")]}
          >
            <Select placeholder="Select time base score" options={timeBaseScoreOptions} aria-label="Time base score" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_max_wait_time"
            label="Max Wait Time"
            tooltip="Enter the max wait time"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter max wait time (seconds)" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_tier_rule_wait_second"
            label="Tier Rule Wait Second"
            tooltip="Enter the tier rule wait seconds"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter tier rule wait (seconds)" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_cid_prefix"
            label="Caller ID Name Prefix"
            tooltip="Set a prefix on the caller ID name"
            rules={[noEdgeWhitespaceRule]}
          >
            <Input placeholder="Enter caller ID name prefix" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_discard_abandoned_after"
            label="Discard Abandoned After"
            tooltip="Set the discard abandoned after seconds"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter discard-abandoned-after (seconds)" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_time_base_score_sec"
            label="Time Base Score Seconds"
            tooltip="Set the time base score in seconds. Higher numbers mean higher priority over other call centers"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter time base score seconds" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_max_wait_time_with_no_agent"
            label="Max Wait Time With No Agent"
            tooltip="Enter the max wait time with no agent"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter max wait time with no agent (seconds)" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_max_wait_time_with_no_agent_time_reached"
            label="Max Wait Time With No Agent Time Reached"
            tooltip="Enter the max wait time with no agent time reached"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter time-reached wait (seconds)" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_announce_frequency"
            label="Announce Frequency"
            tooltip="How often should we play the announce sound. Enter a number in seconds"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={'number'} min={0} placeholder="Enter announce frequency (seconds)" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_cc_exit_keys"
            label="Exit Key"
            tooltip="Keys to quit the current queue waiting"
            rules={[noEdgeWhitespaceRule]}
          >
            <Input placeholder="Enter exit key" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_outbound_caller_id_name"
            label="Outbound Caller ID Name"
            tooltip="Enter the external (public) caller ID name here"
            rules={[noEdgeWhitespaceRule]}
          >
            <Input placeholder="Enter outbound caller ID name" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_outbound_caller_id_number"
            label="Outbound Caller ID Number"
            tooltip="Enter the external (public) caller ID number here"
            rules={[numericUpTo20DigitsRule]}
          >
            <Input type={"number"} min={0} placeholder="Enter outbound caller ID number" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="domain_name"
            label="Domain"
            tooltip="Set the domain"
            rules={[
              {
                required: true,
                message: "Domain is required",
              },
            ]}
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
            name="queue_timeout_action"
            label="Timeout Destination"
            tooltip="Set the action to perform when the max wait time is reached"
            rules={[noEdgeWhitespaceRule]}
          >
            <ToggleSelectInput
              options={timeoutActionOptions}
              placeholder="Select or enter timeout destination"
              loading={optionsLoading}
              disabled={disabled}
              canToggle={canManageAll}
              allowClear
              aria-label="Timeout destination"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="queue_announce_sound"
            label="Announce Sound"
            tooltip="A sound to play to a caller every announce sound seconds. Needs the full path to the wav file"
            rules={[noEdgeWhitespaceRule]}
          >
            <ToggleSelectInput
              options={announceOptions}
              placeholder="Select or enter announce sound"
              loading={optionsLoading}
              disabled={disabled}
              canToggle={canManageAll}
              allowClear
              aria-label="Announce sound"
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={16}>
          <Form.Item
            name="queue_description"
            label="Description"
            tooltip="Enter the description"
            rules={descriptionRules}
          >
            <TextArea rows={2} placeholder="Enter description" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default CallCenterBasicSection;
