import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import AgentForm from '../components/AgentForm'
import { createCallCenterAgent, getCallCenterAgentContactOptions, getHiveCallCenterAgentDetails } from '../call-center-agents.service'
import { getDefaultCallCenterAgentFormValues } from '../call-center-agents.constants'
import useCallCenterAgentPermissions from '../useCallCenterAgentPermissions'
import type { CallCenterAgentFormValues, HiveCallCenterAgentDetails, SelectOption } from '../call-center-agents.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const ADD_AGENT_FORM_ID = 'add-call-center-agent-form'

const AddCallCenterAgentPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManage } = useCallCenterAgentPermissions()

  const [hive, setHive] = useState<HiveCallCenterAgentDetails | null>(null)
  const [contactOptions, setContactOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  // A failed domain-change refetch shows an inline Retry above the form.
  const [optionsError, setOptionsError] = useState<{ domain: string; message: string } | null>(null)

  useEffect(() => {
    let active = true
    getHiveCallCenterAgentDetails()
      .then(async (hiveDetails) => {
        if (!active) return
        setHive(hiveDetails)
        const contacts = await getCallCenterAgentContactOptions(hiveDetails.defaultDomain)
        if (!active) return
        setContactOptions(contacts)
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

  const handleCancel = () => navigate('/call-center/agents')

  // Matches the audit: once a domain change is dismissed, re-fetch Contact options for the newly
  // selected domain (call-center.md §13/§15).
  const handleDomainConfirmed = async (domainName: string) => {
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const contacts = await getCallCenterAgentContactOptions(domainName)
      setContactOptions(contacts)
    } catch (err) {
      setOptionsError({ domain: domainName, message: getApiErrorMessage(err, 'The options for the selected domain failed to load.') })
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: CallCenterAgentFormValues) => {
    setSubmitting(true)
    try {
      const created = await createCallCenterAgent(values)
      message.success(`Call center agent "${values.agent_name}" created successfully.`)
      // Matches the established cross-module convention (call-center.md §3/§19): Create success
      // navigates to Edit.
      navigate(`/call-center/agents/${created.call_center_agent_uuid}/edit`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create call center agent.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/call-center/agents')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Call Center Agent"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={ADD_AGENT_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {optionsError && (
        <ErrorState
          type="warning"
          message="Some data couldn't be loaded"
          description={optionsError.message}
          onRetry={() => handleDomainConfirmed(optionsError.domain)}
        />
      )}
      <AgentForm
        formId={ADD_AGENT_FORM_ID}
        mode="create"
        initialValues={getDefaultCallCenterAgentFormValues(hive)}
        hive={hive}
        contactOptions={contactOptions}
        optionsLoading={optionsLoading}
        canManage={canManage}
        onDomainConfirmed={handleDomainConfirmed}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddCallCenterAgentPage
