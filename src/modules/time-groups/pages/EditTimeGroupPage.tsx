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
import TimeGroupForm from '../components/TimeGroupForm'
import { getHiveTimeGroupDetails, getTimeGroupById, updateTimeGroup } from '../time-group.service'
import { timeGroupPaths } from '../time-group.constants'
import useTimeGroupPermissions from '../useTimeGroupPermissions'
import type { TimeGroupDetails, TimeGroupFormValues, TimeGroupHiveDetails } from '../time-group.types'

const EDIT_FORM_ID = 'edit-time-group-form'

/** Details already arrive form-shaped (the service maps the API's flag shape, §27); uuid/enabled are server-owned. */
const toFormValues = (details: TimeGroupDetails): TimeGroupFormValues => ({
  name: details.name,
  domain_name: details.domain_name,
  order: details.order,
  context: details.context,
  description: details.description,
  groups: details.groups,
})

const EditTimeGroupPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useTimeGroupPermissions()
  const { timeGroupId } = useParams<{ timeGroupId: string }>()

  const [details, setDetails] = useState<TimeGroupDetails | null>(null)
  const [hive, setHive] = useState<TimeGroupHiveDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (§14/§25).
  const canEditFields = canManageAll || canEdit

  /**
   * Record + bootstrap (for the record's own domain). Initial load and Retry. Axion redirects to the
   * list when details fail (§3 Edit step 5); PepperPBX shows an EmptyState (unknown id) or an
   * ErrorState with Retry instead, never a blank form.
   */
  const load = useCallback(async () => {
    if (!timeGroupId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getTimeGroupById(timeGroupId)
      const hiveDetails = await getHiveTimeGroupDetails(record.domain_name)
      setDetails(record)
      setHive(hiveDetails)
      setFormKey((key) => key + 1)
    } catch (err) {
      if (isNotFoundError(err)) setNotFound(true)
      else setError(getApiErrorMessage(err, 'Failed to load this time group.'))
    } finally {
      setLoading(false)
    }
  }, [timeGroupId])

  useEffect(() => {
    if (!timeGroupId) {
      setLoading(false)
      return
    }
    load()
  }, [load, timeGroupId])

  const handleCancel = () => navigate(timeGroupPaths.list)

  const handleSubmit = async (values: TimeGroupFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateTimeGroup(details.dialplan_uuid, values)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update time group.'))
      setSubmitting(false)
      return
    }
    message.success(`Time group "${values.name}" updated successfully.`)
    // Stay here and reload the saved record (§3 Edit step 4). The save already succeeded, so a failed
    // reload only warns and the form keeps the submitted values.
    try {
      const record = await getTimeGroupById(details.dialplan_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'Time group was saved, but reloading it failed.'))
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

  if (!timeGroupId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!timeGroupId ? 'No time group was specified.' : 'Time group not found.'}
        action={<Button onClick={handleCancel}>Back to Time Groups</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Time Group"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="timegroup.edit"> (pbx_timeconditions_edit) once RBAC is populated. */}
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
        <TimeGroupForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          canManage={canEditFields}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditTimeGroupPage
