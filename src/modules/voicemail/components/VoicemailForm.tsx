import { useRef } from 'react'
import { App, Form, Space } from 'antd'
import { domainChangeMessage, domainChangeTitle } from '../../../components/common/domainChangeMessage'
import type { HiveVoicemailDetails, VoicemailFormValues, VoicemailLookups } from '../voicemail.types'
import VoicemailBasicSection from './VoicemailBasicSection'
import VoicemailActionSection from './VoicemailActionSection'
import VoicemailOptionsSection from './VoicemailOptionsSection'
import VoicemailForwardSection from './VoicemailForwardSection'

export interface VoicemailFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — VoicemailForm only ever mounts once real values are ready. */
  initialValues: VoicemailFormValues
  hive: HiveVoicemailDetails
  lookups: VoicemailLookups
  /** True while the domain-dependent lookups are being re-fetched after a domain change. */
  optionsLoading?: boolean
  canManage: boolean
  /** Placeholder for Axion's admin-only free-text toggle on Option destinations. */
  canToggleDestination: boolean
  submitting: boolean
  /** Add only: called as soon as the Domain changes, so the page can re-bootstrap for that domain. */
  onDomainChange?: (domainName: string) => void
  /** Deletes a saved option row server-side, immediately (voicemail.md §9 note 5). */
  onDeleteSavedOption: (optionUuid: string) => Promise<void>
  onSubmit: (values: VoicemailFormValues) => void
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar and targets this id. */
  formId: string
}

/**
 * Shared by AddVoicemailPage and EditVoicemailPage — ONE form component for both modes. Owns the
 * fields (via its section components), validation and the domain-change notice; pages own data
 * loading, defaults, and the create/update service call.
 *
 * Domain change (Add only, voicemail.md §8/§18): shows the informational "Domain Change" notice.
 * Unlike Call Block's partial reset, Axion resets the WHOLE form to defaults for the new domain
 * (and clears option destinations), so the page re-bootstraps and remounts this form.
 */
const VoicemailForm = ({
  mode,
  initialValues,
  hive,
  lookups,
  optionsLoading,
  canManage,
  canToggleDestination,
  submitting,
  onDomainChange,
  onDeleteSavedOption,
  onSubmit,
  formId,
}: VoicemailFormProps) => {
  const [form] = Form.useForm<VoicemailFormValues>()
  const { modal } = App.useApp()
  const currentDomainRef = useRef(initialValues.domain_name)

  const handleDomainChange = (value: string) => {
    if (value === currentDomainRef.current) return
    currentDomainRef.current = value
    modal.info({ title: domainChangeTitle, content: domainChangeMessage(), okText: 'Continue' })
    onDomainChange?.(value)
  }

  const disabled = !canManage

  return (
    <Form<VoicemailFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled || !!optionsLoading}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <VoicemailBasicSection
          mode={mode}
          hive={hive}
          greetingOptions={lookups.greetingOptions}
          optionsLoading={optionsLoading}
          onDomainChange={handleDomainChange}
        />
        <VoicemailActionSection />
        <VoicemailOptionsSection
          destinationOptions={lookups.destinationOptions}
          optionsLoading={optionsLoading}
          disabled={submitting || disabled || !!optionsLoading}
          canToggleDestination={canToggleDestination}
          onDeleteSavedOption={onDeleteSavedOption}
        />
        <VoicemailForwardSection options={lookups.forwardOptions} />
      </Space>
    </Form>
  )
}

export default VoicemailForm
