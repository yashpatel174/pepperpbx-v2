import { useRef } from 'react'
import { App, Card, Col, Form, Input, Row, Select, Space } from 'antd'
import { domainChangeMessage, domainChangeTitle } from '../../../components/common/domainChangeMessage'
import { getDefaultTimeGroupFormValues, orderOptions } from '../time-group.constants'
import { descriptionRules, domainRules, mainOrderRules, nameRules } from '../time-group.validation'
import TimeGroupRangesSection from './TimeGroupRangesSection'
import type { TimeGroupFormValues, TimeGroupHiveDetails, TimeGroupRangeFormValues } from '../time-group.types'

export interface TimeGroupFormProps {
  mode: 'create' | 'edit'
  /** HTML form id — the page's header Save button submits via `form={formId}`. */
  formId: string
  initialValues: TimeGroupFormValues
  /** Bootstrap for the form's domain: the Domain select's options. */
  hive: TimeGroupHiveDetails
  /** False for view-only users — the whole form is read-only. */
  canManage: boolean
  submitting: boolean
  onSubmit: (values: TimeGroupFormValues) => void
}

/**
 * The single Add/Edit form for Time Groups (time-groups.md §8). Pages own loading, service calls
 * and navigation; this owns fields, layout, validation, the dynamic time ranges and the domain
 * change.
 *
 * - Domain: selectable on Add behind a confirm dialog (shared `domainChangeMessage`). Confirming
 *   resets the form to its defaults for the new domain, as Axion's `methods.reset()` +
 *   `closeModal` do (§9/§20). Locked on Edit (§15).
 * - Context: always read-only and mirrors the domain (§9/§26).
 * - Order uniqueness is cross-field (§10/§26): any order change re-validates every order field.
 * - Axion's commented-out Extension / Alternate Destination / Enabled fields and the Festivals
 *   sub-form are dead code there and not ported (§8/§28).
 */
const TimeGroupForm = ({ mode, formId, initialValues, hive, canManage, submitting, onSubmit }: TimeGroupFormProps) => {
  const { modal } = App.useApp()
  const [form] = Form.useForm<TimeGroupFormValues>()
  const currentDomainRef = useRef(initialValues.domain_name)
  const disabled = submitting || !canManage

  const revalidateOrders = () => {
    const groups = (form.getFieldValue('groups') as unknown[] | undefined) ?? []
    const names: (string | number)[][] = [['order'], ...groups.map((_, index) => ['groups', index, 'order'])]
    form.validateFields(names).catch(() => undefined)
  }

  const handleValuesChange = (changed: Partial<TimeGroupFormValues>) => {
    // A single group's edit arrives as a sparse, partial array.
    const changedGroups: (Partial<TimeGroupRangeFormValues> | undefined)[] = changed.groups ?? []
    const groupOrderChanged = changedGroups.some((group) => group !== undefined && 'order' in group)
    if ('order' in changed || groupOrderChanged) revalidateOrders()
  }

  const handleDomainChange = (value: string) => {
    const previousDomain = currentDomainRef.current
    if (value === previousDomain) return

    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: 'Continue',
      cancelText: 'Cancel',
      onOk: () => {
        currentDomainRef.current = value
        form.resetFields()
        form.setFieldsValue(getDefaultTimeGroupFormValues(value))
      },
      onCancel: () => form.setFieldsValue({ domain_name: previousDomain }),
    })
  }

  return (
    <Form<TimeGroupFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      onValuesChange={handleValuesChange}
      disabled={disabled}
      scrollToFirstError
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="name" label="Name" tooltip="Enter the name" validateFirst rules={nameRules}>
                <Input placeholder="Enter name" aria-label="Time group name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="domain_name" label="Domain" tooltip="Select the domain" rules={domainRules}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select domain"
                  disabled={mode === 'edit' || disabled}
                  onChange={handleDomainChange}
                  options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
                  aria-label="Domain"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="order" label="Order" tooltip="Select the order" rules={mainOrderRules}>
                <Select allowClear options={orderOptions} placeholder="Select order" aria-label="Order" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="context" label="Context" tooltip="Set from the domain">
                <Input disabled aria-label="Context" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={16}>
              <Form.Item name="description" label="Description" tooltip="Enter the description" rules={descriptionRules}>
                <Input.TextArea rows={3} placeholder="Enter description" aria-label="Description" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <TimeGroupRangesSection disabled={disabled} />
      </Space>
    </Form>
  )
}

export default TimeGroupForm
