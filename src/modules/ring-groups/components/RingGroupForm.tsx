import { useEffect, useMemo, useRef } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Select, Space, Switch, theme, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";
import { domainChangeMessage } from "../../../components/common/domainChangeMessage";
import {
  DEFAULT_RINGBACK,
  extensionReuseNote,
  forwardCidModeOptions,
  missedCallOptions,
  newDestinationRow,
  noneOption,
  RECORDINGS_GROUP_LABEL,
  strategyOptions,
} from "../ring-group.constants";
import {
  callTimeoutRules,
  domainRules,
  extensionRules,
  fixedCidValueRules,
  missedCallEmailRules,
  nameRules,
  noEdgeWhitespaceRule,
  number20Rules,
  strategyRules,
} from "../ring-group.validation";
import RingGroupDestinationsSection from "./RingGroupDestinationsSection";
import RingtoneSelect from "./RingtoneSelect";
import type {
  RingGroupDestination,
  RingGroupFormValues,
  RingGroupHiveDetails,
  RingGroupOption,
} from "../ring-group.types";

const { TextArea } = Input;

export interface RingGroupFormProps {
  mode: "create" | "edit";
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string;
  initialValues: Partial<RingGroupFormValues>;
  /** Bootstrap for the form's domain: domain options + extension range. */
  hive: RingGroupHiveDetails;
  destinationOptions: RingGroupOption[];
  timeoutDestinationOptions: RingGroupOption[];
  greetingOptions: RingGroupOption[];
  ringBackOptions: RingGroupOption[];
  optionsLoading: boolean;
  /** Options failed to load — shown as a non-blocking notice with Retry; the form stays usable. */
  optionsError: boolean;
  onRetryOptions: () => void;
  /** False for view-only users — the whole form is read-only. */
  canManage: boolean;
  /**
   * Greeting uses Axion's `ToggleSelectInputCallCenter`, whose pick-or-type toggle is limited to
   * tech admins (§8). TODO: placeholder wired to the module-admin tier, as sibling modules do,
   * until a real permission exists.
   */
  canUseCustomValues: boolean;
  submitting: boolean;
  onSubmit: (values: RingGroupFormValues) => void;
  /** Create mode: a domain change was confirmed — the page reloads that domain's bootstrap and options. */
  onDomainConfirmed?: (domainName: string) => void;
}

/**
 * The single Add/Edit form for Ring Groups (ring-groups.md §8). Pages own loading, service calls and
 * navigation; this owns fields, layout, validation, conditional fields and the domain change.
 *
 * - Missed Call Email appears, and is required, only while Missed Call is Email (§9).
 * - Fixed CID Value appears, and is required, only while the External CID mode is Fixed ID (§9/§34.3).
 * - Remote / Too Late Announce offer only the greeting options' Recordings group (§9/§34.1).
 * - Ring Back is select-or-type (Axion's `SelectWithTag`): pick a listed sound or enter any value.
 * - Domain (`ring_group_context`): selectable on Add behind the shared domain-change confirm;
 *   confirming clears the domain-scoped values and re-suggests the new domain's extension. Locked on
 *   Edit — a ring group can't move between domains (§15).
 */
