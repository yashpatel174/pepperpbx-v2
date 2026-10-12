import { useMemo } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import useResponsive from "../../../hooks/useResponsive";
import {
  allWeekdays,
  allYearsSentinel,
  fullDayTimeFrom,
  fullDayTimeTo,
  getTimeZoneOptions,
  getYearOptions,
  maxSelectedYears,
  monthDayOptions,
  monthOptions,
  newTimeGroupRange,
  nextGroupOrder,
  orderOptions,
  timeFormat,
  timeMinuteStep,
  timePickerItemProps,
  disabledTimeAfter,
  isTimeAtOrBefore,
  weekdayOptions,
  workWeekdays,
} from "../time-group.constants";
import { groupOrderRules, timeFromRules, timeToRules } from "../time-group.validation";
import type { TimeGroupFormValues, TimeGroupRangeFormValues, WeekdayKey } from "../time-group.types";

const { Text } = Typography;

const sameDays = (a: WeekdayKey[], b: WeekdayKey[]) => a.length === b.length && b.every((day) => a.includes(day));

/** Inline switch + label, the same shape the sibling forms use for boolean toggles. */
const SwitchLabel = ({ children }: { children: string }) => <span style={{ whiteSpace: "nowrap" }}>{children}</span>;

/** Tighter than the default 24px item gap; validation messages still have room below each control. */
const itemStyle = { marginBottom: 20 };

/** Vertically centres a switch on the 32px line the inputs in the same row use. */
const controlLineStyle = {
  display: "flex",
  alignItems: "center",
  minHeight: 32,
};

interface TimeGroupRangeFieldsProps {
  index: number;
  name: number;
  canRemove: boolean;
  disabled: boolean;
  onRemove: () => void;
  timeZoneOptions: { label: string; value: string }[];
}

/**
 * One time range (Axion's `GroupArrayForm` entry + `FullDayTimeForm` + `AllDaysWeekDaysForm` +
 * `AdvanceSettingsForm`, §2/§8). Its own component so it can watch its own Full Day / days /
 * advanced state.
 */
