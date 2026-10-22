import { useRef } from 'react'
import { App, Form, Space } from 'antd'
import { domainChangeMessage, domainChangeTitle } from '../../../components/common/domainChangeMessage'
import type { ActionOptionGroup, AnnouncementFormValues, HiveAnnouncementDetails } from '../announcement.types'
import AnnouncementBasicSection from './AnnouncementBasicSection'
import AnnouncementStructureSection from './AnnouncementStructureSection'

export interface AnnouncementFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — AnnouncementForm only ever mounts once real values are ready. */
  initialValues: AnnouncementFormValues
  hive: HiveAnnouncementDetails
  playOptions: ActionOptionGroup[]
  executeOptions: ActionOptionGroup[]
  /** True while domain-dependent options are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean
  canManage: boolean
  /** Execute Action select ↔ free-text toggle — see useAnnouncementPermissions. */
  canUseFreeText: boolean
  submitting: boolean
  /** Called once the domain-change confirmation is accepted, so the page can re-fetch
   * domain-dependent options (play/execute actions) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void
  onSubmit: (values: AnnouncementFormValues) => void
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets this
   * id via `htmlType="submit"` + `form={formId}`, matching every other module in this codebase. */
  formId: string
}

/**
 * Shared by AddAnnouncementPage and EditAnnouncementPage — ONE form component, not two duplicated
 * per-mode components (CLAUDE.md's "one shared form per module" rule), unlike the audit's
 * AnnouncementsForm (which the audit itself documents as already a single shared wrapper — Axion
 * doesn't split Add/Edit here). Owns fields (via its section components), the domain-change
 * confirmation, and validation; pages own data loading, defaults, and the create/update service
 * call.
 *
 * Both the Basic and Structure cards render in both modes, matching the audit's Screen/Page Audit
 * (announcements.md §4) — unlike Outbound Routes, Announcements' Edit screen shows the exact same
 * two cards as Add, just with Domain locked.
 */
const AnnouncementForm = ({
  mode,
  initialValues,
  hive,
  playOptions,
  executeOptions,
  optionsLoading,
  canManage,
  canUseFreeText,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: AnnouncementFormProps) => {
  const [form] = Form.useForm<AnnouncementFormValues>()
  const { modal } = App.useApp()
  const currentDomainRef = useRef(initialValues.domain_name)

  /**
   * INTENTIONAL FIX vs the Axion reference: the audit documents that confirming the domain-change
   * popup does *not* reset any values, while *cancelling* it (closing via backdrop/onHide) resets
   * the *entire* form back to defaults (announcements.md §3/§20/§28/§33) — a confirmed, backwards
   * inconsistency (a "cancel" that wipes user input). PepperPBX makes this behave sensibly
   * instead: confirming the change clears only the domain-dependent Structure rows (their Action
   * values are scoped to the old domain's play/execute options) and re-fetches fresh options for
   * the new domain; cancelling simply reverts the Domain select, leaving everything else intact —
   * the same fix already established for Outbound Routes' identical domain-change popup.
   */
  const handleDomainChange = (value: string) => {
    if (value === currentDomainRef.current) {
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
          phrase_details: [],
        })

        onDomainConfirmed?.(value)
      },
      onCancel: () => {
        form.setFieldsValue({ domain_name: currentDomainRef.current })
      },
    })
  }

  const disabled = !canManage

  return (
    <Form<AnnouncementFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <AnnouncementBasicSection mode={mode} hive={hive} disabled={disabled} onDomainChange={handleDomainChange} />

        <AnnouncementStructureSection
          playOptions={playOptions}
          executeOptions={executeOptions}
          optionsLoading={optionsLoading}
          disabled={disabled}
          canUseFreeText={canUseFreeText}
        />
      </Space>
    </Form>
  )
}

export default AnnouncementForm
