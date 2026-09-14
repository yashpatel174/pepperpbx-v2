import { useRef } from 'react'
import { App, Form } from 'antd'
import type { GatewayFormValues, HiveGatewayDetails, SbcDomainOption, SipProfileOption } from '../gateway.types'
import GatewayFormBasicSection from './GatewayFormBasicSection'
import GatewayFormAdvancedSection from './GatewayFormAdvancedSection'

export interface GatewayFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — GatewayForm only ever mounts once real values are ready. */
  initialValues: GatewayFormValues
  /** Current record's uuid, so the duplicate-name check excludes itself in edit mode. */
  excludeUuid?: string
  hive: HiveGatewayDetails
  sbcDomains: SbcDomainOption[]
  sipProfiles: SipProfileOption[]
  submitting: boolean
  canManage: boolean
  /** Create mode only — called once the domain-change confirmation is accepted, so the page can
   * re-fetch domain-dependent options (hive/SBC domains/SIP profiles) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void
  /** True while the page is re-fetching domain-dependent options after a confirmed domain change. */
  optionsLoading?: boolean
  onSubmit: (values: GatewayFormValues) => void
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets this
   * id via `htmlType="submit"` + `form={formId}`, matching the pattern used for Extensions. */
  formId: string
}

/**
 * Shared by AddGatewayPage and EditGatewayPage. Owns fields, layout, the domain-change
 * confirmation, and validation. Pages own data loading, defaults, and the create/update service
 * call. Gateway-owned — does not import anything from the Extensions module.
 */
const GatewayForm = ({
  mode,
  initialValues,
  excludeUuid,
  hive,
  sbcDomains,
  sipProfiles,
  submitting,
  canManage,
  onDomainConfirmed,
  optionsLoading,
  onSubmit,
  formId,
}: GatewayFormProps) => {
  const [form] = Form.useForm<GatewayFormValues>()
  const { modal } = App.useApp()
  const registerEnabled = Form.useWatch('register', form)
  const currentDomainRef = useRef(initialValues.domain_name)

  const handleDomainChange = (value: string) => {
    if (mode !== 'create' || value === currentDomainRef.current) {
      currentDomainRef.current = value
      return
    }
    modal.confirm({
      title: 'Change domain?',
      content: 'Once you update the domain, any pre-selected values will be reset.',
      okText: 'Continue',
      cancelText: 'Cancel',
      onOk: () => {
        currentDomainRef.current = value
        form.setFieldsValue({ domain_name: value, sbcDomainIp: undefined, profile: undefined })
        // Matches the Axion reference: re-fetch domain-dependent options once the domain change
        // is confirmed (not before — cancelling the popup must not trigger a refetch).
        onDomainConfirmed?.(value)
      },
      onCancel: () => {
        form.setFieldsValue({ domain_name: currentDomainRef.current })
      },
    })
  }

  return (
    <Form<GatewayFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting}
    >
      <GatewayFormBasicSection
        mode={mode}
        excludeUuid={excludeUuid}
        hive={hive}
        sbcDomains={sbcDomains}
        sipProfiles={sipProfiles}
        optionsLoading={optionsLoading}
        registerEnabled={!!registerEnabled}
        onDomainChange={handleDomainChange}
      />

      {canManage && <GatewayFormAdvancedSection />}
    </Form>
  )
}

export default GatewayForm
