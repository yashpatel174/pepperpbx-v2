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
import ConferenceProfileForm from '../components/ConferenceProfileForm'
import { getConferenceProfileById, updateConferenceProfile } from '../conference-profile.service'
import { conferenceProfilePaths } from '../conference-profile.constants'
import useConferenceProfilePermissions from '../useConferenceProfilePermissions'
import type { ConferenceProfileDetails, ConferenceProfileFormValues } from '../conference-profile.types'

const EDIT_FORM_ID = 'edit-conference-profile-form'

/** Details already arrive normalized (real booleans, trimmed description — §3 Edit / §27). */
const toFormValues = (details: ConferenceProfileDetails): ConferenceProfileFormValues => ({
  profile_name: details.profile_name,
  profile_description: details.profile_description,
  profile_enabled: details.profile_enabled,
  conference_profile_params: details.conference_profile_params,
})

const EditConferenceProfilePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useConferenceProfilePermissions()
  // `?conference_profile_uuid=` — Axion's Edit URL shape (conference-profiles.md §1/§3).
  const [searchParams] = useSearchParams()
  const conferenceProfileUuid = searchParams.get('conference_profile_uuid')

  const [details, setDetails] = useState<ConferenceProfileDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (conference-profiles.md §14/§25).
  const canEditFields = canManageAll || canEdit

  /** Initial load and Retry — a failure here replaces the page with ErrorState / EmptyState. */
  const load = useCallback(async () => {
    if (!conferenceProfileUuid) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getConferenceProfileById(conferenceProfileUuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      // An unknown id gets a record-scoped EmptyState; retrying it can't help.
      if (isNotFoundError(err)) {
        setNotFound(true)
      } else {
        setError('Failed to load this conference profile.')
      }
    } finally {
      setLoading(false)
    }
  }, [conferenceProfileUuid])

  useEffect(() => {
    if (!conferenceProfileUuid) {
      setLoading(false)
      return
    }
    load()
  }, [load, conferenceProfileUuid])

  const handleCancel = () => navigate(conferenceProfilePaths.list)

  const handleSubmit = async (values: ConferenceProfileFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateConferenceProfile(details.conference_profile_uuid, values)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update conference profile.'))
      setSubmitting(false)
      return
    }
    message.success(`Conference profile "${values.profile_name}" updated successfully.`)
    // Stay on this page and reload the server-confirmed record (conference-profiles.md §3/§19). The
    // save already succeeded, so a failed refresh only warns: the form stays mounted with the
    // submitted values instead of being replaced by ErrorState.
    try {
      const record = await getConferenceProfileById(details.conference_profile_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'Conference profile was saved, but reloading it failed.'))
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

  if (!conferenceProfileUuid || notFound || !details) {
    return (
      <EmptyState
        description={!conferenceProfileUuid ? 'No conference profile was specified.' : 'Conference profile not found.'}
        action={<Button onClick={handleCancel}>Back to Conference Profiles</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Conference Profile"
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
        <ConferenceProfileForm
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

export default EditConferenceProfilePage
