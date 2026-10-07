import { useEffect, useRef } from 'react'
import { App, Card, Col, Form, Input, Row, Select, theme } from 'antd'
import FormSwitchField from '../../../components/common/FormSwitchField'
import { domainChangeMessage, domainChangeTitle } from '../../../components/common/domainChangeMessage'
import { extensionReuseNote } from '../../../components/common/extensionReuseNote'
import {
  descriptionRules,
  emailRule,
  extensionRangeRule,
  flagsRule,
  nameFormatRule,
  nameRequiredRule,
  noEdgeWhitespaceRule,
  pinNumberRule,
} from '../conference.validation'
import { orderOptions } from '../conference.constants'
import type { ConferenceFormValues, ConferenceHiveDetails, ConferenceProfileOption } from '../conference.types'

const { TextArea } = Input

export interface ConferenceFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — ConferenceForm only ever mounts once real values are ready. */
  initialValues: ConferenceFormValues
  hive: ConferenceHiveDetails
  profileOptions: ConferenceProfileOption[]
  /** True while domain-dependent data (the extension pre-fill) is being re-fetched after a
   * confirmed domain change. */
  optionsLoading?: boolean
  canManage: boolean
  submitting: boolean
  /** Called once the domain-change confirmation is accepted, so the page can re-fetch the
   * domain's own hive bootstrap (autoExtension/range/exclude) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void
  onSubmit: (values: ConferenceFormValues) => void
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets this
   * id via `htmlType="submit"` + `form={formId}`, matching every other module in this codebase. */
  formId: string
}

/**
 * Shared by AddConferencePage and EditConferencePage — ONE form component, not two duplicated
 * per-mode components (CLAUDE.md's "one shared form per module" rule). Owns fields, the
 * domain-change confirmation, and validation; pages own data loading, defaults, and the
 * create/update service call.
 *
 * DELIBERATE DEVIATION FROM AXION (documented, not silent): the audit confirms Axion's own
 * domain-change popup in Add mode is purely informational (`footer={false}`, no explicit buttons)
 * and does NOT reset the form when closed — the stale, previous-domain field values simply remain
 * until the debounced re-fetch eventually lands (conferences.md §3/§20/§28: "CONFIRMED behavioral
 * difference from the cross-cutting `domainChangeMessage()` pattern"). This module normalizes that
 * to match every other PepperPBX module's already-established domain-change handling (Gateways/
 * Destinations/Outbound Routes/Announcements/Call Block/Call Center Queue/Call Center Agent): a
 * real Confirm/Cancel modal where confirming resets only the one genuinely domain-scoped field
 * (`conference_extension`, re-suggested from the new domain's `autoExtension` — Profile is NOT
 * domain-scoped, see conference.mock.ts) and cancelling restores the previous domain untouched.
 * Using `modal.confirm` (not `modal.info`) is required for the Cancel/restore path to exist at
 * all — matching CallCenterForm.tsx's/AgentForm.tsx's identical fix for the same class of issue.
 */
const ConferenceForm = ({
  mode,
  initialValues,
  hive,
  profileOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: ConferenceFormProps) => {
    const { token } = theme.useToken();
  const [form] = Form.useForm<ConferenceFormValues>()
  const { modal } = App.useApp()
  const currentDomainRef = useRef(initialValues.domain_name)
  const appliedHiveRef = useRef(hive)

  // Create mode only: once the page has loaded the confirmed new domain's hive, apply that
  // domain's auto-extension and account code. Skips the mount-time hive (already applied via
  // initialValues), so these fields are only overwritten after a confirmed domain change.
  useEffect(() => {
    if (mode !== 'create' || hive === appliedHiveRef.current) return
    appliedHiveRef.current = hive
    form.setFieldsValue({
      conference_extension: hive.autoExtension,
      conference_account_code: hive.accountCode,
    })
  }, [mode, hive, form])

  const handleDomainChange = (value: string) => {
    const previousDomain = currentDomainRef.current

    if (value === previousDomain) {
      return
    }

    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: 'Continue',
      cancelText: 'Cancel',
      onOk: () => {
        currentDomainRef.current = value

        form.setFieldsValue({
          domain_name: value,
          conference_extension: undefined,
          conference_account_code: undefined,
        })

        onDomainConfirmed?.(value)
      },
      onCancel: () => {
        form.setFieldsValue({
          domain_name: previousDomain,
        })
      },
    })
  }

  const disabled = !canManage

  return (
    <Form<ConferenceFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_name"
              label="Conference Name"
              tooltip="Enter the conference name"
              validateFirst
              rules={[nameRequiredRule, nameFormatRule, noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter conference name" aria-label="Conference name" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_extension"
              label="Extension"
              tooltip={`Must be between ${hive.extensionRangeStart} and ${hive.extensionRangeEnd}, optionally prefixed with "**"`}
              extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
              validateFirst
              rules={extensionRangeRule(hive)}
            >
              <Input type={"number"} min={0} placeholder="Enter extension" disabled={mode === 'edit' && disabled} aria-label="Extension" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_pin_number"
              label="PIN Number"
              tooltip="Optional PIN number to secure access to the conference."
              rules={[pinNumberRule, noEdgeWhitespaceRule]}
            >
              <Input type={"number"} min={0} placeholder="Enter PIN number" aria-label="PIN number" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_profile" label="Profile" tooltip="Conference profile is a collection of settings for the conference.">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Select profile"
                options={profileOptions}
                loading={optionsLoading}
                aria-label="Profile"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="conference_flags"
              label="Flags"
              tooltip="Optional conference flags. examples: mute|deaf|waste|moderator"
              rules={[flagsRule, noEdgeWhitespaceRule]}
            >
              <Input placeholder='Enter flags'aria-label="Flags" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_email_address" label="Email Address" tooltip='Optional conference email address.' rules={[emailRule]}>
              <Input placeholder="Enter email address" aria-label="Email address" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_account_code" label="Account Code" tooltip="Enter the account code here.">
              <Input disabled placeholder="Account code" aria-label="Account code" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="domain_name"
              label="Domain"
              tooltip="Select the domain"
              rules={[{ required: true, message: 'Domain is required' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select domain"
                disabled={mode === 'edit'}
                onChange={handleDomainChange}
                options={hive.domainOptions.map((domain) => ({
                  label: domain,
                  value: domain,
                }))}
                aria-label="Domain"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item name="conference_order" label="Order" tooltip="Enter the order number.">
              <Select showSearch options={orderOptions} placeholder="Select order" aria-label="Order" />
            </Form.Item>
          </Col>

          <Col xs={24} lg={16}>
            <Form.Item
              name="conference_description"
              label="Description"
              tooltip="Enter a description "
              rules={descriptionRules}
            >
              <TextArea rows={3} placeholder="Enter description" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <FormSwitchField name="conference_enabled" label="Enabled" tooltip="Select enabled" style={{ minHeight: 32 }} />
          </Col>
        </Row>
      </Card>
    </Form>
  )
}

export default ConferenceForm