const TimeGroupRangeFields = ({ index, name, disabled, onRemove, timeZoneOptions }: TimeGroupRangeFieldsProps) => {
  const form = Form.useFormInstance<TimeGroupFormValues>();
  const { isMobile } = useResponsive();

  const fullDay = Form.useWatch(["groups", name, "full_day"], form);

  const weekdays = (Form.useWatch(["groups", name, "weekdays"], form) as WeekdayKey[] | undefined) ?? [];

  // Watch month_days so the circle buttons re-render immediately when a day is selected/unselected.
  const monthDays = (Form.useWatch(["groups", name, "month_days"], form) as number[] | undefined) ?? [];

  const advanceSettings = Form.useWatch(["groups", name, "advance_settings"], form);

  const applyOnAllYears = Form.useWatch(["groups", name, "apply_on_all_years"], form);

  const watchedYears = Form.useWatch(["groups", name, "year"], form) as number[] | undefined;

  const currentYear = new Date().getFullYear();

  const allDays = sameDays(weekdays, allWeekdays);
  const weekdaysOnly = sameDays(weekdays, workWeekdays);

  // 2099 ("All Years") is only offered while Apply on All Years is on.
  // A saved year outside the options stays labelled while selected.
  const yearOptions = useMemo(() => {
    const options = getYearOptions(!!applyOnAllYears);

    const extra = (watchedYears ?? [])
      .filter((year) => !options.some((option) => option.value === year))
      .map((year) => ({
        label: year === allYearsSentinel ? "All Years" : String(year),
        value: year,
      }));

    return [...extra, ...options];
  }, [watchedYears, applyOnAllYears]);

  const setRangeField = <K extends keyof TimeGroupRangeFormValues>(key: K, value: TimeGroupRangeFormValues[K]) =>
    form.setFieldValue(["groups", name, key], value);

  // Full Day on locks the window to 12:00 AM – 11:59 PM.
  const handleFullDayChange = (checked: boolean) => {
    if (checked) {
      setRangeField("time_from", fullDayTimeFrom);
      setRangeField("time_to", fullDayTimeTo);
    }

    form
      .validateFields([
        ["groups", name, "time_from"],
        ["groups", name, "time_to"],
      ])
      .catch(() => undefined);
  };

  // Time To must be after Time From: earlier/equal times are greyed out in the Time To picker, and a
  // new Time From at or after the current Time To clears it (its required rule then asks again).
  const timeFrom = Form.useWatch(["groups", name, "time_from"], form) as string | undefined;
  const handleTimeFromChange = (value: Dayjs | null) => {
    if (value && isTimeAtOrBefore(form.getFieldValue(["groups", name, "time_to"]) as string | undefined, value)) {
      setRangeField("time_to", "");
    }
  };

  // "All Days" / "Weekdays" shortcuts.
  const handleAllDaysChange = (checked: boolean) => setRangeField("weekdays", checked ? [...allWeekdays] : []);

  const handleWeekdaysChange = (checked: boolean) => setRangeField("weekdays", checked ? [...workWeekdays] : []);

/**
 * Year selection:
 * - Keep the current year selected if the user clears the selection.
 * - Preserve the other selected years.
 */
const handleYearChange = (years: number[]) => {
  setRangeField("year", years.length === 0 ? [currentYear] : years);
};

/**
 * Apply on All Years:
 * ON  -> [2099] (only All Years is selected)
 * OFF -> [currentYear] (current year is selected)
 */
const handleApplyOnAllYearsChange = (checked: boolean) => {
  setRangeField(
    "year",
    checked ? [allYearsSentinel] : [currentYear],
  );
};

  return (
    <Card
      size="small"
      type="inner"
      title={`Time ${index + 1}`}
      extra={
        <Tooltip title="Remove Group">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Remove Group ${index + 1}`}
          >
            {isMobile ? null : "Remove Group"}
          </Button>
        </Tooltip>
      }
    >
      <Row gutter={[16, 0]}>
        <Col xs={16} sm={12} md={8} lg={5}>
          <Form.Item
            name={[name, "order"]}
            label="Order"
            tooltip="Evaluation order of this time range"
            rules={groupOrderRules(name)}
            style={itemStyle}
          >
            <Select options={orderOptions} placeholder="Select order" aria-label={`Time ${index + 1} order`} />
          </Form.Item>
        </Col>

        <Col xs={8} sm={12} md={4} lg={3}>
          <Form.Item label="Full Day" tooltip="Covers the whole day (12:00 AM – 11:59 PM)" style={itemStyle}>
            <div style={controlLineStyle}>
              <Form.Item name={[name, "full_day"]} valuePropName="checked" noStyle>
                <Switch onChange={handleFullDayChange} aria-label={`Time ${index + 1} full day`} />
              </Form.Item>
            </div>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6} lg={5}>
          <Form.Item
            name={[name, "time_from"]}
            label="Time From"
            dependencies={[
              ["groups", name, "time_to"],
              ["groups", name, "full_day"],
            ]}
            rules={timeFromRules(name)}
            style={itemStyle}
            {...timePickerItemProps}
          >
            <TimePicker
              format={timeFormat}
              use12Hours
              minuteStep={timeMinuteStep}
              allowClear={false}
              needConfirm={false}
              inputReadOnly
              disabled={disabled || !!fullDay}
              onChange={handleTimeFromChange}
              style={{ width: "100%" }}
              aria-label={`Time ${index + 1} from`}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6} lg={5}>
          <Form.Item
            name={[name, "time_to"]}
            label="Time To"
            dependencies={[
              ["groups", name, "time_from"],
              ["groups", name, "full_day"],
            ]}
            rules={timeToRules(name)}
            style={itemStyle}
            {...timePickerItemProps}
          >
            <TimePicker
              format={timeFormat}
              use12Hours
              minuteStep={timeMinuteStep}
              allowClear={false}
              needConfirm={false}
              inputReadOnly
              disabled={disabled || !!fullDay}
              disabledTime={disabledTimeAfter(timeFrom)}
              style={{ width: "100%" }}
              aria-label={`Time ${index + 1} to`}
            />
          </Form.Item>
        </Col>

        <Col xs={24} lg={6}>
          <Form.Item
            name={[name, "time_zone"]}
            label="Time Zone"
            tooltip="Time zone this range is evaluated in"
            style={itemStyle}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={timeZoneOptions}
              placeholder="Select time zone"
              aria-label={`Time ${index + 1} time zone`}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={<strong>Days </strong>} style={{ marginBottom: 0 }}>
        <Space wrap size="large" style={{ marginBottom: 8 }}>
          <Space size="small">
            <Switch
              size="small"
              checked={allDays}
              onChange={handleAllDaysChange}
              aria-label={`Time ${index + 1} all days`}
            />
            <SwitchLabel>All Days</SwitchLabel>
          </Space>

          <Space size="small">
            <Switch
              size="small"
              checked={weekdaysOnly}
              onChange={handleWeekdaysChange}
              aria-label={`Time ${index + 1} weekdays`}
            />
            <SwitchLabel>Weekdays</SwitchLabel>
          </Space>

          <Form.Item name={[name, "weekdays"]} noStyle>
            <div
              role="group"
              aria-label={`Time ${index + 1} days of week`}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {weekdayOptions.map((option) => {
                const selected = weekdays.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={option.label}
                    onClick={() => {
                      const nextWeekdays = selected
                        ? weekdays.filter((day) => day !== option.value)
                        : [...weekdays, option.value];

                      setRangeField("weekdays", nextWeekdays);
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      borderRadius: "50%",
                      border: `1px solid "var(--ant-color-primary)" : "var(--ant-color-border)"}`,
                      backgroundColor: selected ? "var(--ant-color-primary)" : "transparent",
                      color: selected ? "var(--ant-color-text-light-solid)" : "var(--ant-color-text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      padding: 0,
                      transition: "all 0.2s",
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Form.Item>
        </Space>
      </Form.Item>

      <Divider style={{ margin: "12px 0" }} />

      <Space size="small" align="center" wrap>
        <Form.Item name={[name, "advance_settings"]} valuePropName="checked" noStyle>
          <Switch size="small" aria-label={`Time ${index + 1} advance settings`} />
        </Form.Item>

        <Text strong>Advance Settings</Text>
        <Text type="secondary">Year, month and day-of-month filters</Text>
      </Space>

      <div
        style={{
          display: advanceSettings ? "block" : "none",
          marginTop: 12,
        }}
      >
        <Row gutter={[16, 0]} align="bottom">
          <Col xs={24} md={16} lg={12}>
            <Form.Item name={[name, "year"]} label={<strong>Year</strong>} tooltip={`Up to ${maxSelectedYears} years`} style={itemStyle}>
              <Select
                mode="multiple"
                maxCount={maxSelectedYears}
                options={yearOptions}
                disabled={disabled || !!applyOnAllYears}
                placeholder="Select year"
                aria-label={`Time ${index + 1} year`}
                onChange={handleYearChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8} lg={6}>
            <Form.Item style={itemStyle}>
              <div style={controlLineStyle}>
                <Space size="small">
                  <Form.Item name={[name, "apply_on_all_years"]} valuePropName="checked" noStyle>
                    <Switch
                      size="small"
                      onChange={handleApplyOnAllYearsChange}
                      aria-label={`Time ${index + 1} apply on all years`}
                    />
                  </Form.Item>

                  <SwitchLabel>Apply on All Years</SwitchLabel>
                </Space>
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name={[name, "months"]} label={<strong>Months</strong>} style={itemStyle}>
          <Checkbox.Group
            className="large-checkbox-group large-checkbox-group--months"
            aria-label={`Time ${index + 1} months`}
          >
            {monthOptions.map((option) => (
              <Checkbox key={option.value} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>

        <Form.Item name={[name, "month_days"]} label={<strong>Days of Month</strong>} style={{ marginBottom: 0 }}>
          <div
            role="group"
            aria-label={`Time ${index + 1} days of month`}
            style={{
              display: "flex",
              flexWrap: "wrap",
              columnGap: 48,
              rowGap: 12,
              gap: 44,
              width: "100%",
            }}
          >
            {monthDayOptions.map((option) => {
              const selected = monthDays.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={`Day ${option.label}`}
                  onClick={() => {
                    const nextDays = selected
                      ? monthDays.filter((day) => day !== option.value)
                      : [...monthDays, option.value];

                    setRangeField("month_days", nextDays);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    borderRadius: "50%",
                    border: `1px solid "var(--ant-color-primary)" : "var(--ant-color-border)"}`,
                    backgroundColor: selected ? "var(--ant-color-primary)" : "transparent",
                    color: selected ? "var(--ant-color-text-light-solid)" : "var(--ant-color-text)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    padding: 0,
                    transition: "all 0.2s",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </Form.Item>
      </div>
    </Card>
  );
};

interface TimeGroupRangesSectionProps {
  disabled: boolean;
}

/**
 * The dynamic "groups" array (Axion's `GroupArrayForm`, time-groups.md §8):
 * Add Time appends a range with Axion's defaults and the next free order;
 * Remove Time drops one. Removing the last range is blocked.
 */
const TimeGroupRangesSection = ({ disabled }: TimeGroupRangesSectionProps) => {
  const form = Form.useFormInstance<TimeGroupFormValues>();

  const timeZoneOptions = useMemo(() => getTimeZoneOptions(), []);

  return (
    <Form.List name="groups">
      {(fields, { add, remove }) => (
        <Card
          title="Groups"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={disabled}
              onClick={() => {
                const groups = (form.getFieldValue("groups") as TimeGroupRangeFormValues[] | undefined) ?? [];

                const used = [
                  form.getFieldValue("order") as number | undefined,
                  ...groups.map((group) => group?.order),
                ];

                add(newTimeGroupRange(nextGroupOrder(used)));
              }}
            >
              Add Group
            </Button>
          }
        >
          {fields.length === 0 ? (
            <Text type="secondary">No times configured.</Text>
          ) : (
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {fields.map((field, index) => (
                <TimeGroupRangeFields
                  key={field.key}
                  index={index}
                  name={field.name}
                  canRemove={fields.length > 1}
                  disabled={disabled}
                  onRemove={() => remove(field.name)}
                  timeZoneOptions={timeZoneOptions}
                />
              ))}
            </Space>
          )}
        </Card>
      )}
    </Form.List>
  );
};

export default TimeGroupRangesSection;
