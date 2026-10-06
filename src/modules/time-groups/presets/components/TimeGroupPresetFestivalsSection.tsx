import { useMemo } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Row,
  Select,
  Space,
  Switch,
  TimePicker,
  theme,
  Tooltip,
  Typography,
} from 'antd'
import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import {
  fullDayTimeFrom,
  fullDayTimeTo,
  getTimeZoneOptions,
  timeFormat,
  timeMinuteStep,
  timePickerItemProps,
  disabledTimeAfter,
  isTimeAtOrBefore,
} from '../../time-group.constants'
import {
  datePickerItemProps,
  festivalLabel,
  getHolidayOptions,
  newPresetFestival,
  presetDateFormat,
  presetDateToNumber,
} from '../time-group-preset.constants'
import {
  dateFromRules,
  dateToRules,
  festivalTimeFromRules,
  festivalTimeToRules,
} from '../time-group-preset.validation'
import type { HolidayOption } from '../time-group-preset.constants'
import type {
  FestivalName,
  PresetFestival,
  TimeGroupPresetFormValues,
} from '../time-group-preset.types'

const { Text } = Typography

const displayDate = (iso: string) => dayjs(iso).format('MMM DD, YYYY')

interface FestivalFieldsProps {
  name: number
  disabled: boolean
  onRemove: () => void
  timeZoneOptions: { label: string; value: string }[]
}

/**
 * One selected holiday's window — Axion's `FestivalGroupArrayForm` row +
 * `FestivalFullDayTimeForm`:
 * Full Day, Time From/To, Date From/To, Time Zone.
 *
 * Axion's All Days/Weekdays and Advance Settings sub-forms are commented
 * out of the preset form and are not ported.
 */
