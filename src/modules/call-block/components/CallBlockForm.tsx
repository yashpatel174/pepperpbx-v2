import { useRef } from 'react'
import { App, Form, Space } from 'antd'
import { domainChangeMessage } from '../../../components/common/domainChangeMessage'
import type { CallBlockFormValues, HiveCallBlockDetails, SelectOption } from '../call-block.types'
import CallBlockBasicSection from './CallBlockBasicSection'
import RecentCallsSection from './RecentCallsSection'

export interface CallBlockFormProps {
  mode: 'create' | 'edit'
  /** The page owns loading — CallBlockForm only ever mounts once real values are ready. */
  initialValues: CallBlockFormValues
  hive: HiveCallBlockDetails
  extensionOptions: SelectOption[]
  actionOptions: SelectOption[]
  /** True while domain-dependent options are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean
  canManage: boolean
  submitting: boolean
  /** Called once the domain-change notice is dismissed, so the page can re-fetch domain-dependent
   * options (extension/action) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void
  onSubmit: (values: CallBlockFormValues) => void
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets this
   * id via `htmlType="submit"` + `form={formId}`, matching every other module in this codebase. */
  formId: string
  /** Edit mode only — the currently *persisted* record's domain/name/number, used to key the
   * Recent Calls sub-table; deliberately distinct from the live (possibly unsaved) form values,
   * matching the audit's documented behavior of fetching Recent Calls once against the loaded
   * record, not reactively as the user edits the form (call-block.md §3 item "Recent Calls Block"). */
  recentCallsContext?: { domainName: string; name?: string; number?: string }
}

/**
 * Shared by AddCallBlockPage and EditCallBlockPage — ONE form component, not two duplicated
 * per-mode components (CLAUDE.md's "one shared form per module" rule). Owns fields (via its
 * section components), the domain-change notice, and validation; pages own data loading,
 * defaults, and the create/update service call.
 *
 * The Recent Calls card renders only in Edit mode, matching the audit exactly (call-block.md
 * §3/§4/§25/§26/§33 — "the Recent Calls sub-table is only available in Edit mode; it is not part
 * of the Add flow").
 */
const CallBlockForm = ({
  mode,
  initialValues,
  hive,
  extensionOptions,
  actionOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
  recentCallsContext,
}: CallBlockFormProps) => {
  const [form] = Form.useForm<CallBlockFormValues>()
  const { modal } = App.useApp()
  const currentDomainRef = useRef(initialValues.domain_name)

  /**
   * The audit's domain-change popup here is purely informational — a single dismiss action, not
   * a Confirm/Cancel pair (call-block.md §20: `footer={false}`, "onHide resets form to defaults")
   * — unlike Outbound Routes'/Announcements' two-button popups, so this uses `modal.info` (one
   * OK button) rather than `modal.confirm`.
   *
   * INTENTIONAL, DOCUMENTED SCOPE: rather than wiping the *entire* form back to defaults (which
   * would discard Name/Number/Description/Enabled the user may have already entered — poor UX
   * regardless of the audit's literal wording), only the domain-scoped fields (Extension, Action)
   * are reset and re-fetched for the new domain — the same "reset only what's actually
   * domain-dependent" principle already applied to Outbound Routes'/Announcements' identical
   * domain-change handling.
   */
  const handleDomainChange = (value: string) => {
    if (value === currentDomainRef.current) {
      return
    }

    modal.info({
      title: 'Domain changed',
      content: domainChangeMessage(),
      okText: 'Continue',
      onOk: () => {
        currentDomainRef.current = value

        form.setFieldsValue({
          domain_name: value,
          extension_uuid: undefined,
          call_block_action: undefined,
        })

        onDomainConfirmed?.(value)
      },
    })
  }

  const disabled = !canManage

  return (
    <Form<CallBlockFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <CallBlockBasicSection
          mode={mode}
          hive={hive}
          extensionOptions={extensionOptions}
          actionOptions={actionOptions}
          optionsLoading={optionsLoading}
          disabled={disabled}
          onDomainChange={handleDomainChange}
        />

        {mode === 'edit' && recentCallsContext && (
          <RecentCallsSection
            domainName={recentCallsContext.domainName}
            name={recentCallsContext.name}
            number={recentCallsContext.number}
            extensionOptions={extensionOptions}
            actionOptions={actionOptions}
            disabled={disabled}
          />
        )}
      </Space>
    </Form>
  )
}

export default CallBlockForm
