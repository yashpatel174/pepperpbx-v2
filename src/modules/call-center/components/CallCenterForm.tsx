import { App, Col, Form, Row } from 'antd'
import { useRef } from 'react'
import { domainChangeMessage } from '../../../components/common/domainChangeMessage'
import type { CallCenterFormValues, HiveCallCenterDetails, SelectOption } from '../call-center.types'
import CallCenterBasicSection from './CallCenterBasicSection'
import CallCenterSwitchSection from './CallCenterSwitchSection'
import CallCenterTierSection from './CallCenterTierSection'

export interface CallCenterFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — CallCenterForm only ever mounts once real values are ready. */
  initialValues: CallCenterFormValues
  /** The queue's own uuid — only passed on Edit (see CallCenterTierSection.tsx's queueUuid prop
   * for why: a tier row can only be "existing/persisted" once the queue itself exists). */
  queueUuid?: string
  hive: HiveCallCenterDetails
  greetingOptions: SelectOption[]
  timeoutActionOptions: SelectOption[]
  announceOptions: SelectOption[]
  musicOnHoldOptions: SelectOption[]
  agentOptions: SelectOption[]
  /** True while domain-dependent options are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean
  canManage: boolean
  submitting: boolean
  /** Called once the domain-change notice is dismissed, so the page can re-fetch domain-dependent
   * options (greeting/timeout/announce/MOH/agent) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void
  onSubmit: (values: CallCenterFormValues) => void
  /** HTML form id — the page renders Cancel/Save (and, on Edit, Start/Stop/Restart) in its
   * ModuleHeader toolbar; Save targets this id via `htmlType="submit"` + `form={formId}`, matching
   * every other module in this codebase. */
  formId: string
}

/**
 * Shared by AddCallCenterPage and EditCallCenterPage — ONE form component, not two duplicated
 * per-mode components (CLAUDE.md's "one shared form per module" rule). Owns fields (via its
 * section components), the domain-change notice, and validation; pages own data loading,
 * defaults, and the create/update service call.
 */
const CallCenterForm = ({
  mode,
  initialValues,
  queueUuid,
  hive,
  greetingOptions,
  timeoutActionOptions,
  announceOptions,
  musicOnHoldOptions,
  agentOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: CallCenterFormProps) => {
  const [form] = Form.useForm<CallCenterFormValues>()
  const { modal } = App.useApp()
  const currentDomainRef = useRef(initialValues.domain_name)

  /**
   * Matches the domain-change popup pattern already established for Outbound Routes/
   * Announcements/Call Block: rather than wiping the *entire* form back to defaults (Axion's
   * literal behavior, call-center.md §9/§20 — "footer={false}", "closing resets form"), only the
   * domain-scoped fields (Greeting/Timeout Destination/Announce Sound/Music On Hold/Agent tiers)
   * are reset and re-fetched for the new domain, preserving everything the user already typed —
   * the same "reset only what's actually domain-dependent" principle already applied consistently
   * across this codebase.
   */
  const handleDomainChange = (value: string) => {
    const previousDomain = currentDomainRef.current

    if (value === previousDomain) {
      return
    }

    // Ant Design's Form.Item already updated the Select's displayed value to `value` the moment
    // onChange fired (it composes onto the child's own onChange rather than replacing it), so a
    // dismissal here (Escape/backdrop, not just an explicit Cancel button) must actively restore
    // the previous domain — otherwise the field would visually show the new domain while the
    // domain-scoped options/currentDomainRef stay scoped to the old one. modal.confirm (not
    // modal.info) is used specifically so a Cancel path exists to do that restoration — matches
    // AgentForm.tsx's identical fix for the same class of issue.
    modal.confirm({
      title: 'Domain changed',
      content: domainChangeMessage(),
      okText: 'Continue',
      cancelText: 'Cancel',
      onOk: () => {
        currentDomainRef.current = value

        form.setFieldsValue({
          domain_name: value,
          queue_greeting: undefined,
          queue_timeout_action: undefined,
          queue_announce_sound: undefined,
          queue_moh_sound: '',
          callcenter_tier: [{ tier_level: 0, tier_position: 0 }],
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
    <Form<CallCenterFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <div style={{ width: '100%' }}>
        <CallCenterBasicSection
          mode={mode}
          hive={hive}
          greetingOptions={greetingOptions}
          timeoutActionOptions={timeoutActionOptions}
          announceOptions={announceOptions}
          musicOnHoldOptions={musicOnHoldOptions}
          optionsLoading={optionsLoading}
          disabled={disabled}
          onDomainChange={handleDomainChange}
        />

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <CallCenterSwitchSection disabled={disabled} />
          </Col>

          <Col xs={24} lg={12}>
            <CallCenterTierSection
              agentOptions={agentOptions}
              optionsLoading={optionsLoading}
              disabled={disabled}
              queueUuid={queueUuid}
            />
          </Col>
        </Row>
      </div>
    </Form>
  )
}

export default CallCenterForm