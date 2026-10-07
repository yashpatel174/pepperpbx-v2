import { useEffect, useRef } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Select, Space, Switch, theme, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";
import { domainChangeMessage } from "../../../components/common/domainChangeMessage";
import { extensionReuseNote, toFeatureCode } from "../call-flows.constants";
import {
  alternateDestinationRules,
  alternateLabelRules,
  destinationLabelRules,
  destinationRules,
  domainRules,
  extensionRules,
  featureCodeRules,
  nameRules,
  noEdgeWhitespaceRule,
  pinRules,
} from "../call-flows.validation";
import type {
  CallFlowDestinationOption,
  CallFlowFormValues,
  CallFlowHiveDetails,
  CallFlowSoundOption,
} from "../call-flows.types";

const { TextArea } = Input;

export interface CallFlowFormProps {
  mode: "create" | "edit";
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string;
  initialValues: Partial<CallFlowFormValues>;
  /** Bootstrap for the form's domain: domain options + extension range. */
  hive: CallFlowHiveDetails;
  destinationOptions: CallFlowDestinationOption[];
  soundOptions: CallFlowSoundOption[];
  optionsLoading: boolean;
  /** Options failed to load — shown as a non-blocking notice with Retry; the form stays usable. */
  optionsError: boolean;
  onRetryOptions: () => void;
  /** False for view-only users — the whole form is read-only. */
  canManage: boolean;
  /**
   * Axion lets tech admins (`pbx_admin`/`pbx_axiontech`) type a raw destination/sound value
   * (§8/§25). TODO: placeholder wired to the module-admin tier, as Call Center does, until a real
   * permission exists.
   */
  canUseCustomValues: boolean;
  submitting: boolean;
  onSubmit: (values: CallFlowFormValues) => void;
  /** Create mode: a domain change was confirmed — the page reloads that domain's bootstrap and options. */
  onDomainConfirmed?: (domainName: string) => void;
}

/** The destination + sound fields cleared on a domain change — their values are domain-scoped (§9). */
const domainScopedFields: Partial<CallFlowFormValues> = {
  call_flow_data: undefined,
  call_flow_sound: undefined,
  call_flow_alternate_data: undefined,
  call_flow_alternate_sound: undefined,
};

/**
 * The single Add/Edit form for Call Flows (call-flows.md §8). Pages own loading, service calls and
 * navigation; this owns fields, layout, validation, the feature-code rule and the domain change.
 *
 * - Feature Code is generated from the Extension (`flow+*<ext>`, §26) and read-only.
 * - Context isn't a field: the service sets it to the domain (§15).
 * - Domain: selectable on Add behind a confirm dialog (shared `domainChangeMessage`); confirming
 *   clears the domain-scoped destination/sound values and re-suggests the new domain's extension.
 *   Locked on Edit — a call flow can't move between domains.
 */
const CallFlowForm = ({
  mode,
  formId,
  initialValues,
  hive,
  destinationOptions,
  soundOptions,
  optionsLoading,
  optionsError,
  onRetryOptions,
  canManage,
  canUseCustomValues,
  submitting,
  onSubmit,
  onDomainConfirmed,
}: CallFlowFormProps) => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm<CallFlowFormValues>();
  const currentDomainRef = useRef(initialValues.domain_name);
  const appliedHiveRef = useRef(hive);
  const disabled = submitting || !canManage;

  // Create mode: once the page loads a newly confirmed domain's bootstrap, apply its suggested
  // extension (and so the feature code). The mount-time hive is already in initialValues.
  useEffect(() => {
    if (mode !== "create" || hive === appliedHiveRef.current) return;
    appliedHiveRef.current = hive;
    form.setFieldsValue({ call_flow_extension: hive.autoExt, call_flow_feature_code: toFeatureCode(hive.autoExt) });
  }, [mode, hive, form]);

  const handleValuesChange = (changed: Partial<CallFlowFormValues>) => {
    if ("call_flow_extension" in changed) {
      form.setFieldsValue({ call_flow_feature_code: toFeatureCode(changed.call_flow_extension) });
    }
  };

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
        form.setFieldsValue({
          ...domainScopedFields,
          domain_name: value,
          call_flow_extension: "",
          call_flow_feature_code: "",
        });
        onDomainConfirmed?.(value);
      },
      onCancel: () => form.setFieldsValue({ domain_name: previousDomain }),
    });
  };

  const switchWithHelp = (name: "call_flow_enabled" | "call_flow_status", label: string, help: string) => (
    <Space align="center" size={8} style={{ whiteSpace: "nowrap" }}>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch aria-label={label} />
      </Form.Item>

      <span style={{ whiteSpace: "nowrap" }}>{label}</span>

      <Tooltip title={help}>
        <QuestionCircleOutlined
          aria-label={`${label} help`}
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
            cursor: "help",
          }}
        />
      </Tooltip>
    </Space>
  );

  const destinationSection = (kind: "normal" | "alternate") => {
    const normal = kind === "normal";
    return (
      <Card title={normal ? "Normal Destination" : "Alternate Destination"}>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name={normal ? "call_flow_data" : "call_flow_alternate_data"}
              label="Destination"
              validateFirst
              rules={normal ? destinationRules : alternateDestinationRules}
            >
              <ToggleSelectInput
                options={destinationOptions}
                placeholder="Select destination"
                loading={optionsLoading}
                disabled={disabled}
                canToggle={canUseCustomValues}
                aria-label={normal ? "Destination" : "Alternate destination"}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name={normal ? "call_flow_label" : "call_flow_alternate_label"}
              label={normal ? "Destination Label" : "Alternate Label"}
              tooltip={normal ? "Enter the destination label" : "Enter the  alternate destination label"}
              validateFirst
              rules={normal ? destinationLabelRules : alternateLabelRules}
            >
              <Input placeholder="Enter label" aria-label={normal ? "Destination label" : "Alternate label"} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name={normal ? "call_flow_sound" : "call_flow_alternate_sound"}
              label={normal ? "Sound" : "Alternate Sound"}
              tooltip={
                normal
                  ? "Select the sound to play when the status is set to the destination"
                  : "Select the sound to play when the status is set to the alternate destination"
              }
              rules={[noEdgeWhitespaceRule]}
            >
              <ToggleSelectInput
                options={soundOptions}
                placeholder="Select sound"
                loading={optionsLoading}
                disabled={disabled}
                canToggle={canUseCustomValues}
                allowClear
                aria-label={normal ? "Sound" : "Alternate sound"}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <Form<CallFlowFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      onValuesChange={handleValuesChange}
      disabled={disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Card>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="call_flow_name" label="Name" tooltip="Enter the name" validateFirst rules={nameRules}>
                <Input placeholder="Enter name" aria-label="Call flow name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="call_flow_extension"
                label="Extension"
                extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
                validateFirst
                rules={extensionRules(hive)}
              >
                <Input type={"number"} placeholder="Enter extension" aria-label="Extension" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="call_flow_feature_code"
                label="Feature Code"
                tooltip="Enter the feature code"
                rules={featureCodeRules}
              >
                <Input placeholder="Enter feature code" aria-label="Feature code" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="call_flow_pin_number" label="PIN Number" tooltip="Enter the PIN number" rules={pinRules}>
                <Input type={"number"} maxLength={20} placeholder="Enter PIN number" aria-label="PIN number" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="domain_name" label="Domain" tooltip="Select the domain" rules={domainRules}>
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
                name="call_flow_description"
                label="Description"
                tooltip="Enter the description"
                rules={[noEdgeWhitespaceRule]}
              >
                <TextArea rows={4} placeholder="Enter description" aria-label="Description" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item label=" " colon={false}>
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={24} md={12}>
                    {switchWithHelp("call_flow_enabled", "Enabled", "Select the status.")}
                  </Col>

                  <Col xs={24} sm={24} md={12}>
                    {switchWithHelp("call_flow_status", "Enable Feature Code", "Select the status.")}
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
            description="The destination and sound options for this domain failed to load."
            action={
              <Button size="small" onClick={onRetryOptions} disabled={false}>
                Retry
              </Button>
            }
          />
        )}

        {destinationSection("normal")}
        {destinationSection("alternate")}
      </Space>
    </Form>
  );
};

export default CallFlowForm;
