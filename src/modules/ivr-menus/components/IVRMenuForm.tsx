import { useEffect, useRef } from "react";
import { Alert, App, Button, Card, Col, Form, Input, Row, Select, Space, Switch, theme, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ToggleSelectInput from "../../../components/common/ToggleSelectInput";
import { domainChangeMessage } from "../../../components/common/domainChangeMessage";
import IVRMenuOptions from "./IVRMenuOptions";
import IVRMenuAdvancedSection from "./IVRMenuAdvancedSection";
import { domainScopedResetValues, extensionReuseNote, languageOptions } from "../ivr-menu.constants";
import {
  contextRules,
  describeExtensionRange,
  domainRules,
  extensionRules,
  extensionUnavailableRules,
  greetLongRules,
  nameRules,
  noEdgeWhitespaceRule,
  timeoutRules,
} from "../ivr-menu.validation";
import type { IVRMenuFormOptions, IVRMenuFormValues, IVRMenuHiveDetails } from "../ivr-menu.types";

const { TextArea } = Input;

export interface IVRMenuFormProps {
  mode: "create" | "edit";
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string;
  initialValues: Partial<IVRMenuFormValues>;
  /** Last loaded bootstrap — the source of the Domain select's options. */
  hive: IVRMenuHiveDetails;
  /**
   * Extension range + autoExt for the SELECTED domain, or null while it is loading or after its
   * request failed. Never another domain's: the extension can't validate (or save) until it's set.
   */
  extensionConfig: IVRMenuHiveDetails | null;
  /** The selected domain's bootstrap failed — shown with Retry. */
  extensionConfigError?: boolean;
  onRetryExtensionConfig?: () => void;
  /** The six domain-scoped option lists (useIVRMenuOptions). */
  options: IVRMenuFormOptions;
  optionsLoading: boolean;
  /** Options failed to load — shown as a non-blocking notice with Retry; the form stays usable. */
  optionsError: boolean;
  onRetryOptions: () => void;
  /** False for view-only users — the whole form is read-only. */
  canManage: boolean;
  /** Axion hides the Advanced card entirely for users without add/edit rights (§9/§25). */
  showAdvanced: boolean;
  submitting: boolean;
  onSubmit: (values: IVRMenuFormValues) => void;
  /** Create mode: a domain change was confirmed — the page reloads that domain's bootstrap and options. */
  onDomainConfirmed?: (domainName: string) => void;
}

const colProps = { xs: 24, sm: 12, lg: 8 };

/**
 * The single Add/Edit form for IVR Menus (ivr-menus.md §8). Pages own loading, service calls and
 * navigation; this owns the fields, layout, validation, the Options field array, the Advanced
 * section and the domain dependency.
 *
 * - Context is display-only and always mirrors the domain (§26).
 * - Domain: selectable on Add behind the shared domain-change confirmation; confirming resets every
 *   domain-scoped value, re-suggests the new domain's extension, and the page reloads that domain's
 *   bootstrap + six option lists (§9). Locked on Edit — an IVR can't move between domains (§15).
 * - Greet Long/Short, Exit Action, Invalid Sound and each Option's Destination are select-or-type
 *   permission gate on the toggle here, so any user who can edit may use it.
 */
const IVRMenuForm = ({
  mode,
  formId,
  initialValues,
  hive,
  extensionConfig,
  extensionConfigError = false,
  onRetryExtensionConfig,
  options,
  optionsLoading,
  optionsError,
  onRetryOptions,
  canManage,
  showAdvanced,
  submitting,
  onSubmit,
  onDomainConfirmed,
}: IVRMenuFormProps) => {
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [form] = Form.useForm<IVRMenuFormValues>();
  const currentDomainRef = useRef(initialValues.domain_name);
  const appliedConfigRef = useRef(extensionConfig);
  const disabled = submitting || !canManage;

  // Create mode: once the page loads a newly confirmed domain's bootstrap, apply its suggested
  // extension and drop any "not loaded" error. The mount-time config is already in initialValues.
  useEffect(() => {
    if (mode !== "create" || !extensionConfig || extensionConfig === appliedConfigRef.current) return;
    appliedConfigRef.current = extensionConfig;
    form.setFields([{ name: "ivr_menu_extension", value: extensionConfig.autoExt, errors: [] }]);
  }, [mode, extensionConfig, form]);

  const extensionFieldRules = extensionConfig
    ? extensionRules(extensionConfig)
    : extensionUnavailableRules(
        extensionConfigError
          ? "The extension settings for this domain couldn't be loaded. Retry before saving."
          : "The extension settings for this domain are still loading.",
      );

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
        const rows = form.getFieldValue("options") as IVRMenuFormValues["options"] | undefined;
        form.setFieldsValue({
          ...domainScopedResetValues,
          domain_name: value,
          ivr_menu_context: value,
          ivr_menu_extension: "",
          // Destinations are domain-scoped; the rest of each row is kept.
          options: (rows ?? []).map((row) => ({ ...row, destination: "" })),
        });
        onDomainConfirmed?.(value);
      },
      onCancel: () => form.setFieldsValue({ domain_name: previousDomain }),
    });
  };

  const switchWithHelp = (name: "ivr_menu_direct_dial" | "ivr_menu_enabled", label: string, help: string) => (
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
    <Form<IVRMenuFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      // A hidden Advanced card unregisters its fields; keep their loaded/default values in the payload.
      onFinish={(values) => onSubmit({ ...initialValues, ...values })}
      disabled={disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        {optionsError && (
          <Alert
            type="warning"
            showIcon
            message="Some data couldn't be loaded"
            description="The destination, greeting, exit action, parent menu, sound or ring back options for this domain failed to load."
            action={
              <Button size="small" onClick={onRetryOptions} disabled={false}>
                Retry
              </Button>
            }
          />
        )}

        {extensionConfigError && (
          <Alert
            type="warning"
            showIcon
            message="Extension settings couldn't be loaded"
            description="The extension range for the selected domain failed to load, so the extension can't be validated or saved yet."
            action={
              <Button size="small" onClick={onRetryExtensionConfig} disabled={false}>
                Retry
              </Button>
            }
          />
        )}

        <Card title="IVR Menu">
          <Row gutter={[16, 0]}>
            <Col {...colProps}>
              <Form.Item name="ivr_menu_name" label="Name" tooltip="Enter the name" validateFirst rules={nameRules}>
                <Input placeholder="Enter name" aria-label="IVR menu name" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_extension"
                label="Extension"
                tooltip={
                  extensionConfig
                    ? `Must be ${describeExtensionRange(extensionConfig)}`
                    : "Extension range for this domain is not loaded"
                }
                extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
                validateFirst
                rules={extensionFieldRules}
              >
                <Input type={"number"} placeholder="Enter extension" aria-label="Extension" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_parent_uuid"
                label="Parent Menu"
                tooltip="Optionally nest this IVR under another IVR menu"
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="Select parent menu"
                  loading={optionsLoading}
                  options={options.parentMenuOptions}
                  aria-label="Parent menu"
                />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item name="ivr_menu_language" label="Language" tooltip="Select the language">
                <Select allowClear placeholder="Select language" options={languageOptions} aria-label="Language" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_greet_long"
                label="Greet Long"
                tooltip="The long greeting played when entering the menu"
                validateFirst
                rules={greetLongRules}
              >
                <ToggleSelectInput
                  options={options.greetOptions}
                  placeholder="Select greet long"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle
                  aria-label="Greet long"
                />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_greet_short"
                label="Greet Short"
                tooltip="The short greeting played when returning to the menu"
                rules={[noEdgeWhitespaceRule]}
              >
                <ToggleSelectInput
                  options={options.greetOptions}
                  placeholder="Select greet short"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle
                  allowClear
                  aria-label="Greet short"
                />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_timeout"
                label="Timeout"
                tooltip="Milliseconds to wait after the greeting"
                validateFirst
                rules={timeoutRules}
              >
                <Input type={"number"} maxLength={5} placeholder="Enter timeout" aria-label="Timeout" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="exit_action"
                label="Exit Action"
                tooltip="Action to take when the IVR exits"
                rules={[noEdgeWhitespaceRule]}
              >
                <ToggleSelectInput
                  options={options.exitActionOptions}
                  placeholder="Select exit action"
                  loading={optionsLoading}
                  disabled={disabled}
                  canToggle
                  allowClear
                  aria-label="Exit action"
                />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_ringback"
                label="Ring Back"
                tooltip="What the caller hears while the destination is being called"
              >
                {/* Axion's `SelectWithTag` (§8): pick a listed ring back or type any value, e.g. `tone_stream://…`. */}
                <Select
                  showSearch
                  options={options.ringbackOptions}
                  placeholder="Select or type ring back"
                  loading={optionsLoading}
                  disabled={disabled}
                  aria-label="Ring back"
                />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_cid_prefix"
                label="Caller ID Name Prefix"
                tooltip="Prefix added to the caller ID name"
                rules={[noEdgeWhitespaceRule]}
              >
                <Input placeholder="Enter caller ID name prefix" aria-label="Caller ID name prefix" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
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
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_context"
                label="Context"
                tooltip="Follows the selected domain"
                rules={contextRules}
              >
                <Input disabled aria-label="Context" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="ivr_menu_description"
                label="Description"
                tooltip="Enter the description"
                rules={[noEdgeWhitespaceRule]}
              >
                <TextArea rows={3} placeholder="Enter description" aria-label="Description" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item label=" " colon={false}>
                <Row gutter={[16, 8]}>
                  <Col xs={24} md={12}>
                    {switchWithHelp(
                      "ivr_menu_direct_dial",
                      "Direct Dial",
                      "Define whether callers can dial directly to registered extensions.",
                    )}
                  </Col>
                  <Col xs={24} md={12}>
                    {switchWithHelp("ivr_menu_enabled", "Enabled", "Set the status of this IVR Menu.  ")}
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <IVRMenuOptions
          destinationOptions={options.destinationOptions}
          optionsLoading={optionsLoading}
          disabled={disabled}
        />

        {showAdvanced && (
          <IVRMenuAdvancedSection
            soundOptions={options.soundOptions}
            optionsLoading={optionsLoading}
            disabled={disabled}
          />
        )}
      </Space>
    </Form>
  );
};

export default IVRMenuForm;
