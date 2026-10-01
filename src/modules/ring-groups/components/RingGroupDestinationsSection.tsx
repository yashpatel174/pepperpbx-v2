import { Button, Card, Col, Form, Row, Select, Tooltip } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import ToggleSelectInput from '../../../components/common/ToggleSelectInput'
import { delayOptions, isOrderStrategy, newDestinationRow, promptOptions, timeoutOptions } from '../ring-group.constants'
import { destinationNumberRules, noEdgeWhitespaceRule } from '../ring-group.validation'
import type { RingGroupDestination, RingGroupFormValues, RingGroupOption } from '../ring-group.types'

interface RingGroupDestinationsSectionProps {
  destinationOptions: RingGroupOption[]
  timeoutDestinationOptions: RingGroupOption[]
  optionsLoading: boolean
  disabled: boolean
  /** Whether the pick-or-type toggle is offered on Destination / Timeout Destination. */
  canUseCustomValues: boolean
}

/**
 * Axion's `AdvanceForm` card (ring-groups.md §8): Timeout Destination above a dynamic Destinations
 * list (`ring_group_destinations`) — per row Destination (required), Delay/Order, Timeout, Prompt.
 *
 * The third column is labelled "Order" for the Sequence/Rollover strategies and "Delay" otherwise
 * (§9); it's the same `destination_delay` field either way.
 *
 * Row removal is a PepperPBX addition: the audit documents only the Add button, but each row's
 * Destination is required, so without it an accidental Add would block saving. The last row can't
 * be removed (Add starts with one row, §3/§26).
 *
 * Timeout Destination must stay outside `Form.List`: every field rendered inside the list is
 * prefixed with the list's name, which would turn it into `ring_group_destinations.ring_group_timeout_action`
 * and make the submitted `ring_group_destinations` an object instead of an array. That's why the
 * Card wraps the list (not the other way round) and the header Add button appends through the form.
 */
const RingGroupDestinationsSection = ({
  destinationOptions,
  timeoutDestinationOptions,
  optionsLoading,
  disabled,
  canUseCustomValues,
}: RingGroupDestinationsSectionProps) => {
  const form = Form.useFormInstance<RingGroupFormValues>()
  const strategy = Form.useWatch('ring_group_strategy', form)
  const delayLabel = isOrderStrategy(strategy) ? 'Order' : 'Delay'

  const addDestination = () => {
    const rows = (form.getFieldValue('ring_group_destinations') as RingGroupDestination[] | undefined) ?? []
    form.setFieldValue('ring_group_destinations', [...rows, newDestinationRow()])
  }

  return (
    <Card
      title="Destinations"
      extra={
        <Button type="primary" icon={<PlusOutlined />} disabled={disabled} onClick={addDestination}>
          Add
        </Button>
      }
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12} lg={8}>
          <Form.Item
            name="ring_group_timeout_action"
            label="Timeout Destination"
            tooltip="Where the call goes when no destination answers"
            rules={[noEdgeWhitespaceRule]}
          >
            <ToggleSelectInput
              options={timeoutDestinationOptions}
              placeholder="Select timeout destination"
              loading={optionsLoading}
              disabled={disabled}
              canToggle={canUseCustomValues}
              allowClear
              aria-label="Timeout destination"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.List name="ring_group_destinations">
        {(fields, { remove }) =>
          fields.map((field, index) => (
            <Row gutter={[16, 0]} key={field.key} align="middle">
              <Col xs={24} md={9}>
                <Form.Item name={[field.name, 'destination_number']} label="Destination" validateFirst rules={destinationNumberRules}>
                  <ToggleSelectInput
                    options={destinationOptions}
                    placeholder="Select destination"
                    loading={optionsLoading}
                    disabled={disabled}
                    canToggle={canUseCustomValues}
                    aria-label={`Destination ${index + 1}`}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Form.Item name={[field.name, 'destination_delay']} label={delayLabel}>
                  <Select options={delayOptions} disabled={disabled} aria-label={`${delayLabel} ${index + 1}`} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Form.Item name={[field.name, 'destination_timeout']} label="Timeout">
                  <Select options={timeoutOptions} disabled={disabled} aria-label={`Timeout ${index + 1}`} />
                </Form.Item>
              </Col>
              <Col xs={20} sm={6} md={5}>
                <Form.Item name={[field.name, 'destination_prompt']} label="Prompt">
                  <Select options={promptOptions} disabled={disabled} aria-label={`Prompt ${index + 1}`} />
                </Form.Item>
              </Col>
              <Col xs={4} sm={2} md={2}>
                <Form.Item label=" " colon={false}>
                  <Tooltip title="Remove destination">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={disabled || fields.length <= 1}
                      onClick={() => remove(field.name)}
                      aria-label={`Remove destination ${index + 1}`}
                    />
                  </Tooltip>
                </Form.Item>
              </Col>
            </Row>
          ))
        }
      </Form.List>
    </Card>
  )
}

export default RingGroupDestinationsSection
