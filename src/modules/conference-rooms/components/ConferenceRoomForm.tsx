import { useEffect, useRef } from "react";
import { App, Card, Col, DatePicker, Form, Input, Row, Select, Switch } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { domainChangeMessage } from "../../../components/common/domainChangeMessage";
import { maxMemberOptions, scheduleDateFormat, trueFalseOptions } from "../conference-room.constants";
import {
  nameRules,
  noEdgeWhitespaceRule,
  pinRules,
  startDatetimeRules,
  stopDatetimeRules,
} from "../conference-room.validation";
import type {
  ConferenceCenterOption,
  ConferenceProfileOption,
  ConferenceRoomBooleanKey,
  ConferenceRoomFormValues,
  HiveUserDetails,
} from "../conference-room.types";

const { TextArea } = Input;

export interface ConferenceRoomFormProps {
  mode: "create" | "edit";
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string;
  /** The page only mounts the form once these are ready. */
  initialValues: Partial<ConferenceRoomFormValues>;
  hive: HiveUserDetails;
  conferenceCenterOptions: ConferenceCenterOption[];
  profileOptions: ConferenceProfileOption[];
  /** True while the new domain's hive/centers/profiles are being re-fetched after a domain change. */
  optionsLoading?: boolean;
  /** False for view-only users — the whole form becomes read-only. */
  canManage: boolean;
  submitting: boolean;
  /** Add only: the domain change was confirmed; the page re-fetches the domain's hive, centers and profiles. */
  onDomainConfirmed?: (domainName: string) => void;
  onSubmit: (values: ConferenceRoomFormValues) => void;
  /** Reports whether the whole form currently passes validation — the page disables Save while false (Axion's `disabled={!isValid}`, §3/§10). */
  onValidityChange?: (valid: boolean) => void;
}

/** The True/False selects hold strings; the form model keeps real booleans. */
const booleanSelectItemProps = {
  getValueProps: (value?: boolean) => ({ value: value === undefined ? undefined : String(value) }),
  normalize: (value?: string) => value === "true",
};

/** The pickers hold Dayjs; the form model keeps `YYYY-MM-DD HH:mm` strings (conference-rooms.md §27). */
const dateTimeItemProps = {
  getValueProps: (value?: string) => ({ value: value ? dayjs(value) : undefined }),
  normalize: (value: Dayjs | null) => (value ? value.format(scheduleDateFormat) : undefined),
};

const booleanSelectFields: { name: ConferenceRoomBooleanKey; label: string; tooltip: string }[] = [
  { name: "wait_mod", label: "Wait for Moderator", tooltip: "Select moderator value" },
  { name: "moderator_endconf", label: "Moderator endconf", tooltip: "Select moderator endconf value" },
  { name: "announce_name", label: "Announce Name", tooltip: "Select announce name value" },
  { name: "announce_count", label: "Announce Count", tooltip: "Select announce count value" },
  { name: "announce_recording", label: "Announce Recording", tooltip: "Select announce recording value" },
  { name: "sounds", label: "Sounds", tooltip: "Select sounds value" },
  { name: "mute", label: "Mute", tooltip: "Select mute value" },
];

/**
 * The single Add/Edit form for Conference Rooms — exactly the audited fields (conference-rooms.md §8).
 *
 * Domain change (Add only): uses the PepperPBX domain-change confirm (Continue/Cancel) shared by
 * every sibling module, rather than Axion's button-less informational popup (§20/§28). Continue
 * clears only the values that belong to the old domain — Conference Center, Profile and Account
 * Code — because their options are re-fetched for the new domain; the new account code is filled
 * in once the page delivers the new hive. Everything else is kept. Cancel restores the old domain.
 */
