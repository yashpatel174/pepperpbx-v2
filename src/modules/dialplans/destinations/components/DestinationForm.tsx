import { useRef, useState } from "react";
import { App, Button, Card, Col, Form, Input, Row, Select } from "antd";
import { domainChangeMessage } from "../../../../components/common/domainChangeMessage";
import { isDestinationNumberTaken } from "../destination.service";
import { typeOptions } from "../destination.constants";
import type {
  ActionOptionGroup,
  DestinationFormValues,
  HiveDestinationDetails,
  HoldMusicGroup,
  SelectOption,
} from "../destination.types";
import {
  areaCodeRule,
  callerIdNumberRule,
  countryOrTrunkPrefixRule,
  destinationNumberRules,
  noEdgeWhitespaceRule,
} from "../destination.validation";
import DestinationUsage from "./DestinationUsage";
import DestinationOptions from "./DestinationOptions";

const { TextArea } = Input;

interface GroupedSelectOption {
  label: string;
  options: { label: string; value: string }[];
}

const withCurrentValueFallback = (groups: GroupedSelectOption[], currentValue?: string): GroupedSelectOption[] => {
  if (!currentValue) return groups;

  const exists = groups.some((group) => group.options.some((option) => option.value === currentValue));

  if (exists) return groups;

  return [
    ...groups,
    {
      label: "Other",
      options: [{ label: currentValue, value: currentValue }],
    },
  ];
};

export interface DestinationFormProps {
  mode: "create" | "edit";
  /** The page owns loading — DestinationForm only ever mounts once real values are ready. */
  initialValues: DestinationFormValues;
  /** Current record's uuid, so the duplicate-number check excludes itself in edit mode. */
  excludeUuid?: string;
  hive: HiveDestinationDetails;
  actionOptions: ActionOptionGroup[];
  faxOptions: SelectOption[];
  holdMusicOptions: HoldMusicGroup[];
  /** True while domain-dependent options are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean;
  canManage: boolean;
  submitting: boolean;
  /** Create mode only — called once the domain-change confirmation is accepted, so the page can
   * re-fetch domain-dependent options (hive/action/fax/hold-music) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void;
  onSubmit: (values: DestinationFormValues) => void;
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets
   * this id via htmlType="submit" + form={formId}, matching Extensions/Gateways. */
  formId: string;
}

/**
 * Shared by AddDestinationPage and EditDestinationPage. Owns fields, layout, the domain-change
 * confirmation, the destination_type conditional fields, and validation. Pages own data
 * loading, defaults, and the create/update service call.
 */
