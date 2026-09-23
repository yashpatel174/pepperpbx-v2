import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import CallCenterForm from '../components/CallCenterForm'
import {
  createCallCenter,
  getCallCenterAgentOptions,
  getCallCenterAnnounceOptions,
  getCallCenterGreetingOptions,
  getCallCenterMusicOnHoldOptions,
  getCallCenterTimeoutActionOptions,
  getHiveCallCenterDetails,
} from '../call-center.service'
import { getDefaultCallCenterFormValues } from '../call-center.constants'
import useCallCenterPermissions from '../useCallCenterPermissions'
import type { CallCenterFormValues, HiveCallCenterDetails, SelectOption } from '../call-center.types'

const ADD_CALL_CENTER_FORM_ID = 'add-call-center-form'

/**
 * Five parallel, independently-failing option fetches (call-center.md §3/§29/§33: "five parallel
 * option fetches... each non-blocking on failure — PepperPBX should preserve this resilience
 * pattern"). Each is wrapped so one failing endpoint doesn't block the others or the whole form.
 */
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
    hasError: results.some((result) => result.status === 'rejected'),
  }
}

const AddCallCenterPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useCallCenterPermissions()

  const [hive, setHive] = useState<HiveCallCenterDetails | null>(null)
  const [greetingOptions, setGreetingOptions] = useState<SelectOption[]>([])
  const [timeoutActionOptions, setTimeoutActionOptions] = useState<SelectOption[]>([])
  const [announceOptions, setAnnounceOptions] = useState<SelectOption[]>([])
  const [musicOnHoldOptions, setMusicOnHoldOptions] = useState<SelectOption[]>([])
  const [agentOptions, setAgentOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [hasOptionsError, setHasOptionsError] = useState(false)

  const canAccessForm = canManageAll || canAdd

  useEffect(() => {
    let active = true
    getHiveCallCenterDetails()
      .then(async (hiveDetails) => {
        if (!active) return
        setHive(hiveDetails)
        const options = await loadDomainOptions(hiveDetails.defaultDomain)
        if (!active) return
        setGreetingOptions(options.greetingOptions)
        setTimeoutActionOptions(options.timeoutActionOptions)
        setAnnounceOptions(options.announceOptions)
        setMusicOnHoldOptions(options.musicOnHoldOptions)
        setAgentOptions(options.agentOptions)
        setHasOptionsError(options.hasError)
      })
      .catch(() => {
        if (active) setError('Failed to load account details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleCancel = () => navigate('/call-center')

  // Matches the audit: once a domain change is dismissed, re-fetch the domain-dependent option
  // lists for the newly selected domain — call-center.md §9.
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    try {
      const options = await loadDomainOptions(domainName)
      setGreetingOptions(options.greetingOptions)
      setTimeoutActionOptions(options.timeoutActionOptions)
      setAnnounceOptions(options.announceOptions)
      setMusicOnHoldOptions(options.musicOnHoldOptions)
      setAgentOptions(options.agentOptions)
      setHasOptionsError(options.hasError)
    } catch {
      message.error('Failed to refresh domain-dependent options.')
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: CallCenterFormValues) => {
    setSubmitting(true)
    try {
      const created = await createCallCenter(values)
      message.success('Call center queue created successfully.')
      // Matches the audit: Create success navigates to Edit — UNLESS the user has only the Add
      // permission (no view/edit/all), in which case it navigates to the List instead
      // (call-center.md §3/§19/§33). With RBAC still foundation-only (empty store = everything
      // granted), this "only add" branch is currently unreachable in practice, but the logic is
      // correct and ready for when real granular permissions arrive.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? '/call-center' : `/call-center/${created.call_center_queue_uuid}/edit`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create call center queue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/call-center')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Call Center Queue"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {canAccessForm && (
                <Button type="primary" htmlType="submit" form={ADD_CALL_CENTER_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {hasOptionsError && (
        <ErrorState message="Some data couldn't be loaded. Please refresh and try again." onRetry={() => handleDomainConfirmed(hive.defaultDomain)} />
      )}
      <CallCenterForm
        formId={ADD_CALL_CENTER_FORM_ID}
        mode="create"
        initialValues={getDefaultCallCenterFormValues(hive)}
        hive={hive}
        greetingOptions={greetingOptions}
        timeoutActionOptions={timeoutActionOptions}
        announceOptions={announceOptions}
        musicOnHoldOptions={musicOnHoldOptions}
        agentOptions={agentOptions}
        optionsLoading={optionsLoading}
        canManage={canAccessForm}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddCallCenterPage
