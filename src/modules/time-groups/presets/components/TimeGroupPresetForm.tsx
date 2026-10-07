import { useRef } from 'react'
import { App, Card, Col, Form, Input, Row, Select, Space } from 'antd'
import { domainChangeMessage, domainChangeTitle } from '../../../../components/common/domainChangeMessage'
import { getDefaultPresetFormValues } from '../time-group-preset.constants'
import { descriptionRules, domainRules, nameRules } from '../time-group-preset.validation'
import TimeGroupPresetFestivalsSection from './TimeGroupPresetFestivalsSection'
import type { TimeGroupHiveDetails } from '../../time-group.types'
import type { TimeGroupPresetFormValues } from '../time-group-preset.types'

export interface TimeGroupPresetFormProps {
  mode: 'create' | 'edit'
  /** HTML form id — the page's header Save button submits via `form={formId}`. */
  formId: string
  initialValues: TimeGroupPresetFormValues
  /** The Time Group bootstrap — Axion's preset pages use the same `getHiveUserDetails`. */
  hive: TimeGroupHiveDetails
  /** False for view-only users — the whole form is read-only. */
  canManage: boolean
  submitting: boolean
  onSubmit: (values: TimeGroupPresetFormValues) => void
}

/**
 * The single Add/Edit form for Presets (Axion's `FestivalForm`): Name, Description, Domain, then the
 * holiday checkboxes and each selected holiday's window. Pages own loading, service calls and
 * navigation.
 *
 * - Domain: selectable on Add behind the shared domain-change dialog; confirming resets the form
 *   (Axion clears the festivals too). Locked on Edit.
 * - Axion's commented-out Preset Destination and Extension fields are not ported.
 */
const TimeGroupPresetForm = ({ mode, formId, initialValues, hive, canManage, submitting, onSubmit }: TimeGroupPresetFormProps) => {
  const { modal } = App.useApp()
  const [form] = Form.useForm<TimeGroupPresetFormValues>()
  const currentDomainRef = useRef(initialValues.domain_name)
  const disabled = submitting || !canManage

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
        form.setFieldsValue(getDefaultPresetFormValues(value))
      },
      onCancel: () => form.setFieldsValue({ domain_name: previousDomain }),
    })
  }

  return (
    <Form<TimeGroupPresetFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={disabled}
      scrollToFirstError
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="name" label="Name" tooltip="Enter the name for the preset" validateFirst rules={nameRules}>
                <Input placeholder="Enter name" aria-label="Preset name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="domain_name" label="Domain" tooltip="Select domain" rules={domainRules}>
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

            <Col xs={24}>
              <Form.Item name="description" label="Description" tooltip="Enter the description" rules={descriptionRules}>
                <Input.TextArea rows={3} placeholder="Enter description" aria-label="Description" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <TimeGroupPresetFestivalsSection disabled={disabled} />
      </Space>
    </Form>
  )
}

export default TimeGroupPresetForm
