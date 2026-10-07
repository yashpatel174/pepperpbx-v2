import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space, theme, Tooltip } from 'antd'
import { CaretRightOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import CallCenterForm from '../components/CallCenterForm'
import {
  getCallCenterAgentOptions,
  getCallCenterAnnounceOptions,
  getCallCenterDetails,
  getCallCenterGreetingOptions,
  getCallCenterMusicOnHoldOptions,
  getCallCenterTimeoutActionOptions,
  getHiveCallCenterDetails,
  startStopRestartCallCenter,
  updateCallCenter,
} from '../call-center.service'
import useCallCenterPermissions from '../useCallCenterPermissions'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import type {
  CallCenterDetails,
  CallCenterFlagCommand,
  CallCenterFormValues,
  CallCenterTierFormValue,
  HiveCallCenterDetails,
  SelectOption,
} from '../call-center.types'

const EDIT_CALL_CENTER_FORM_ID = 'edit-call-center-form'

const loadDomainOptions = async (domainName: string) => {
  const results = await Promise.allSettled([
    getCallCenterGreetingOptions(domainName),
    getCallCenterTimeoutActionOptions(domainName),
    getCallCenterAnnounceOptions(domainName),
    getCallCenterMusicOnHoldOptions(domainName),
    getCallCenterAgentOptions(domainName),
  ])
  const value = (result: PromiseSettledResult<SelectOption[]>): SelectOption[] => (result.status === 'fulfilled' ? result.value : [])
  return {
    greetingOptions: value(results[0]),
    timeoutActionOptions: value(results[1]),
    announceOptions: value(results[2]),
    musicOnHoldOptions: value(results[3]),
    agentOptions: value(results[4]),
  }
}

const toOptionalString = (value?: number): string | undefined => (value === undefined ? undefined : String(value))

/**
 * call-center.md §9/§27's `sortCallCenterTier`: tiers ordered by tier position, then by agent label
 * (locale-aware). Sorts a copy (stable), so the loaded details are never mutated; a row whose agent
 * isn't in `agentOptions` sorts with an empty label. Applied only when a record loads, so rows are
 * never reordered while the user is editing.
 */
const sortTiers = (tiers: CallCenterTierFormValue[], agentOptions: SelectOption[]): CallCenterTierFormValue[] => {
  const labelOf = (agentUuid?: string) => agentOptions.find((option) => option.value === agentUuid)?.label ?? ''
  return [...tiers].sort(
    (a, b) => a.tier_position - b.tier_position || labelOf(a.call_center_agent_uuid).localeCompare(labelOf(b.call_center_agent_uuid))
  )
}

/** Maps the stored/API details back into the form model — numeric fields back to the form's string inputs. */
const toFormValues = (details: CallCenterDetails, agentOptions: SelectOption[]): CallCenterFormValues => ({
  ...details,
  queue_max_wait_time: toOptionalString(details.queue_max_wait_time),
  queue_tier_rule_wait_second: toOptionalString(details.queue_tier_rule_wait_second),
  queue_discard_abandoned_after: toOptionalString(details.queue_discard_abandoned_after),
  queue_time_base_score_sec: toOptionalString(details.queue_time_base_score_sec),
  queue_max_wait_time_with_no_agent: toOptionalString(details.queue_max_wait_time_with_no_agent),
  queue_max_wait_time_with_no_agent_time_reached: toOptionalString(details.queue_max_wait_time_with_no_agent_time_reached),
  queue_announce_frequency: toOptionalString(details.queue_announce_frequency),
  callcenter_tier: sortTiers(details.callcenter_tier, agentOptions),
})

const lifecyclePastTense: Record<CallCenterFlagCommand, string> = { load: 'started', unload: 'stopped', reload: 'restarted' }

const EditCallCenterPage = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit } = useCallCenterPermissions()
  const { callCenterId } = useParams<{ callCenterId: string }>()

  const [hive, setHive] = useState<HiveCallCenterDetails | null>(null)
  const [greetingOptions, setGreetingOptions] = useState<SelectOption[]>([])
  const [timeoutActionOptions, setTimeoutActionOptions] = useState<SelectOption[]>([])
  const [announceOptions, setAnnounceOptions] = useState<SelectOption[]>([])
  const [musicOnHoldOptions, setMusicOnHoldOptions] = useState<SelectOption[]>([])
  const [agentOptions, setAgentOptions] = useState<SelectOption[]>([])
  const [details, setDetails] = useState<CallCenterDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lifecycleAction, setLifecycleAction] = useState<CallCenterFlagCommand | null>(null)
  const [formKey, setFormKey] = useState(0)

  // View-only users see the form but can't submit changes — matches the audit's
  // `disabledFieldsBasic` (call-center.md §14/§25/§33).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!callCenterId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const callCenterDetails = await getCallCenterDetails(callCenterId)
        // Always supply the record's own domain here — matches the fix already established for
        // Gateways'/Outbound Routes'/Announcements'/Call Block's Edit screens (the Axion reference
        // has a confirmed typo bug losing the exclusion list in Edit mode, call-center.md §28/§33 —
        // PepperPBX avoids reproducing that by always resolving a fresh hive bootstrap here).
        const [hiveDetails, options] = await Promise.all([
          getHiveCallCenterDetails(callCenterDetails.domain_name),
          loadDomainOptions(callCenterDetails.domain_name),
        ])
        setDetails(callCenterDetails)
        setHive(hiveDetails)
        setGreetingOptions(options.greetingOptions)
        setTimeoutActionOptions(options.timeoutActionOptions)
        setAnnounceOptions(options.announceOptions)
        setMusicOnHoldOptions(options.musicOnHoldOptions)
        setAgentOptions(options.agentOptions)
        setFormKey((key) => key + 1)
      } catch (err) {
        // A 404 (unknown id) is distinguished from a genuine fetch failure so the page can show a
        // record-scoped EmptyState instead of an ErrorState+retry (retrying a bad id can't help),
        // matching the Call Center Agent module's identical EditCallCenterAgentPage.tsx pattern.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this call center queue.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [callCenterId]
  )

  useEffect(() => {
    // Deliberately does NOT redirect away when callCenterId is missing (unlike Axion's silent
    // redirect-to-list) — render loop below falls through to a record-scoped EmptyState instead,
    // matching the Call Center Agent module's EditCallCenterAgentPage.tsx.
    if (!callCenterId) {
      setLoading(false)
      return
    }
    load(true)
  }, [load, callCenterId])

  const handleCancel = () => navigate('/call-center')

  const handleSubmit = async (values: CallCenterFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateCallCenter(details.call_center_queue_uuid, values)
      message.success(`Call center queue "${values.queue_name}" updated successfully.`)
      // Matches the audit exactly: Update success does NOT navigate away — it re-fetches details
      // and re-populates the same Edit page in place (call-center.md §3/§19).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update call center queue.'))
    } finally {
      setSubmitting(false)
    }
  }

  // Start/Stop/Restart (call-center.md §3/§11/§12/§19/§26/§33) — Edit-toolbar-only, hidden unless
  // the user has edit permission (disabledFieldsBasic), toast + in-place refresh on success, no
  // navigation. flagCommand mapping ('load'/'unload'/'reload') preserved verbatim per the audit.
  const handleLifecycleAction = async (flagCommand: CallCenterFlagCommand, label: string) => {
    if (!details) return
    setLifecycleAction(flagCommand)
    try {
      await startStopRestartCallCenter(details.call_center_queue_uuid, flagCommand)
      message.success(`Call center queue "${details.queue_name}" ${lifecyclePastTense[flagCommand]} successfully.`)
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to ${label.toLowerCase()} call center queue.`))
    } finally {
      setLifecycleAction(null)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load(true)} />
  }

  if (loading) {
    return <LoadingState rows={10} />
  }

  if (!callCenterId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!callCenterId ? 'No call center queue was specified.' : 'Call center queue not found.'}
        action={<Button onClick={handleCancel}>Back to Call Centers</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Call Center Queue"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            {canEditFields && (
              <>
                <Tooltip title="Start">
                  <Button
                    icon={<CaretRightOutlined />}
                    loading={lifecycleAction === 'load'}
                    disabled={submitting || (lifecycleAction !== null && lifecycleAction !== 'load')}
                    style={{
                      color: '#fff',
                      backgroundColor: token.colorSuccess,
                      borderColor: token.colorSuccess,
                    }}
                    onClick={() => handleLifecycleAction('load', 'Start')}
                  >
                    Start
                  </Button>
                </Tooltip>
                <Tooltip title="Stop">
                  <Button
                    icon={<StopOutlined />}
                     style={{
                        color: '#fff',
                        backgroundColor: token.colorError,
                        borderColor: token.colorError,
                      }}
                    loading={lifecycleAction === 'unload'}
                    disabled={submitting || (lifecycleAction !== null && lifecycleAction !== 'unload')}
                    onClick={() => handleLifecycleAction('unload', 'Stop')}
                  >
                    Stop
                  </Button>
                </Tooltip>
                <Tooltip title="Restart">
                  <Button
                    icon={<ReloadOutlined />}
                    type='primary'
                    loading={lifecycleAction === 'reload'}
                    disabled={submitting || (lifecycleAction !== null && lifecycleAction !== 'reload')}
                    onClick={() => handleLifecycleAction('reload', 'Restart')}
                  >
                    Restart
                  </Button>
                </Tooltip>
              </>
            )}
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {/* View-only users get a read-only form with no Save at all. */}
            {canEditFields && (
              <Button type="primary" htmlType="submit" form={EDIT_CALL_CENTER_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <CallCenterForm
        key={formKey}
        formId={EDIT_CALL_CENTER_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details, agentOptions)}
        queueUuid={details.call_center_queue_uuid}
        hive={hive}
        greetingOptions={greetingOptions}
        timeoutActionOptions={timeoutActionOptions}
        announceOptions={announceOptions}
        musicOnHoldOptions={musicOnHoldOptions}
        agentOptions={agentOptions}
        canManage={canEditFields}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default EditCallCenterPage
