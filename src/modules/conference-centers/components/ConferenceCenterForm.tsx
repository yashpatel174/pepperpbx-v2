import { useEffect, useRef } from 'react'
import { App, Card, Col, Form, Input, Row, Select, theme } from 'antd'
import FormSwitchField from '../../../components/common/FormSwitchField'
import { domainChangeMessage, domainChangeTitle } from '../../../components/common/domainChangeMessage'
import { extensionReuseNote } from '../../../components/common/extensionReuseNote'
import ToggleSelectInput from '../../../components/common/ToggleSelectInput'
import { pinLengthOptions } from '../conference-center.constants'
import { extensionRules, nameRules, noEdgeWhitespaceRule, pinLengthRules } from '../conference-center.validation'
import useConferenceCenterPermissions from '../useConferenceCenterPermissions'
import type { ConferenceCenterFormValues, GreetingOption, HiveUserConferenceDetails } from '../conference-center.types'

const { TextArea } = Input

export interface ConferenceCenterFormProps {
  mode: 'create' | 'edit'
  /** HTML form id — the page's ModuleHeader Save button submits via `form={formId}`. */
  formId: string
  /** The page only mounts the form once these are ready. */
  initialValues: Partial<ConferenceCenterFormValues>
  hive: HiveUserConferenceDetails
  greetingOptions: GreetingOption[]
  /** True while the new domain's hive/greetings are being re-fetched after a domain change. */
  optionsLoading?: boolean
  /** False for view-only users — the whole form becomes read-only. */
  canManage: boolean
  submitting: boolean
  /** Add only: the domain change was confirmed; the page re-fetches hive details + greetings. */
  onDomainConfirmed?: (domainName: string) => void
  onSubmit: (values: ConferenceCenterFormValues) => void
}

/**
 * The single Add/Edit form for Conference Centers — exactly the eight audited fields
 * (conference-centers.md §8).
 *
 * Domain change (Add only): uses the PepperPBX domain-change confirm (Continue/Cancel) shared by
 * every other module, rather than Axion's button-less informational popup. It does NOT reset the
 * whole form — which is the audit's own documented behavior (§28) — it only clears the fields
 * that belong to the old domain (extension, greeting, account code). Name, PIN length, description
 * and Enabled are kept. The new domain's auto-extension and account code are filled in once the
 * page delivers its hive details. Cancel restores the previous domain.
 */
const ConferenceCenterForm = ({
  mode,
  formId,
  initialValues,
  hive,
  greetingOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
}: ConferenceCenterFormProps) => {
 const { token } = theme.useToken();
  const [form] = Form.useForm<ConferenceCenterFormValues>()
  const { modal } = App.useApp()
  // TODO: Axion gates the Greeting select/text toggle on `pbx_admin || pbx_axiontech`; no
  // PepperPBX equivalent exists yet, so the module's admin tier stands in (same as Call Center).
  const { canManageAll } = useConferenceCenterPermissions()
  const currentDomainRef = useRef(initialValues.domain_name)
  const awaitingDomainHiveRef = useRef(false)

  // After a confirmed domain change, the next hive the page delivers belongs to the new domain:
  // apply its auto-extension and account code, clearing any stale range error.
  useEffect(() => {
    if (!awaitingDomainHiveRef.current) return
    awaitingDomainHiveRef.current = false
    form.setFields([
      { name: 'conference_center_extension', value: hive.autoExtension, errors: [] },
      { name: 'conference_center_account_code', value: hive.accountCode },
    ])
  }, [hive, form])

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
        form.setFieldsValue({
          domain_name: value,
          conference_center_extension: undefined,
          conference_center_greeting: undefined,
          conference_center_account_code: undefined,
        })
        awaitingDomainHiveRef.current = true
        onDomainConfirmed?.(value)
      },
      onCancel: () => {
        form.setFieldsValue({ domain_name: previousDomain })
      },
    })
  }

  return (
    <Form<ConferenceCenterFormValues>
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
            <Form.Item
              name="conference_center_name"
              label="Conference Center Name"
              tooltip="Enter the conference center name"
              validateFirst
              rules={[...nameRules, noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter conference center name" aria-label="Conference center name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_center_extension"
              label="Extension"
              tooltip={`Must be between ${hive.extensionRangeStart} and ${hive.extensionRangeEnd}, optionally prefixed with "**"`}
              extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
              validateFirst
              rules={extensionRules(hive)}
            >
              {/* Text input on purpose: a number input can't hold the "**" prefix. */}
              <Input type={"number"} min={0} placeholder="Enter extension" aria-label="Extension" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_center_greeting" label="Greeting" tooltip="Select the greeting sound for this center" rules={[noEdgeWhitespaceRule]}>
              <ToggleSelectInput
                options={greetingOptions}
                placeholder="Select or enter greeting"
                loading={optionsLoading}
                canToggle={canManageAll}
                allowClear
                aria-label="Greeting"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_center_pin_length"
              label="PIN Length"
              tooltip="How many digits a room PIN in this center must have"
              rules={pinLengthRules}
            >
              <Select showSearch optionFilterProp="label" placeholder="Select PIN length" options={pinLengthOptions} aria-label="PIN length" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_center_account_code" label="Account Code" tooltip="Provided by the system; cannot be changed">
              <Input disabled placeholder="Account code" aria-label="Account code" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="domain_name" label="Domain" tooltip="Select the domain" rules={[{ required: true, message: 'Domain is required' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select domain"
                disabled={mode === 'edit'}
                onChange={handleDomainChange}
                options={hive.domainOptions.map((domain) => ({ label: domain, value: domain }))}
                aria-label="Domain"
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={16}>
            <Form.Item name="conference_center_description" label="Description" tooltip="Enter a description" rules={[noEdgeWhitespaceRule]}>
              <TextArea rows={3} placeholder="Enter description" aria-label="Description" />
            </Form.Item>
          </Col>

           <Col xs={24} sm={12} lg={8}>
            <FormSwitchField name="conference_center_enabled" label="Enabled" tooltip="Select enabled" style={{ minHeight: 32 }} />
          </Col>
        </Row>
      </Card>
    </Form>
  )
}

export default ConferenceCenterForm