const ConferenceRoomForm = ({
  mode,
  formId,
  initialValues,
  hive,
  conferenceCenterOptions,
  profileOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  onValidityChange,
}: ConferenceRoomFormProps) => {
  const [form] = Form.useForm<ConferenceRoomFormValues>();
  const { modal } = App.useApp();
  const currentDomainRef = useRef(initialValues.domain_name);
  const awaitingDomainHiveRef = useRef(false);

  // Re-check validity on every value change without showing errors on untouched fields
  // (Ant Design's `validateOnly`). Only the latest check may report.
  const values = Form.useWatch([], form);
  useEffect(() => {
    if (!onValidityChange) return;
    let active = true;
    form.validateFields({ validateOnly: true }).then(
      () => active && onValidityChange(true),
      () => active && onValidityChange(false),
    );
    return () => {
      active = false;
    };
  }, [values, form, onValidityChange]);

  // After a confirmed domain change, the next hive the page delivers belongs to the new domain.
  useEffect(() => {
    if (!awaitingDomainHiveRef.current) return;
    awaitingDomainHiveRef.current = false;
    form.setFieldsValue({ account_code: hive.accountCode });
  }, [hive, form]);

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
          domain_name: value,
          conference_center_uuid: undefined,
          profile: undefined,
          account_code: undefined,
        });
        awaitingDomainHiveRef.current = true;
        onDomainConfirmed?.(value);
      },
      onCancel: () => {
        form.setFieldsValue({ domain_name: previousDomain });
      },
    });
  };

  return (
    <Form<ConferenceRoomFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || !canManage}
    >
      <Card>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_center_uuid" label="Conference Name">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="Select Conference Name"
                options={conferenceCenterOptions}
                loading={optionsLoading}
                disabled={mode === "edit"}
                aria-label="Conference center"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_room_name"
              label="Room Name"
              tooltip="Enter the room name"
              validateFirst
              rules={nameRules}
            >
              <Input placeholder="Enter room name" aria-label="Conference room name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="moderator_pin"
              label="Moderator"
              dependencies={["participant_pin"]}
              validateFirst
              rules={pinRules("participant_pin")}
            >
              {/* Text input on purpose: a number input blanks values like "12." instead of letting validation reject them. */}
              <Input type={"number"} placeholder="Enter moderator PIN" aria-label="Moderator PIN" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="participant_pin"
              label="Participant"
              dependencies={["moderator_pin"]}
              validateFirst
              rules={pinRules("moderator_pin")}
            >
              <Input type={"number"} placeholder="Enter participant PIN" aria-label="Participant PIN" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="profile"
              label="Profile"
              tooltip="Conference profile is a collection of settings for the conference room."
              rules={[{ required: true, message: "Profile is required" }]}
            >
              <Select
                showSearch
                // allowClear
                optionFilterProp="label"
                placeholder="Select profile"
                options={profileOptions}
                loading={optionsLoading}
                aria-label="Profile"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="record" label="Record" tooltip="Select record value" {...booleanSelectItemProps}>
              <Select options={trueFalseOptions} aria-label="Record" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="max_members" label="Max Members" tooltip="Select the max members here.">
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select max members"
                options={maxMemberOptions}
                aria-label="Max members"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="start_datetime"
              label="Schedule From"
              tooltip={`Date Format : ${scheduleDateFormat}`}
              dependencies={["stop_datetime"]}
              rules={startDatetimeRules}
              {...dateTimeItemProps}
            >
              <DatePicker
                showTime={{ format: "HH:mm", minuteStep: 15 }}
                format={scheduleDateFormat}
                placeholder="Select start date/time"
                style={{ width: "100%" }}
                aria-label="Schedule from"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="stop_datetime"
              label="Schedule To"
              tooltip={`Date Format : ${scheduleDateFormat}`}
              dependencies={["start_datetime"]}
              rules={stopDatetimeRules}
              {...dateTimeItemProps}
            >
              <DatePicker
                showTime={{ format: "HH:mm", minuteStep: 15 }}
                format={scheduleDateFormat}
                placeholder="Select end date/time"
                style={{ width: "100%" }}
                aria-label="Schedule to"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
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
                disabled={mode === "edit"}
                onChange={handleDomainChange}
                options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
                aria-label="Domain"
              />
            </Form.Item>
          </Col>

          {booleanSelectFields.map(({ name, label, tooltip }) => (
            <Col xs={24} sm={12} lg={8} key={name}>
              <Form.Item name={name} label={label} tooltip={tooltip} {...booleanSelectItemProps}>
                <Select options={trueFalseOptions} aria-label={label} />
              </Form.Item>
            </Col>
          ))}

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="account_code" label="Account Code" tooltip="Provided by the system; cannot be changed">
              <Input disabled placeholder="Account code" aria-label="Account code" />
            </Form.Item>
          </Col>

          <Col xs={24} lg={16}>
            <Form.Item
              name="description"
              label="Description"
              tooltip="Enter a description"
              rules={[noEdgeWhitespaceRule]}
            >
              <TextArea rows={3} placeholder="Enter description" aria-label="Description" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="enabled" label="Enabled" tooltip="Select enabled" valuePropName="checked">
              <Switch aria-label="Enabled" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default ConferenceRoomForm;
