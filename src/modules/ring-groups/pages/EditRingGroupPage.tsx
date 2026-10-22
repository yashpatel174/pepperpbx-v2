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
import RingGroupForm from '../components/RingGroupForm'
import { getHiveRingGroupDetails, getRingGroupById, updateRingGroup } from '../ring-group.service'
import { ringGroupPaths } from '../ring-group.constants'
import useRingGroupOptions from '../useRingGroupOptions'
import useRingGroupPermissions from '../useRingGroupPermissions'
import type { RingGroupDetails, RingGroupFormValues, RingGroupHiveDetails } from '../ring-group.types'

const EDIT_FORM_ID = 'edit-ring-group-form'

/**
 * Details already arrive normalized (real booleans, trimmed description, CID mode, the three newer
 * switches `?? false`). uuid/domain_name are server-owned.
 */
const toFormValues = (details: RingGroupDetails): RingGroupFormValues => ({
  ring_group_context: details.ring_group_context,
  ring_group_name: details.ring_group_name,
  ring_group_extension: details.ring_group_extension,
  ring_group_greeting: details.ring_group_greeting,
  ring_group_strategy: details.ring_group_strategy,
  ring_group_call_timeout: String(details.ring_group_call_timeout),
  caller_id_name: details.caller_id_name,
  ring_group_caller_id_number: details.ring_group_caller_id_number,
  ring_group_distinctive_ring: details.ring_group_distinctive_ring,
  ring_group_cid_prefix: details.ring_group_cid_prefix,
  ring_group_forward_cid_mode: details.ring_group_forward_cid_mode,
  ring_group_forward_cid_value: details.ring_group_forward_cid_value,
  ring_group_ringback: details.ring_group_ringback,
  ring_group_remote_announce: details.ring_group_remote_announce,
  ring_group_too_late_announce: details.ring_group_too_late_announce,
  ring_group_missed_call_app: details.ring_group_missed_call_app,
  ring_group_missed_call_data: details.ring_group_missed_call_data,
  ring_group_forward_destination: details.ring_group_forward_destination,
  ring_group_forward_enabled: details.ring_group_forward_enabled,
  ring_group_forward_toll_allow: details.ring_group_forward_toll_allow,
  ring_group_enabled: details.ring_group_enabled,
  ring_group_call_forward_enabled: details.ring_group_call_forward_enabled,
  ring_group_follow_me_enabled: details.ring_group_follow_me_enabled,
  skip_busy_agent: details.skip_busy_agent,
  enable_call_pickup: details.enable_call_pickup,
  call_recording_enabled: details.call_recording_enabled,
  ring_group_description: details.ring_group_description,
  ring_group_timeout_action: details.ring_group_timeout_action,
  ring_group_destinations: details.ring_group_destinations,
})

const EditRingGroupPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useRingGroupPermissions()
  const { ringGroupId } = useParams<{ ringGroupId: string }>()

  const [details, setDetails] = useState<RingGroupDetails | null>(null)
  const [hive, setHive] = useState<RingGroupHiveDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (§14).
  const canEditFields = canManageAll || canEdit

  // Options for the record's domain load on their own; the page never waits on them.
  const options = useRingGroupOptions(details?.domain_name)

  /** Record + bootstrap (for the record's own domain). Initial load and Retry. */
  const load = useCallback(async () => {
    if (!ringGroupId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getRingGroupById(ringGroupId)
      const hiveDetails = await getHiveRingGroupDetails(record.domain_name)
      setDetails(record)
      setHive(hiveDetails)
      setFormKey((key) => key + 1)
    } catch (err) {
      // An unknown id gets a record-scoped EmptyState; retrying it can't help.
      if (isNotFoundError(err)) setNotFound(true)
      else setError(getApiErrorMessage(err, 'Failed to load this ring group.'))
    } finally {
      setLoading(false)
    }
  }, [ringGroupId])

  useEffect(() => {
    if (!ringGroupId) {
      setLoading(false)
      return
    }
    load()
  }, [load, ringGroupId])

  const handleCancel = () => navigate(ringGroupPaths.list)

  const handleSubmit = async (values: RingGroupFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateRingGroup(details.ring_group_uuid, values)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update ring group.'))
      setSubmitting(false)
      return
    }
    message.success(`Ring group "${values.ring_group_name}" updated successfully.`)
    // Stay here and reload the saved record (§3/§19). The save already succeeded, so a failed
    // reload only warns and the form keeps the submitted values.
    try {
      const record = await getRingGroupById(details.ring_group_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'Ring group was saved, but reloading it failed.'))
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

  if (!ringGroupId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!ringGroupId ? 'No ring group was specified.' : 'Ring group not found.'}
        action={<Button onClick={handleCancel}>Back to Ring Groups</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Ring Group"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: PermissionGuard once backend permission contract is confirmed — ring-group.edit (pbx_ringgroups_edit). */}
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
        <RingGroupForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          destinationOptions={options.destinationOptions}
          timeoutDestinationOptions={options.timeoutDestinationOptions}
          greetingOptions={options.greetingOptions}
          ringBackOptions={options.ringBackOptions}
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

export default EditRingGroupPage
