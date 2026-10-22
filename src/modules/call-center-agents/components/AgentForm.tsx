import { useMemo, useRef } from "react";
import { App, Card, Col, Form, Input, Row, Select, Switch } from "antd";
import {
  contactRequiredRule,
  nameFormatRule,
  nameRequiredRule,
  noEdgeWhitespaceRule,
  noWhitespaceRule,
  numericUpTo20DigitsRule,
  numericUpTo3DigitsRule,
} from "../call-center-agents.validation";
import { agentStatusOptions } from "../call-center-agents.constants";
import { domainChangeMessage, domainChangeTitle } from "../../../components/common/domainChangeMessage";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";
import type { CallCenterAgentFormValues, HiveCallCenterAgentDetails, SelectOption } from "../call-center-agents.types";

const { Password } = Input;

export interface AgentFormProps {
  mode: "create" | "edit";
  /** The page owns loading — AgentForm only ever mounts once real values are ready. */
  initialValues: CallCenterAgentFormValues;
  hive: HiveCallCenterAgentDetails;
  contactOptions: SelectOption[];
  /** True while domain-dependent options (Contact) are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean;
  canManage: boolean;
  submitting: boolean;
  /** Called once the domain-change notice is dismissed, so the page can re-fetch Contact options
   * for the new domain (call-center.md §13/§15). */
  onDomainConfirmed?: (domainName: string) => void;
  onSubmit: (values: CallCenterAgentFormValues) => void;
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets this id
   * via `htmlType="submit"` + `form={formId}`, matching every other module in this codebase. */
  formId: string;
}

/**
 * Shared by AddCallCenterAgentPage and EditCallCenterAgentPage.
 * Owns fields, layout, tooltips, domain-change handling, and validation.
 */
