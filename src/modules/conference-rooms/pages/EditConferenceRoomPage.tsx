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
import ConferenceRoomForm from '../components/ConferenceRoomForm'
import {
  getConferenceCenterOptions,
  getConferenceRoomById,
  getHiveUserDetails,
  getProfileOptions,
  updateConferenceRoom,
} from '../conference-room.service'
import { conferenceRoomPaths } from '../conference-room.constants'
import useConferenceRoomPermissions from '../useConferenceRoomPermissions'
import type {
  ConferenceCenterOption,
  ConferenceProfileOption,
  ConferenceRoomDetails,
  ConferenceRoomFormValues,
  HiveUserDetails,
} from '../conference-room.types'

const EDIT_FORM_ID = 'edit-conference-room-form'
const optionsErrorFallback = 'The conference center or profile options for this domain failed to load.'

/** Details already arrive normalized (real booleans, numeric max members, trimmed description). */
const toFormValues = (details: ConferenceRoomDetails): ConferenceRoomFormValues => ({ ...details })

const EditConferenceRoomPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useConferenceRoomPermissions()
  // `?conference_room_uuid=` — Axion's Edit URL shape (conference-rooms.md §1/§3).
  const [searchParams] = useSearchParams()
  const conferenceRoomUuid = searchParams.get('conference_room_uuid')

  const [details, setDetails] = useState<ConferenceRoomDetails | null>(null)
  const [hive, setHive] = useState<HiveUserDetails | null>(null)
  const [conferenceCenterOptions, setConferenceCenterOptions] = useState<ConferenceCenterOption[]>([])
  const [profileOptions, setProfileOptions] = useState<ConferenceProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users get a read-only form and no Save (conference-rooms.md §14/§25).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!conferenceRoomUuid) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      setOptionsError(null)
      try {
        const record = await getConferenceRoomById(conferenceRoomUuid)
        // Option lists fail on their own: an inline Retry is shown instead of blocking the form.
        const onOptionsError = (err: unknown) => {
          setOptionsError(getApiErrorMessage(err, optionsErrorFallback))
          return []
        }
        // Bootstrap with the record's own domain (Axion calls it with no domain on Edit).
        const [hiveDetails, centers, profiles] = await Promise.all([
          getHiveUserDetails(record.domain_name),
          getConferenceCenterOptions(record.domain_name).catch(onOptionsError),
          getProfileOptions(record.domain_name).catch(onOptionsError),
        ])
        setDetails(record)
        setHive(hiveDetails)
        setConferenceCenterOptions(centers)
        setProfileOptions(profiles)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this conference room.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [conferenceRoomUuid]
  )

  useEffect(() => {
    if (!conferenceRoomUuid) {
      setLoading(false)
      return
    }
    load(true)
  }, [load, conferenceRoomUuid])

  const handleCancel = () => navigate(conferenceRoomPaths.list)

  const retryOptions = async () => {
    if (!details) return
    setOptionsError(null)
    try {
      const [centers, profiles] = await Promise.all([
        getConferenceCenterOptions(details.domain_name),
        getProfileOptions(details.domain_name),
      ])
      setConferenceCenterOptions(centers)
      setProfileOptions(profiles)
    } catch (err) {
      setOptionsError(getApiErrorMessage(err, optionsErrorFallback))
    }
  }

  const handleSubmit = async (values: ConferenceRoomFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateConferenceRoom(details.conference_room_uuid, values)
      message.success(`Conference room "${values.conference_room_name}" updated successfully.`)
      // Stay on this page and reload the server-confirmed record (conference-rooms.md §3/§19).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update conference room.'))
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

  if (!conferenceRoomUuid || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!conferenceRoomUuid ? 'No conference room was specified.' : 'Conference room not found.'}
        action={<Button onClick={handleCancel}>Back to Conference Rooms</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Conference Room"
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
      {optionsError && (
        <ErrorState type="warning" message="Some data couldn't be loaded" description={optionsError} onRetry={retryOptions} />
      )}
      {canAccessForm ? (
        <ConferenceRoomForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
          conferenceCenterOptions={conferenceCenterOptions}
          profileOptions={profileOptions}
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

export default EditConferenceRoomPage
