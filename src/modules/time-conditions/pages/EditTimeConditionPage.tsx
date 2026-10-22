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
import TimeConditionForm from '../components/TimeConditionForm'
import { getHiveTimeConditionDetails, getTimeConditionById, updateTimeCondition } from '../time-condition.service'
import { timeConditionPaths } from '../time-condition.constants'
import useTimeConditionOptions from '../useTimeConditionOptions'
import useTimeConditionPermissions from '../useTimeConditionPermissions'
import type { TimeConditionDetails, TimeConditionFormValues, TimeConditionHiveDetails } from '../time-condition.types'

const EDIT_FORM_ID = 'edit-time-condition-form'

/** Details already arrive form-shaped (the service maps the Time Group key, §27); uuid/default are server-owned. */
const toFormValues = (details: TimeConditionDetails): TimeConditionFormValues => ({
  domain_name: details.domain_name,
  time_condition_name: details.time_condition_name,
  time_condition_extension: details.time_condition_extension,
  time_condition_time_group_preset_uuid: details.time_condition_time_group_preset_uuid,
  time_match_action: details.time_match_action,
  time_not_match_action: details.time_not_match_action,
  enabled: details.enabled,
})

const EditTimeConditionPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useTimeConditionPermissions()
  const { timeConditionId } = useParams<{ timeConditionId: string }>()

  const [details, setDetails] = useState<TimeConditionDetails | null>(null)
  const [hive, setHive] = useState<TimeConditionHiveDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (§14/§25).
  const canEditFields = canManageAll || canEdit

  // Options for the record's domain load on their own; the page never waits on them (§16).
  const options = useTimeConditionOptions(details?.domain_name)

  /**
   * Record + bootstrap (for the record's own domain). Initial load and Retry. Unlike Axion, a record
   * missing data never leaves the page blank (§28): it's a form, an EmptyState or an ErrorState.
   */
  const load = useCallback(async () => {
    if (!timeConditionId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getTimeConditionById(timeConditionId)
      const hiveDetails = await getHiveTimeConditionDetails(record.domain_name)
      setDetails(record)
      setHive(hiveDetails)
      setFormKey((key) => key + 1)
    } catch (err) {
      // An unknown id gets a record-scoped EmptyState; retrying it can't help.
      if (isNotFoundError(err)) setNotFound(true)
      else setError(getApiErrorMessage(err, 'Failed to load this time condition.'))
    } finally {
      setLoading(false)
    }
  }, [timeConditionId])

  useEffect(() => {
    if (!timeConditionId) {
      setLoading(false)
      return
    }
    load()
  }, [load, timeConditionId])

  const handleCancel = () => navigate(timeConditionPaths.list)

  const handleSubmit = async (values: TimeConditionFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateTimeCondition(details.time_condition_uuid, values)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update time condition.'))
      setSubmitting(false)
      return
    }
    message.success(`Time condition "${values.time_condition_name}" updated successfully.`)
    // Stay here and reload the saved record (§3 Edit step 8). The save already succeeded, so a failed
    // reload only warns and the form keeps the submitted values.
    try {
      const record = await getTimeConditionById(details.time_condition_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'Time condition was saved, but reloading it failed.'))
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

  // System-default records are immutable from the UI (§26) — a direct link gets the same treatment.
  if (!timeConditionId || notFound || !details || !hive || details.default) {
    return (
      <EmptyState
        description={
          !timeConditionId
            ? 'No time condition was specified.'
            : details?.default
              ? 'This is a system default time condition and cannot be edited.'
              : 'Time condition not found.'
        }
        action={<Button onClick={handleCancel}>Back to Time Conditions</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Time Condition"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="timecondition.edit"> (pbx_timeconditions_edit) once RBAC is populated. */}
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
        <TimeConditionForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          timeGroupOptions={options.timeGroupOptions}
          destinationOptions={options.destinationOptions}
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

export default EditTimeConditionPage