const AgentForm = ({
  mode,
  initialValues,
  hive,
  contactOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: AgentFormProps) => {
  const [form] = Form.useForm<CallCenterAgentFormValues>();
  const { modal } = App.useApp();
  const currentDomainRef = useRef(initialValues.domain_name);

  const watchedContact = Form.useWatch("agent_contact", form);

  // Edit can load a record whose agent_contact isn't present in the currently fetched
  // contactOptions (e.g. the domain's contact list changed since this agent was saved). Kept here
  // even though ToggleSelectInput computes an equivalent "Other"-group fallback internally from
  // its own `value` prop — this predates the switch to ToggleSelectInput and is left in place
  // rather than removed, so `options` never depends on the component's internal fallback alone.
  const contactSelectOptions = useMemo(() => {
    if (!watchedContact) return contactOptions;
    const alreadyPresent = contactOptions.some((option) => option.value === watchedContact);
    if (alreadyPresent) return contactOptions;
    return [...contactOptions, { label: "Other", options: [{ label: watchedContact, value: watchedContact }] }];
  }, [contactOptions, watchedContact]);

  const handleDomainChange = (value: string) => {
    const previousDomain = currentDomainRef.current;

    if (value === previousDomain) {
      return;
    }

    // Ant Design's Form.Item already updated the Select's displayed value to `value` the moment
    // onChange fired (it composes onto the child's own onChange rather than replacing it), so a
    // dismissal here (Escape/backdrop, not just an explicit Cancel button) must actively restore
    // the previous domain — otherwise the field would visually show the new domain while Contact
    // options/currentDomainRef stay scoped to the old one. modal.confirm (not modal.info) is used
    // specifically so a Cancel path exists to do that restoration.
    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        currentDomainRef.current = value;

        form.setFieldsValue({
          domain_name: value,
          agent_contact: undefined,
        });

        onDomainConfirmed?.(value);
      },
      onCancel: () => {
        form.setFieldsValue({
          domain_name: previousDomain,
        });
      },
    });
  };

  const disabled = !canManage;

  return (
    <Form<CallCenterAgentFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <Card>
        <Row gutter={[16, 16]}>
          {/* Agent Name */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_name"
              label="Agent Name"
              tooltip="Select the agent name"
              validateFirst
              rules={[nameRequiredRule, nameFormatRule, noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter agent name" aria-label="Agent name" />
            </Form.Item>
          </Col>

          {/* Agent Type */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="agent_type" label="Type" tooltip="Enter the agent type" rules={[noEdgeWhitespaceRule]}>
              <Input placeholder="Enter type" aria-label="Agent type" />
            </Form.Item>
          </Col>

          {/* Call Timeout */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_call_timeout"
              label="Call Timeout"
              tooltip="Enter the call timeout"
              rules={[numericUpTo3DigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter call timeout" aria-label="Call timeout" />
            </Form.Item>
          </Col>

          {/* Agent ID */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="agent_id" label="Agent ID" tooltip="Enter the agent ID" rules={[numericUpTo20DigitsRule]}>
              <Input placeholder="Enter agent id" aria-label="Agent ID" />
            </Form.Item>
          </Col>

          {/* Agent Password */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_password"
              label="Agent Password"
              tooltip="Enter the agent password"
              rules={[noWhitespaceRule]}
            >
              <Password placeholder="Enter agent password" maxLength={30} aria-label="Agent password" />
            </Form.Item>
          </Col>

          {/* Status */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="agent_status" label="Status" tooltip="Select the default agent status">
              <Select allowClear placeholder="Select status" options={agentStatusOptions} aria-label="Status" />
            </Form.Item>
          </Col>

          {/* No Answer Delay Time */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_no_answer_delay_time"
              label="No Answer Delay Time"
              tooltip="Enter the agent no answer delay time in seconds"
              rules={[numericUpTo20DigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter no answer delay time" aria-label="No answer delay time" />
            </Form.Item>
          </Col>

          {/* Max No Answer */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_max_no_answer"
              label="Max No Answer"
              tooltip="At max no answer, the agent's status will change to 'On Break'"
              rules={[numericUpTo20DigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter max no answer" aria-label="Max no answer" />
            </Form.Item>
          </Col>

          {/* Wrap Up Time */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_wrap_up_time"
              label="Wrap Up Time"
              tooltip="Enter the wrap up time"
              rules={[numericUpTo20DigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter wrap up time" aria-label="Wrap up time" />
            </Form.Item>
          </Col>

          {/* Reject Delay Time */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_reject_delay_time"
              label="Reject Delay Time"
              tooltip="Enter the reject delay time"
              rules={[numericUpTo20DigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter reject delay time" aria-label="Reject delay time" />
            </Form.Item>
          </Col>

          {/* Busy Delay Time */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_busy_delay_time"
              label="Busy Delay Time"
              tooltip="Enter the agent busy delay time"
              rules={[numericUpTo20DigitsRule]}
            >
              <Input type={'number'} min={0} placeholder="Enter the agent busy delay time" aria-label="Busy delay time" />
            </Form.Item>
          </Col>

          {/* Domain */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="domain_name"
              label="Domain"
              tooltip="Select domain"
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
                onChange={handleDomainChange}
                options={hive.domainOptions.map((domain) => ({
                  label: domain,
                  value: domain,
                }))}
                aria-label="Domain"
              />
            </Form.Item>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="agent_contact"
              label="Contact"
              tooltip="Select the contact number"
              validateFirst
              rules={[contactRequiredRule, noEdgeWhitespaceRule]}
            >
              <ToggleSelectInput
                options={contactSelectOptions}
                placeholder="Select or enter contact"
                loading={optionsLoading}
                disabled={disabled}
                canToggle={canManage}
                aria-label="Contact"
              />
            </Form.Item>
          </Col>

          {/* Record */}
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="agent_record" label="Record" tooltip="Save the recording" valuePropName="checked">
              <Switch disabled={disabled} aria-label="Record" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default AgentForm;
