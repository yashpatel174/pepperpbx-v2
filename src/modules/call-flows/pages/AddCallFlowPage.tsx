import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import { getApiErrorMessage } from '../../../services/api/apiError'
import CallFlowForm from '../components/CallFlowForm'
import { createCallFlow, getHiveCallFlowDetails } from '../call-flows.service'
import { callFlowPaths, getDefaultCallFlowFormValues } from '../call-flows.constants'
import useCallFlowOptions from '../useCallFlowOptions'
import useCallFlowPermissions from '../useCallFlowPermissions'
import type { CallFlowFormValues, CallFlowHiveDetails } from '../call-flows.types'

const ADD_FORM_ID = 'add-call-flow-form'

const AddCallFlowPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useCallFlowPermissions()

  const [hive, setHive] = useState<CallFlowHiveDetails | null>(null)
  const [initialValues, setInitialValues] = useState<Partial<CallFlowFormValues> | null>(null)
  const [formDomain, setFormDomain] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  // The Add form starts on the app's current domain (Axion: `localStorage['defaultDomain']`, falling
  // back to the server default, §3/§15). Captured once — the bootstrap itself may seed the store.
  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)
  // Only the latest domain-change bootstrap may apply.
  const domainRequestRef = useRef(0)

  // Destination/Sound options load on their own; a failure never blocks the form (§16/§18).
  const options = useCallFlowOptions(formDomain)

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hiveDetails = await getHiveCallFlowDetails(initialDomainRef.current)
      const requested = initialDomainRef.current
      const domain = requested && hiveDetails.domainOptions.includes(requested) ? requested : hiveDetails.defaultDomain
      setHive(hiveDetails)
      setFormDomain(domain)
      setInitialValues(getDefaultCallFlowFormValues(hiveDetails, domain))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load call flow settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const handleCancel = () => navigate(callFlowPaths.list)

  // A confirmed domain change reloads that domain's bootstrap (autoExt + range) and options (§9).
  const handleDomainConfirmed = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setFormDomain(domainName)
    try {
      const hiveDetails = await getHiveCallFlowDetails(domainName)
      if (requestId === domainRequestRef.current) setHive(hiveDetails)
    } catch (err) {
      if (requestId === domainRequestRef.current) message.error(getApiErrorMessage(err, 'Failed to load the extension settings for this domain.'))
    }
  }

  const handleSubmit = async (values: CallFlowFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createCallFlow(values)
      message.success('Call flow created successfully.')
      // Add-only users go back to the list; everyone else lands on the new record's Edit page
      // (§3). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? callFlowPaths.list : callFlowPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create call flow.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={bootstrap} />
  }

  if (loading || !hive || !initialValues) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Call Flow"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="callflow.add"> (pbx_callflow_add) once RBAC is populated. */}
              {canAccessForm && (
                <Button type="primary" htmlType="submit" form={ADD_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {canAccessForm ? (
        <CallFlowForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          destinationOptions={options.destinationOptions}
          soundOptions={options.soundOptions}
          optionsLoading={options.loading}
          optionsError={options.error}
          onRetryOptions={options.retry}
          canManage={canAccessForm}
          canUseCustomValues={canManageAll}
          submitting={submitting}
          onSubmit={handleSubmit}
          onDomainConfirmed={handleDomainConfirmed}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddCallFlowPage
