import { useMemo, useRef } from "react";
import { App, Card, Col, Form, Input, Row, Select } from "antd";
import { domainChangeMessage } from "../../../../components/common/domainChangeMessage";
import ToggleSelectInput from "../../../../components/common/ToggleSelectInput";
import type { ToggleSelectOptionGroup } from "../../../../components/common/ToggleSelectInput";
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

/**
 * Maps the service's grouped options (actions / hold music) to ToggleSelectInput groups — the
 * stored form value is each option's raw `value`. Options with an empty value are shown but not
 * selectable, matching Axion. Unknown current values (e.g. a stale backend value) are appended
 * as an "Other" group by ToggleSelectInput itself, so they're displayed and submitted unchanged.
 */
const toToggleSelectGroups = (groups: ActionOptionGroup[] | HoldMusicGroup[]): ToggleSelectOptionGroup[] =>
  groups.map((group) => ({
    label: group.label,
    options: group.options.map((option) => ({
      label: option.label,
      value: option.value,
      disabled: !option.value,
    })),
  }));

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
  /** Axion's pbx_admin/pbx_axiontech select ↔ free-text toggle on Actions / Alternate Actions /
   * Hold Music — see useDestinationPermissions. */
  canUseFreeText: boolean;
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
  canUseFreeText,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: DestinationFormProps) => {
  const [form] = Form.useForm<DestinationFormValues>();
  const { modal } = App.useApp();
  const destinationType = Form.useWatch("destination_type", form);
  const currentDomainRef = useRef(initialValues.domain_name);

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

        // Axion resets the three domain-dependent selects to "". fax_uuid keeps its pre-existing
        // reset to undefined (its options are domain-scoped too, so a stale uuid would be invalid).
        form.setFieldsValue({
          domain_name: value,
          destination_action: "",
          destination_alternate_action: "",
          fax_uuid: undefined,
          destination_hold_music: "",
        });

        onDomainConfirmed?.(value);
      },
      onCancel: () => {
        form.setFieldsValue({
          domain_name: currentDomainRef.current,
        });
      },
    });
  };

  // GET /api/destinations/list/actions groups — Actions and Alternate Actions bind to the same
  // fetched options, each as its own independent single-string form field.
  const actionSelectOptions = useMemo(() => toToggleSelectGroups(actionOptions), [actionOptions]);
  // GET /api/destinations/list/holdMusic groups (Music on Hold / Recordings / Streams).
  const holdMusicSelectOptions = useMemo(() => toToggleSelectGroups(holdMusicOptions), [holdMusicOptions]);

  const disabled = !canManage;

  // Axion keeps destination_action in form state (and in the payload) when an outbound type hides
  // the field. Ant Design's onFinish omits unmounted fields, so the stored value is merged back.
  const handleFinish = (values: DestinationFormValues) =>
    onSubmit({ ...values, destination_action: form.getFieldValue("destination_action") });

  return (
    <Form<DestinationFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
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

          {/* Hidden for outbound, but its value is kept (not cleared) — see handleFinish. */}
          {destinationType !== "outbound" && (
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="destination_action"
                label="Actions"
                tooltip="Select the actions"
                rules={[noEdgeWhitespaceRule]}
              >
                <ToggleSelectInput
                  options={actionSelectOptions}
                  placeholder="Select actions"
                  loading={optionsLoading}
                  canToggle={canUseFreeText}
                  aria-label="Destination action"
                />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="destination_alternate_action"
              label="Alternate Actions"
              tooltip="Select the alternate actions"
              rules={[noEdgeWhitespaceRule]}
            >
              <ToggleSelectInput
                options={actionSelectOptions}
                placeholder="Select alternate actions"
                loading={optionsLoading}
                canToggle={canUseFreeText}
                aria-label="Destination alternate action"
              />
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
            <Form.Item
              name="destination_hold_music"
              label="Hold Music"
              tooltip="Select the MOH category here"
              rules={[noEdgeWhitespaceRule]}
            >
              <ToggleSelectInput
                options={holdMusicSelectOptions}
                placeholder="Select hold music"
                loading={optionsLoading}
                canToggle={canUseFreeText}
                aria-label="Hold music"
              />
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