const RingGroupForm = ({
  mode,
  formId,
  initialValues,
  hive,
  destinationOptions,
  timeoutDestinationOptions,
  greetingOptions,
  ringBackOptions,
  optionsLoading,
  optionsError,
  onRetryOptions,
  canManage,
  canUseCustomValues,
  submitting,
  onSubmit,
  onDomainConfirmed,
}: RingGroupFormProps) => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm<RingGroupFormValues>();
  const missedCallApp = Form.useWatch("ring_group_missed_call_app", form);
  const forwardCidMode = Form.useWatch("ring_group_forward_cid_mode", form);
  const greetingSelectOptions = useMemo(() => [noneOption, ...greetingOptions], [greetingOptions]);
  const recordingOptions = useMemo(
    () => [
      noneOption,
      ...greetingOptions.filter((option) => "options" in option && option.label === RECORDINGS_GROUP_LABEL),
    ],
    [greetingOptions],
  );
  const currentDomainRef = useRef(initialValues.ring_group_context);
  const appliedHiveRef = useRef(hive);
  const disabled = submitting || !canManage;

  // Create mode: once the page loads a newly confirmed domain's bootstrap, apply its suggested
  // extension. The mount-time hive is already in initialValues.
  useEffect(() => {
    if (mode !== "create" || hive === appliedHiveRef.current) return;
    appliedHiveRef.current = hive;
    form.setFieldsValue({ ring_group_extension: hive.autoExt });
  }, [mode, hive, form]);

  const handleDomainChange = (value: string) => {
    const previousDomain = currentDomainRef.current;
    if (value === previousDomain) return;

    modal.confirm({
      title: "Domain changed",
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        currentDomainRef.current = value;
        // Destinations, timeout destination, greeting (and the announces drawn from it) and ring back
        // are all domain-scoped (§9).
        const destinations =
          (form.getFieldValue("ring_group_destinations") as RingGroupDestination[] | undefined) ?? [];
        form.setFieldsValue({
          ring_group_context: value,
          ring_group_extension: "",
          ring_group_greeting: undefined,
          ring_group_remote_announce: undefined,
          ring_group_too_late_announce: undefined,
          ring_group_timeout_action: undefined,
          ring_group_ringback: DEFAULT_RINGBACK,
          ring_group_destinations: destinations.length
            ? destinations.map((row) => ({ ...row, destination_number: "" }))
            : [newDestinationRow()],
        });
        onDomainConfirmed?.(value);
      },
      onCancel: () => form.setFieldsValue({ ring_group_context: previousDomain }),
    });
  };

  const switchWithHelp = (
    name:
      | "ring_group_enabled"
      | "ring_group_call_forward_enabled"
      | "ring_group_follow_me_enabled"
      | "skip_busy_agent"
      | "enable_call_pickup"
      | "call_recording_enabled",
    label: string,
    help: string,
  ) => (
    <Space align="center" size={8} style={{ whiteSpace: "nowrap" }}>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch aria-label={label} />
      </Form.Item>
      <span>{label}</span>
      <Tooltip title={help}>
        <QuestionCircleOutlined
          aria-label={`${label} help`}
          style={{ color: token.colorTextTertiary, fontSize: 12, cursor: "help" }}
        />
      </Tooltip>
    </Space>
  );

  return (
    <Form<RingGroupFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="ring_group_name" label="Name" tooltip="Enter the name" validateFirst rules={nameRules}>
                <Input placeholder="Enter name" aria-label="Ring group name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_extension"
                label="Extension"
                extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
                validateFirst
                rules={extensionRules(hive)}
              >
                <Input type={'number'} placeholder="Enter extension" aria-label="Extension" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_greeting"
                label="Greeting"
                tooltip="Select the greeting"
                rules={[noEdgeWhitespaceRule]}
              >
                <ToggleSelectInput
                  options={greetingSelectOptions}
                  placeholder="Select greeting"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle={canUseCustomValues}
                  allowClear
                  aria-label="Greeting"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_strategy"
                label="Select Strategy"
                tooltip="Select the ring strategy"
                rules={strategyRules}
              >
                <Select placeholder="Select strategy" options={strategyOptions} aria-label="Strategy" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_call_timeout"
                label="Call Timeout"
                tooltip="Seconds to ring before the timeout destination"
                validateFirst
                rules={callTimeoutRules}
              >
                <Input type="number" min={0} placeholder="Enter call timeout" aria-label="Call timeout" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="caller_id_name"
                label="Caller ID Name"
                tooltip="Enter the caller ID name"
                rules={[noEdgeWhitespaceRule]}
              >
                <Input placeholder="Enter caller ID name" aria-label="Caller ID name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_caller_id_number"
                label="Caller ID Number"
                tooltip="Enter the caller ID number"
                rules={number20Rules}
              >
                <Input type="number" min={0} placeholder="Enter caller ID number" aria-label="Caller ID number" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_distinctive_ring"
                label="Ringtone (Alert Info)"
                tooltip="Select the Alert-Info value for a distinctive ring."
                extra={<span style={{ color: token.colorError }}>Note: alert_info will auto add in the dialplan.</span>}
                rules={[noEdgeWhitespaceRule]}
              >
                <RingtoneSelect
                  placeholder="Search or add custom"
                  disabled={disabled}
                  aria-label="Ringtone (Alert Info)"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_cid_prefix"
                label="Caller ID Name Prefix"
                tooltip="Enter the caller ID name prefix"
                rules={[noEdgeWhitespaceRule]}
              >
                <Input placeholder="Enter caller ID name prefix" aria-label="Caller ID name prefix" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_forward_cid_mode"
                label="Change External CID Configuration"
                tooltip="Select which caller ID is used when this ring group call is forwarded to an external destination."
              >
                <Select options={forwardCidModeOptions} aria-label="Change external CID configuration" />
              </Form.Item>
            </Col>

            {forwardCidMode === "fixed" && (
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="ring_group_forward_cid_value"
                  label="Fixed CID Value"
                  tooltip="Enter the caller ID number to use as the outbound caller ID."
                  validateFirst
                  rules={fixedCidValueRules}
                >
                  {/* Text, not type="number": the value may start with `+`. */}
                  <Input placeholder="Enter fixed cid value" aria-label="Fixed CID value" />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="ring_group_ringback" label="Ring Back" tooltip="Select a ring back sound">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={ringBackOptions}
                  placeholder="Select ring back"
                  aria-label="Ring back"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_remote_announce"
                label="Remote Announce"
                tooltip="Select the recording for remote announce."
              >
                <ToggleSelectInput
                  options={recordingOptions}
                  placeholder="Select remote announce"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle={canUseCustomValues}
                  aria-label="Remote announce"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_too_late_announce"
                label="Too Late Announce"
                tooltip="Select the recording for too late announce."
              >
                <ToggleSelectInput
                  options={recordingOptions}
                  placeholder="Select too late announce"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle={canUseCustomValues}
                  aria-label="Too late announce"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="ring_group_missed_call_app" label="Missed Call" tooltip="Notify when a call is missed">
                <Select
                  allowClear
                  placeholder="Select missed call"
                  options={missedCallOptions}
                  aria-label="Missed call"
                />
              </Form.Item>
            </Col>

            {missedCallApp === "email" && (
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="ring_group_missed_call_data"
                  label="Missed Call Email"
                  tooltip="Separate multiple emails with commas"
                  validateFirst
                  rules={missedCallEmailRules}
                >
                  <Input placeholder="name@example.com, other@example.com" aria-label="Missed call email" />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} sm={12} lg={8}>
              <Form.Item label="Ring Group Forward" tooltip="Forward all calls to this number while the switch is on">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Form.Item name="ring_group_forward_destination" noStyle rules={number20Rules}>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Enter forward number"
                      aria-label="Ring group forward number"
                      style={{ flex: 1 }}
                    />
                  </Form.Item>
                  <Form.Item name="ring_group_forward_enabled" valuePropName="checked" noStyle>
                    <Switch aria-label="Ring group forward enabled" />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_forward_toll_allow"
                label="Forward Toll Allow"
                tooltip="Enter the forward toll allow"
                rules={[noEdgeWhitespaceRule]}
              >
                <Input placeholder="Enter forward toll allow" aria-label="Forward toll allow" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="ring_group_context" label="Domain" tooltip="Select the domain" rules={domainRules}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select domain"
                  disabled={mode === "edit" || disabled}
                  onChange={handleDomainChange}
                  options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
                  aria-label="Domain"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="ring_group_description"
                label="Description"
                tooltip="Enter the description"
                rules={[noEdgeWhitespaceRule]}
              >
                <TextArea rows={3} placeholder="Enter description" aria-label="Description" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={16}>
              <Form.Item label=" " colon={false}>
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={12} xl={8}>
                    {switchWithHelp("ring_group_enabled", "Enabled", "Enable or disable this ring group.")}
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    {switchWithHelp(
                      "ring_group_call_forward_enabled",
                      "Call Forward",
                      "Allow call forward for this ring group.",
                    )}
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    {switchWithHelp(
                      "ring_group_follow_me_enabled",
                      "Follow Me",
                      "Allow follow me for this ring group.",
                    )}
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    {switchWithHelp("skip_busy_agent", "Skip Busy Agent", "Skip agents who are busy.")}
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    {switchWithHelp(
                      "enable_call_pickup",
                      "Enable Call Pickup",
                      "Enable call pickup for this ring group.",
                    )}
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    {switchWithHelp("call_recording_enabled", "Call Recording", "Select whether calls are recorded.")}
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {optionsError && (
          <Alert
            type="warning"
            showIcon
            message="Some data couldn't be loaded"
            description="The destination, greeting and ring back options for this domain failed to load."
            action={
              <Button size="small" onClick={onRetryOptions} disabled={false}>
                Retry
              </Button>
            }
          />
        )}

        <RingGroupDestinationsSection
          destinationOptions={destinationOptions}
          timeoutDestinationOptions={timeoutDestinationOptions}
          optionsLoading={optionsLoading}
          disabled={disabled}
          canUseCustomValues={canManage}
        />
      </Space>
    </Form>
  );
};

export default RingGroupForm;