const FestivalFields = ({
  name,
  disabled,
  onRemove,
  timeZoneOptions,
}: FestivalFieldsProps) => {
  const form = Form.useFormInstance<TimeGroupPresetFormValues>()

  const fullDay = Form.useWatch(
    ['festivals', name, 'full_day'],
    form,
  )

  // Date To can't be earlier than Date From (the same day is allowed). Compared as YYYYMMDD via
  // the shared `MM-DD-YYYY` helper; with no Date From there is no restriction.
  const dateFromDay = presetDateToNumber(
    Form.useWatch(['festivals', name, 'date_from'], form) as string | undefined,
  )
  const disabledDateTo = (current: Dayjs) =>
    dateFromDay !== null && Number(current.format('YYYYMMDD')) < dateFromDay

  // A new Date From that lands after the current Date To clears Date To, so the form never holds an
  // inverted range (its required rule then asks for a new one).
  const handleDateFromChange = (value: Dayjs | null) => {
    if (!value) return
    const dateTo = presetDateToNumber(
      form.getFieldValue(['festivals', name, 'date_to']) as string | undefined,
    )
    if (dateTo !== null && dateTo < Number(value.format('YYYYMMDD'))) {
      form.setFieldValue(['festivals', name, 'date_to'], '')
    }
  }

  // Time To must be after Time From: earlier/equal times are greyed out in the Time To picker, and a
  // new Time From at or after the current Time To clears it (its required rule then asks again).
  const timeFrom = Form.useWatch(['festivals', name, 'time_from'], form) as string | undefined
  const handleTimeFromChange = (value: Dayjs | null) => {
    if (value && isTimeAtOrBefore(form.getFieldValue(['festivals', name, 'time_to']) as string | undefined, value)) {
      form.setFieldValue(['festivals', name, 'time_to'], '')
    }
  }

  // Read from the store, not a watch — a watch can trail a just-added row by one render.
  const festivalName = form.getFieldValue([
    'festivals',
    name,
    'festival_name',
  ]) as FestivalName

  const label = festivalLabel(festivalName)

  // Full Day on locks the window to 12:00 AM – 11:59 PM.
  const handleFullDayChange = (checked: boolean) => {
    if (checked) {
      form.setFieldValue(
        ['festivals', name, 'time_from'],
        fullDayTimeFrom,
      )

      form.setFieldValue(
        ['festivals', name, 'time_to'],
        fullDayTimeTo,
      )
    }

    form
      .validateFields([
        ['festivals', name, 'time_from'],
        ['festivals', name, 'time_to'],
      ])
      .catch(() => undefined)
  }

  return (
    <Card
      size="small"
      type="inner"
      title={label}
      extra={
        <Tooltip title="Remove holiday">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Remove ${label}`}
          />
        </Tooltip>
      }
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} lg={8} xxl={4}>
          <Form.Item
            label="Full Day"
            tooltip="Select enabled/disabled full day"
          >
            <Form.Item
              name={[name, 'full_day']}
              valuePropName="checked"
              noStyle
            >
              <Switch
                onChange={handleFullDayChange}
                disabled={disabled}
                aria-label={`${label} full day`}
              />
            </Form.Item>
          </Form.Item>
        </Col>

        <Col xs={12} sm={12} lg={8} xxl={4}>
          <Form.Item
            name={[name, 'time_from']}
            label="Time From"
            dependencies={[
              ['festivals', name, 'time_to'],
              ['festivals', name, 'full_day'],
            ]}
            rules={festivalTimeFromRules(name)}
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
              style={{ width: '100%' }}
              aria-label={`${label} time from`}
            />
          </Form.Item>
        </Col>

        <Col xs={12} sm={12} lg={8} xxl={4}>
          <Form.Item
            name={[name, 'time_to']}
            label="Time To"
            dependencies={[
              ['festivals', name, 'time_from'],
              ['festivals', name, 'full_day'],
            ]}
            rules={festivalTimeToRules(name)}
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
              style={{ width: '100%' }}
              aria-label={`${label} time to`}
            />
          </Form.Item>
        </Col>

        <Col xs={12} sm={12} lg={8} xxl={4}>
          <Form.Item
            name={[name, 'date_from']}
            label="Date From"
            tooltip={`Date Format : ${presetDateFormat}`}
            dependencies={[['festivals', name, 'date_to']]}
            rules={dateFromRules(name)}
            {...datePickerItemProps}
          >
            <DatePicker
              format={presetDateFormat}
              allowClear={false}
              inputReadOnly
              onChange={handleDateFromChange}
              style={{ width: '100%' }}
              aria-label={`${label} date from`}
            />
          </Form.Item>
        </Col>

        <Col xs={12} sm={12} lg={8} xxl={4}>
          <Form.Item
            name={[name, 'date_to']}
            label="Date To"
            tooltip={`Date Format : ${presetDateFormat}`}
            dependencies={[['festivals', name, 'date_from']]}
            rules={dateToRules(name)}
            {...datePickerItemProps}
          >
            <DatePicker
              format={presetDateFormat}
              allowClear={false}
              inputReadOnly
              disabledDate={disabledDateTo}
              style={{ width: '100%' }}
              aria-label={`${label} date to`}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} lg={8} xxl={4}>
          <Form.Item
            name={[name, 'time_zone']}
            label="Time Zone"
            tooltip="Select the time zone"
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={timeZoneOptions}
              placeholder="Select time zone"
              aria-label={`${label} time zone`}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

/**
 * Holiday name + this year's date, with Axion's title / rule /
 * upcoming dates in a tooltip.
 */
const HolidayLabel = ({ option }: { option: HolidayOption }) => {
  const { token } = theme.useToken()

  return (
    <span>
      {option.label}{' '}
      <Tooltip
        title={
          <>
            {option.title}
            <br />
            ({option.description})

            {option.upcoming_dates.map((date) => (
              <div key={date}>{displayDate(date)}</div>
            ))}
          </>
        }
      >
        <InfoCircleOutlined
          style={{
            color: token.colorTextTertiary,
            fontSize: 12,
          }}
          aria-label={`${option.label} dates`}
        />
      </Tooltip>

      <br />

      <Text
        type="secondary"
        style={{ fontSize: token.fontSizeSM }}
      >
        {displayDate(option.current_year_date)}
      </Text>
    </span>
  )
}

interface TimeGroupPresetFestivalsSectionProps {
  disabled: boolean
}

/**
 * Axion's `FestivalCheckForm` + `FestivalGroupArrayForm`:
 *
 * - Checking a holiday appends its default window to `festivals`.
 * - Unchecking removes that holiday from `festivals`.
 * - Removing the holiday row also unchecks the corresponding checkbox.
 *
 * The checkbox state is derived from the form's `festivals` array.
 */
const TimeGroupPresetFestivalsSection = ({
  disabled,
}: TimeGroupPresetFestivalsSectionProps) => {
  const form = Form.useFormInstance<TimeGroupPresetFormValues>()

  const holidayOptions = useMemo(
    () => getHolidayOptions(),
    [],
  )

  const timeZoneOptions = useMemo(
    () => getTimeZoneOptions(),
    [],
  )

  return (
    <Form.List name="festivals">
      {(fields, { add, remove }) => (
        <Form.Item noStyle shouldUpdate>
          {() => {
            const festivals =
              (form.getFieldValue(
                'festivals',
              ) as PresetFestival[] | undefined) ?? []

            return (
              <Card title="Holidays">
                <Row gutter={[16, 12]}>
                  {holidayOptions.map((option) => {
                    const selected = festivals.some(
                      (item) =>
                        item?.festival_name ===
                        option.festival_name,
                    )

                    const handleChange = (
                      checked: boolean,
                    ) => {
                      const current =
                        (form.getFieldValue(
                          'festivals',
                        ) as
                          | PresetFestival[]
                          | undefined) ?? []

                      const index = current.findIndex(
                        (item) =>
                          item?.festival_name ===
                          option.festival_name,
                      )

                      if (checked && index === -1) {
                        add(newPresetFestival(option))
                        return
                      }

                      if (!checked && index !== -1) {
                        remove(index)
                      }
                    }

                    return (
                      <Col
                        xs={24}
                        sm={12}
                        lg={8}
                        key={option.festival_name}
                      >
                        <Checkbox
                          checked={selected}
                          disabled={disabled}
                          onChange={(event) =>
                            handleChange(
                              event.target.checked,
                            )
                          }
                          aria-label={option.label}
                        >
                          <HolidayLabel option={option} />
                        </Checkbox>
                      </Col>
                    )
                  })}
                </Row>

                {fields.length > 0 && (
                  <Space
                    orientation="vertical"
                    size="middle"
                    style={{
                      width: '100%',
                      marginTop: 16,
                    }}
                  >
                    {fields.map((field) => (
                      <FestivalFields
                        key={field.key}
                        name={field.name}
                        disabled={disabled}
                        onRemove={() =>
                          remove(field.name)
                        }
                        timeZoneOptions={
                          timeZoneOptions
                        }
                      />
                    ))}
                  </Space>
                )}
              </Card>
            )
          }}
        </Form.Item>
      )}
    </Form.List>
  )
}

export default TimeGroupPresetFestivalsSection