const DestinationForm = ({
  mode,
  initialValues,
  excludeUuid,
  hive,
  actionOptions,
  faxOptions,
  holdMusicOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: DestinationFormProps) => {
  const [form] = Form.useForm<DestinationFormValues>();
  const { modal } = App.useApp();
  const destinationType = Form.useWatch("destination_type", form);
  const currentDomainRef = useRef(initialValues.domain_name);

  const [showHoldMusicValue, setShowHoldMusicValue] = useState(false);
  const [showActionValue, setShowActionValue] = useState(false);
  const [showAlternateActionValue, setShowAlternateActionValue] = useState(false);

  const handleDomainChange = (value: string) => {
    if (mode !== "create" || value === currentDomainRef.current) {
      currentDomainRef.current = value;
      return;
    }

    modal.confirm({
      title: "Change domain?",
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        currentDomainRef.current = value;

        form.setFieldsValue({
          domain_name: value,
          destination_action: undefined,
          destination_alternate_action: undefined,
          fax_uuid: undefined,
          destination_hold_music: undefined,
        });

        setShowHoldMusicValue(false);
        setShowActionValue(false);
        setShowAlternateActionValue(false);

        onDomainConfirmed?.(value);
      },
      onCancel: () => {
        form.setFieldsValue({
          domain_name: currentDomainRef.current,
        });
      },
    });
  };

  const handleToggleHoldMusicValue = () => {
    const selectedValue = form.getFieldValue("destination_hold_music");

    if (!selectedValue) {
      return;
    }

    setShowHoldMusicValue((previous) => !previous);
  };

  const handleHoldMusicChange = (value: string) => {
    form.setFieldValue("destination_hold_music", value);

    // Whenever a new option is selected, start by showing its label.
    setShowHoldMusicValue(false);
  };

  const handleActionToggle = () => {
    const selectedValue = form.getFieldValue("destination_action");

    if (!selectedValue) {
      return;
    }

    setShowActionValue((previous) => !previous);
  };

  const handleActionChange = (value: string) => {
    form.setFieldValue("destination_action", value);

    // Whenever a new option is selected, start by showing its label.
    setShowActionValue(false);
  };

  const handleAlternateActionToggle = () => {
    const selectedValue = form.getFieldValue("destination_alternate_action");

    if (!selectedValue) {
      return;
    }

    setShowAlternateActionValue((previous) => !previous);
  };

  const handleAlternateActionChange = (value: string) => {
    form.setFieldValue("destination_alternate_action", value);

    // Whenever a new option is selected, start by showing its label.
    setShowAlternateActionValue(false);
  };

  // Grouped Select options (Music on Hold / Recordings / Streams, per group) — the displayed
  // text is each option's label, the stored form value is its value (e.g. the recording URL),
  // matching GET /api/destinations/list/holdMusic's group/option shape.
  const holdMusicSelectOptions = withCurrentValueFallback(
    holdMusicOptions.map((group) => ({
      label: group.label,
      options: group.options.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    })),
    initialValues.destination_hold_music,
  );

  const selectedHoldMusicValue = form.getFieldValue("destination_hold_music");

  const displayedHoldMusicOptions = holdMusicSelectOptions.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      label: showHoldMusicValue && option.value === selectedHoldMusicValue ? option.value : option.label,
    })),
  }));

  // Grouped Select options (Announcements / Call Center / Extensions, per group), matching
  // GET /api/destinations/list/actions' group/option shape. Alternate Actions binds to the same
  // fetched groups as Actions — only the "Other" fallback value differs per field.
  const actionGroupSelectOptions: GroupedSelectOption[] = actionOptions.map((group) => ({
    label: group.label,
    options: group.options.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  }));

  const actionSelectOptions = withCurrentValueFallback(actionGroupSelectOptions, initialValues.destination_action);

  const alternateActionSelectOptions = withCurrentValueFallback(
    actionGroupSelectOptions,
    initialValues.destination_alternate_action,
  );

  const selectedActionValue = form.getFieldValue("destination_action");
  const selectedAlternateActionValue = form.getFieldValue("destination_alternate_action");

  const displayedActionOptions = actionSelectOptions.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      label: showActionValue && option.value === selectedActionValue ? option.value : option.label,
    })),
  }));

  const displayedAlternateActionOptions = alternateActionSelectOptions.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      label: showAlternateActionValue && option.value === selectedAlternateActionValue ? option.value : option.label,
    })),
  }));

  const disabled = !canManage;

  return (
    <Form<DestinationFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <Card>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="destination_type" label="Type" tooltip="Select the type" rules={[{ required: true }]}>
              <Select options={typeOptions} aria-label="Destination type" placeholder="Select type" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_prefix"
              label="Country Code"
              tooltip="Enter the country code"
              rules={[countryOrTrunkPrefixRule]}
            >
              <Input type={"number"} min={0} placeholder="Enter country code" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_trunk_prefix"
              label="Trunk Prefix"
              tooltip="Enter the trunk prefix."
              rules={[countryOrTrunkPrefixRule]}
            >
              <Input placeholder="Enter trunk prefix" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_area_code"
              label="Area Code"
              tooltip="Enter the area code."
              rules={[areaCodeRule]}
            >
              <Input placeholder="Enter area code" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_number"
              label="Destination"
              tooltip="Enter the destination"
              validateFirst
              rules={destinationNumberRules(isDestinationNumberTaken, excludeUuid)}
            >
              <Input placeholder="Enter destination" aria-label="Destination number" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_cid_name_prefix"
              label="Caller ID Name Prefix"
              tooltip="Set a prefix on the caller ID name"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter caller id name prefix" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_caller_id_name"
              label="Caller ID Name"
              tooltip="Enter the caller ID name"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter caller id name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_caller_id_number"
              label="Caller ID Number"
              tooltip="Enter the caller ID number"
              rules={[callerIdNumberRule]}
            >
              <Input placeholder="Enter caller id number" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_context"
              label="Context"
              tooltip="Enter the context"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter context" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_distinctive_ring"
              label="Distinctive Ring"
              tooltip="Enter the sound for a distinctive ring."
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="distinctive ring" />
            </Form.Item>
          </Col>

          {destinationType !== "outbound" && (
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Actions" tooltip="Select the actions">
                <Row gutter={8} wrap={false}>
                  <Col flex="auto">
                    <Form.Item name="destination_action" noStyle rules={[noEdgeWhitespaceRule]}>
                      <Select
                        showSearch={!showActionValue}
                        allowClear={!showActionValue}
                        optionFilterProp="label"
                        placeholder="Select actions"
                        options={displayedActionOptions}
                        loading={optionsLoading}
                        aria-label="Destination action"
                        value={form.getFieldValue("destination_action")}
                        onChange={handleActionChange}
                        open={showActionValue ? false : undefined}
                      />
                    </Form.Item>
                  </Col>

                  <Col flex="none">
                    <Button type="default" onClick={handleActionToggle} disabled={submitting || disabled}>
                      ❮
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={12} md={8}>
            <Form.Item label="Alternate Actions" tooltip="Select the alternate actions">
              <Row gutter={8} wrap={false}>
                <Col flex="auto">
                  <Form.Item name="destination_alternate_action" noStyle rules={[noEdgeWhitespaceRule]}>
                    <Select
                      showSearch={!showAlternateActionValue}
                      allowClear={!showAlternateActionValue}
                      optionFilterProp="label"
                      placeholder="Select alternate actions"
                      options={displayedAlternateActionOptions}
                      loading={optionsLoading}
                      aria-label="Destination alternate action"
                      value={form.getFieldValue("destination_alternate_action")}
                      onChange={handleAlternateActionChange}
                      open={showAlternateActionValue ? false : undefined}
                    />
                  </Form.Item>
                </Col>

                <Col flex="none">
                  <Button type="default" onClick={handleAlternateActionToggle} disabled={submitting || disabled}>
                    ❮
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Col>

          {destinationType === "inbound" && (
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="fax_uuid" label="Fax Detection" tooltip="Select the Fax Detection">
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="Select fax detection"
                  options={faxOptions}
                  loading={optionsLoading}
                  aria-label="Fax detection"
                />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={12} md={8}>
            <Form.Item label="Hold Music" tooltip="Select the MOH category here">
              <Row gutter={8} wrap={false}>
                <Col flex="auto">
                  <Form.Item name="destination_hold_music" noStyle rules={[noEdgeWhitespaceRule]}>
                    <Select
                      showSearch={!showHoldMusicValue}
                      allowClear={!showHoldMusicValue}
                      optionFilterProp="label"
                      placeholder="Select hold music"
                      options={displayedHoldMusicOptions}
                      loading={optionsLoading}
                      aria-label="Hold music"
                      value={form.getFieldValue("destination_hold_music")}
                      onChange={handleHoldMusicChange}
                      open={showHoldMusicValue ? false : undefined}
                    />
                  </Form.Item>
                </Col>

                <Col flex="none">
                  <Button type="default" onClick={handleToggleHoldMusicValue} disabled={submitting || disabled}>
                    ❮
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_accountcode"
              label="Account Code"
              tooltip="Enter account code"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input disabled placeholder="Enter account code" aria-label="Account code" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="domain_name"
              label="Domain"
              tooltip="Select the domain"
              rules={[{ required: true, message: "Domain is required" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select domain"
                disabled={mode === "edit" || disabled}
                onChange={handleDomainChange}
                options={hive.domainOptions.map((domain) => ({
                  label: domain,
                  value: domain,
                }))}
                aria-label="Domain"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_order"
              label="Order"
              tooltip="Select the order"
              rules={[{ required: true, message: "Order required" }]}
            >
              <Input type={"number"} min={0}  style={{ width: "100%" }} placeholder="Select order" aria-label="Order" />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item
              name="destination_description"
              label="Description"
              tooltip="Enter a description for this destination (optional)"
              rules={[noEdgeWhitespaceRule]}
            >
              <TextArea rows={4} placeholder="Enter description" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <DestinationUsage disabled={disabled} />
          </Col>

          <Col xs={24} lg={12}>
            <DestinationOptions disabled={disabled} />
          </Col>
        </Row>
      </div>
    </Form>
  );
};

export default DestinationForm;
