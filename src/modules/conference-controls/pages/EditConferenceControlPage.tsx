import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import ConferenceControlForm from '../components/ConferenceControlForm'
import { getConferenceControlById, updateConferenceControl } from '../conference-control.service'
import { conferenceControlPaths } from '../conference-control.constants'
import useConferenceControlPermissions from '../useConferenceControlPermissions'
import type { ConferenceControlDetails, ConferenceControlFormValues } from '../conference-control.types'

const EDIT_FORM_ID = 'edit-conference-control-form'

/** Details already arrive normalized (real booleans, numeric digits, trimmed description). */
const toFormValues = (details: ConferenceControlDetails): ConferenceControlFormValues => ({
  control_name: details.control_name,
  control_description: details.control_description,
  control_enabled: details.control_enabled,
  conference_control_details: details.conference_control_details,
})

const EditConferenceControlPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useConferenceControlPermissions()
  // `?conference_control_uuid=` — Axion's Edit URL shape (conference-controls.md §1/§3).
  const [searchParams] = useSearchParams()
  const conferenceControlUuid = searchParams.get('conference_control_uuid')

  const [details, setDetails] = useState<ConferenceControlDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (conference-controls.md §14/§25).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!conferenceControlUuid) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const record = await getConferenceControlById(conferenceControlUuid)
        setDetails(record)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this conference control.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [conferenceControlUuid]
  )

  useEffect(() => {
    if (!conferenceControlUuid) {
      setLoading(false)
      return
    }
    load(true)
  }, [load, conferenceControlUuid])

  const handleCancel = () => navigate(conferenceControlPaths.list)

  const handleSubmit = async (values: ConferenceControlFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateConferenceControl(details.conference_control_uuid, values)
      message.success(`Conference control "${values.control_name}" updated successfully.`)
      // Stay on this page and reload the server-confirmed record (conference-controls.md §3/§19).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update conference control.'))
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

  if (!conferenceControlUuid || notFound || !details) {
    return (
      <EmptyState
        description={!conferenceControlUuid ? 'No conference control was specified.' : 'Conference control not found.'}
        action={<Button onClick={handleCancel}>Back to Conference Controls</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Conference Control"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated. */}
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
        <ConferenceControlForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
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

export default EditConferenceControlPage
