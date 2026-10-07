import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import CallFlowForm from '../components/CallFlowForm'
import { getCallFlowById, getHiveCallFlowDetails, updateCallFlow } from '../call-flows.service'
import { callFlowPaths } from '../call-flows.constants'
import useCallFlowOptions from '../useCallFlowOptions'
import useCallFlowPermissions from '../useCallFlowPermissions'
import type { CallFlowDetails, CallFlowFormValues, CallFlowHiveDetails } from '../call-flows.types'

const EDIT_FORM_ID = 'edit-call-flow-form'

/** Details already arrive normalized (real booleans, trimmed description). Context/uuids are server-owned. */
const toFormValues = (details: CallFlowDetails): CallFlowFormValues => ({
  domain_name: details.domain_name,
  call_flow_name: details.call_flow_name,
  call_flow_extension: details.call_flow_extension,
  call_flow_feature_code: details.call_flow_feature_code,
  call_flow_pin_number: details.call_flow_pin_number,
  call_flow_data: details.call_flow_data,
  call_flow_label: details.call_flow_label,
  call_flow_sound: details.call_flow_sound,
  call_flow_alternate_data: details.call_flow_alternate_data,
  call_flow_alternate_label: details.call_flow_alternate_label,
  call_flow_alternate_sound: details.call_flow_alternate_sound,
  call_flow_description: details.call_flow_description,
  call_flow_enabled: details.call_flow_enabled,
  call_flow_status: details.call_flow_status,
})

const EditCallFlowPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useCallFlowPermissions()
  const { callFlowId } = useParams<{ callFlowId: string }>()

  const [details, setDetails] = useState<CallFlowDetails | null>(null)
  const [hive, setHive] = useState<CallFlowHiveDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (§14/§25).
  const canEditFields = canManageAll || canEdit

  // Destination/Sound options for the record's domain load on their own. Unlike Axion, the page's
  // loading state never waits on them, so an options failure can't leave the form on a spinner (§16/§28).
  const options = useCallFlowOptions(details?.domain_name)

  /** Record + bootstrap (for the record's own domain). Initial load and Retry. */
  const load = useCallback(async () => {
    if (!callFlowId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getCallFlowById(callFlowId)
      const hiveDetails = await getHiveCallFlowDetails(record.domain_name)
      setDetails(record)
      setHive(hiveDetails)
      setFormKey((key) => key + 1)
    } catch (err) {
      // An unknown id gets a record-scoped EmptyState; retrying it can't help.
      if (isNotFoundError(err)) setNotFound(true)
      else setError(getApiErrorMessage(err, 'Failed to load this call flow.'))
    } finally {
      setLoading(false)
    }
  }, [callFlowId])

  useEffect(() => {
    if (!callFlowId) {
      setLoading(false)
      return
    }
    load()
  }, [load, callFlowId])

  const handleCancel = () => navigate(callFlowPaths.list)

  const handleSubmit = async (values: CallFlowFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateCallFlow(details.call_flow_uuid, values)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update call flow.'))
      setSubmitting(false)
      return
    }
    message.success(`Call flow "${values.call_flow_name}" updated successfully.`)
    // Stay here and reload the saved record (§3/§19). The save already succeeded, so a failed
    // reload only warns and the form keeps the submitted values.
    try {
      const record = await getCallFlowById(details.call_flow_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'Call flow was saved, but reloading it failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />
  }

  if (loading) {
    return <LoadingState rows={10} />
  }

  if (!callFlowId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!callFlowId ? 'No call flow was specified.' : 'Call flow not found.'}
        action={<Button onClick={handleCancel}>Back to Call Flows</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Call Flow"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="callflow.edit"> (pbx_callflow_edit) once RBAC is populated. */}
              {canEditFields && (
                <Button type="primary" htmlType="submit" form={EDIT_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {canAccessForm ? (
        <CallFlowForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          destinationOptions={options.destinationOptions}
          soundOptions={options.soundOptions}
          optionsLoading={options.loading}
          optionsError={options.error}
          onRetryOptions={options.retry}
          canManage={canEditFields}
          canUseCustomValues={canManageAll}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditCallFlowPage
