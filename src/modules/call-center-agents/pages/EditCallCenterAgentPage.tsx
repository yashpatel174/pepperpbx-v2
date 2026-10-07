import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import AgentForm from '../components/AgentForm'
import { getCallCenterAgentContactOptions, getCallCenterAgentDetails, getHiveCallCenterAgentDetails, updateCallCenterAgent } from '../call-center-agents.service'
import useCallCenterAgentPermissions from '../useCallCenterAgentPermissions'
import { isNotFoundError } from '../../../services/api/apiError'
import type { CallCenterAgentDetails, CallCenterAgentFormValues, HiveCallCenterAgentDetails, SelectOption } from '../call-center-agents.types'

const EDIT_AGENT_FORM_ID = 'edit-call-center-agent-form'

/** Maps the stored/API details back into the form model — a straight passthrough (one shared shape). */
const toFormValues = (details: CallCenterAgentDetails): CallCenterAgentFormValues => ({ ...details })

const EditCallCenterAgentPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManage } = useCallCenterAgentPermissions()
  const { agentId } = useParams<{ agentId: string }>()

  const [hive, setHive] = useState<HiveCallCenterAgentDetails | null>(null)
  const [contactOptions, setContactOptions] = useState<SelectOption[]>([])
  const [details, setDetails] = useState<CallCenterAgentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!agentId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const agentDetails = await getCallCenterAgentDetails(agentId)
        // Always supply the record's own domain here — matches the fix already established for
        // every other module's Edit screen.
        const [hiveDetails, contacts] = await Promise.all([
          getHiveCallCenterAgentDetails(agentDetails.domain_name),
          getCallCenterAgentContactOptions(agentDetails.domain_name),
        ])
        setDetails(agentDetails)
        setHive(hiveDetails)
        setContactOptions(contacts)
        setFormKey((key) => key + 1)
      } catch (err) {
        // A 404 (unknown id) is distinguished from a genuine fetch failure so the page can show a
        // record-scoped EmptyState instead of an ErrorState+retry (retrying a bad id can't help).
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this call center agent.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [agentId]
  )

  useEffect(() => {
    // Deliberately does NOT redirect away when agentId is missing (unlike Axion's silent
    // redirect-to-list) — render loop below falls through to a record-scoped EmptyState instead.
    if (!agentId) {
      setLoading(false)
      return
    }
    load(true)
  }, [load, agentId])

  const handleCancel = () => navigate('/call-center/agents')

  const handleSubmit = async (values: CallCenterAgentFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateCallCenterAgent(details.call_center_agent_uuid, values)
      message.success('Call center agent updated successfully.')
      // Matches the established cross-module convention (call-center.md §3/§19): Update success
      // re-fetches details and re-populates the same Edit page in place, no navigation.
      await load(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update call center agent.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load(true)} />
  }

  if (loading) {
    return <LoadingState rows={10} />
  }

  if (!agentId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!agentId ? 'No call center agent was specified.' : 'Call center agent not found.'}
        action={<Button onClick={handleCancel}>Back to Call Center Agents</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Call Center Agent"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={EDIT_AGENT_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <AgentForm
        key={formKey}
        formId={EDIT_AGENT_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        hive={hive}
        contactOptions={contactOptions}
        canManage={canManage}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default EditCallCenterAgentPage
