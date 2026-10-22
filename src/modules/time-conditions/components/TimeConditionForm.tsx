import { useEffect, useRef } from "react";
import { App, Card, Col, Form, Input, Row, Select, Space, theme } from "antd";
import ErrorState from "../../../components/feedback/ErrorState";
import FormSwitchField from "../../../components/common/FormSwitchField";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";
import { domainChangeMessage, domainChangeTitle } from "../../../components/common/domainChangeMessage";
import { extensionReuseNote } from "../time-condition.constants";
import {
  domainRules,
  extensionRules,
  nameRules,
  timeGroupRules,
  timeMatchActionRules,
  timeNotMatchActionRules,
} from "../time-condition.validation";
import type {
  TimeConditionDestinationOption,
  TimeConditionFormValues,
  TimeConditionHiveDetails,
  TimeGroupOption,
} from "../time-condition.types";

export interface TimeConditionFormProps {
  mode: "create" | "edit";
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string;
  initialValues: Partial<TimeConditionFormValues>;
  /** Bootstrap for the form's domain: domain options + extension range. */
  hive: TimeConditionHiveDetails;
  timeGroupOptions: TimeGroupOption[];
  destinationOptions: TimeConditionDestinationOption[];
  optionsLoading: boolean;
  /** Options failed to load — shown as a non-blocking notice with Retry; the form stays usable. */
  optionsError: boolean;
  onRetryOptions: () => void;
  /** False for view-only users — the whole form is read-only. */
  canManage: boolean;
  /**
   * Axion lets tech admins (`pbx_admin`/`pbx_axiontech`) type a raw destination (§9/§14/§25).
   * TODO: placeholder wired to the module-admin tier, as sibling modules do, until a real
   * permission exists.
   */
  canUseCustomValues: boolean;
  submitting: boolean;
  onSubmit: (values: TimeConditionFormValues) => void;
  /** Create mode: a domain change was confirmed — the page reloads that domain's bootstrap and options. */
  onDomainConfirmed?: (domainName: string) => void;
}

/**
 * The single Add/Edit form for Time Conditions (time-conditions.md §8). Pages own loading, service
 * calls and navigation; this owns fields, layout, validation and the domain change.
 *
 * - Axion's commented-out "Presets" field (`time_condition_preset_uuid`, §8/§28) is dead code and
 *   not ported; the preset binding is the Time Groups select alone.
 * - Domain: selectable on Add behind a confirm dialog (shared `domainChangeMessage`). Confirming
 *   resets the form to its defaults for the new domain, as Axion's `methods.reset()` + `closeModal`
 *   do (§3 step 6) — the page then reloads the domain's extension suggestion and options. Locked on
 *   Edit — a time condition can't move between domains (§15).
 */
const TimeConditionForm = ({
  mode,
  formId,
  initialValues,
  hive,
  timeGroupOptions,
  destinationOptions,
  optionsLoading,
  optionsError,
  onRetryOptions,
  canManage,
  canUseCustomValues,
  submitting,
  onSubmit,
  onDomainConfirmed,
}: TimeConditionFormProps) => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm<TimeConditionFormValues>();
  const currentDomainRef = useRef(initialValues.domain_name);
  const appliedHiveRef = useRef(hive);
  const disabled = submitting || !canManage;

  // Create mode: once the page loads a newly confirmed domain's bootstrap, apply its suggested
  // extension. The mount-time hive is already in initialValues.
  useEffect(() => {
    if (mode !== "create" || hive === appliedHiveRef.current) return;
    appliedHiveRef.current = hive;
    form.setFieldsValue({ time_condition_extension: hive.autoExt });
  }, [mode, hive, form]);

  const handleDomainChange = (value: string) => {
    const previousDomain = currentDomainRef.current;
    if (value === previousDomain) return;

    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        currentDomainRef.current = value;
        form.resetFields();
        form.setFieldsValue({
          domain_name: value,
          time_condition_name: "",
          time_condition_extension: "",
          time_condition_time_group_preset_uuid: undefined,
          time_match_action: undefined,
          time_not_match_action: undefined,
          enabled: true,
        });
        onDomainConfirmed?.(value);
      },
      onCancel: () => form.setFieldsValue({ domain_name: previousDomain }),
    });
  };

  return (
    <Form<TimeConditionFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        {optionsError && (
          <ErrorState
            type="warning"
            message="Some data couldn't be loaded"
            description="The time group and destination options for this domain failed to load."
            onRetry={onRetryOptions}
          />
        )}

        <Card>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="time_condition_name"
                label="Name"
                tooltip="Enter the name"
                validateFirst
                rules={nameRules}
              >
                <Input placeholder="Enter name" aria-label="Time condition name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="time_condition_extension"
                label="Extension"
                extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
                validateFirst
                rules={extensionRules(hive)}
              >
                <Input placeholder="Enter extension" type={'number'} aria-label="Extension" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="time_condition_time_group_preset_uuid"
                label="Time Groups"
                tooltip="Select the time group preset"
                rules={timeGroupRules}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select time group"
                  loading={optionsLoading}
                  options={timeGroupOptions}
                  aria-label="Time group"
                />
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
                name="time_match_action"
                label="Destination if time does match"
                tooltip="Select the actions"
                validateFirst
                rules={timeMatchActionRules}
              >
                <ToggleSelectInput
                  options={destinationOptions}
                  placeholder="Select destination"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle={canUseCustomValues}
                  aria-label="Destination if time does match"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="time_not_match_action"
                label="Destination if time does not match"
                tooltip="Select the actions"
                validateFirst
                rules={timeNotMatchActionRules}
              >
                <ToggleSelectInput
                  options={destinationOptions}
                  placeholder="Select destination"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle={canUseCustomValues}
                  aria-label="Destination if time does not match"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <FormSwitchField name="enabled" label="Enabled" tooltip="Set the status" style={{ minHeight: 32 }} />
            </Col>
          </Row>
        </Card>
      </Space>
    </Form>
  );
};

export default TimeConditionForm;
