import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import ConferenceRoomForm from '../components/ConferenceRoomForm'
import { createConferenceRoom, getConferenceCenterOptions, getHiveUserDetails, getProfileOptions } from '../conference-room.service'
import { conferenceRoomPaths, getDefaultConferenceRoomFormValues } from '../conference-room.constants'
import useConferenceRoomPermissions from '../useConferenceRoomPermissions'
import type { ConferenceCenterOption, ConferenceProfileOption, ConferenceRoomFormValues, HiveUserDetails } from '../conference-room.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const ADD_FORM_ID = 'add-conference-room-form'

/** Everything the form needs for one domain: its hive bootstrap plus that domain's centers and profiles (§3/§9). */
const loadDomainData = async (domainName?: string) => {
  const hive = await getHiveUserDetails(domainName)
  const [centers, profiles] = await Promise.all([getConferenceCenterOptions(hive.defaultDomain), getProfileOptions(hive.defaultDomain)])
  return { hive, centers, profiles }
}

const AddConferenceRoomPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useConferenceRoomPermissions()

  const [hive, setHive] = useState<HiveUserDetails | null>(null)
  const [conferenceCenterOptions, setConferenceCenterOptions] = useState<ConferenceCenterOption[]>([])
  const [profileOptions, setProfileOptions] = useState<ConferenceProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // The confirmed domain whose data failed to load. While set, the options still belong to the
  // previous domain, so the form is locked until Retry loads this domain.
  const [failedDomain, setFailedDomain] = useState<string | null>(null)

  const canAccessForm = canManageAll || canAdd

  // Start from the app's current domain; captured once so the hive call seeding an empty store
  // doesn't trigger a second bootstrap.
  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)
  // Only the latest domain change may apply its results.
  const domainRequestRef = useRef(0)

  useEffect(() => {
    let active = true
    loadDomainData(initialDomainRef.current)
      .then(({ hive: hiveDetails, centers, profiles }) => {
        if (!active) return
        setHive(hiveDetails)
        setConferenceCenterOptions(centers)
        setProfileOptions(profiles)
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

  const handleCancel = () => navigate(conferenceRoomPaths.list)

  const handleDomainConfirmed = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setOptionsLoading(true)
    setFailedDomain(null)
    try {
      const { hive: hiveDetails, centers, profiles } = await loadDomainData(domainName)
      if (requestId !== domainRequestRef.current) return
      // A new `hive` is what makes the form apply this domain's account code.
      setHive(hiveDetails)
      setConferenceCenterOptions(centers)
      setProfileOptions(profiles)
    } catch {
      if (requestId === domainRequestRef.current) setFailedDomain(domainName)
    } finally {
      if (requestId === domainRequestRef.current) setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: ConferenceRoomFormValues) => {
    if (failedDomain) return
    setSubmitting(true)
    try {
      const uuid = await createConferenceRoom(values)
      message.success(`Conference room "${values.conference_room_name}" created successfully.`)
      // Add-only users go back to the list; everyone else lands on the new room's Edit page
      // (conference-rooms.md §3/§14). Unreachable until RBAC is populated, but ready for it.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? conferenceRoomPaths.list : conferenceRoomPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create conference room.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate(0)} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Conference Room"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC is populated. */}
              {canAccessForm && (
                <Button type="primary" htmlType="submit" form={ADD_FORM_ID} loading={submitting} disabled={optionsLoading || !!failedDomain}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {failedDomain && (
        <ErrorState
          type="warning"
          message="Some data couldn't be loaded"
          description={`Failed to load details for ${failedDomain}. Retry to continue with this domain.`}
          onRetry={() => handleDomainConfirmed(failedDomain)}
        />
      )}
      {canAccessForm ? (
        <ConferenceRoomForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={getDefaultConferenceRoomFormValues(hive)}
          hive={hive}
          conferenceCenterOptions={conferenceCenterOptions}
          profileOptions={profileOptions}
          optionsLoading={optionsLoading}
          canManage={canAccessForm && !failedDomain}
          submitting={submitting}
          onDomainConfirmed={handleDomainConfirmed}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddConferenceRoomPage
