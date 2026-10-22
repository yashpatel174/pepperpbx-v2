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
import TimeGroupForm from '../components/TimeGroupForm'
import { createTimeGroup, getHiveTimeGroupDetails } from '../time-group.service'
import { getDefaultTimeGroupFormValues, timeGroupPaths } from '../time-group.constants'
import useTimeGroupPermissions from '../useTimeGroupPermissions'
import type { TimeGroupFormValues, TimeGroupHiveDetails } from '../time-group.types'

const ADD_FORM_ID = 'add-time-group-form'

const AddTimeGroupPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useTimeGroupPermissions()

  const [hive, setHive] = useState<TimeGroupHiveDetails | null>(null)
  const [initialValues, setInitialValues] = useState<TimeGroupFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  // The Add form starts on the app's current domain (Axion: `localStorage['defaultDomain']`, falling
  // back to the server default, §3 Create/§15). Captured once — the bootstrap itself may seed the store.
  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)

  /** Bootstrap (`module=TimeGroup`): domain options + default domain (§3 Create step 2). */
  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hiveDetails = await getHiveTimeGroupDetails(initialDomainRef.current)
      const requested = initialDomainRef.current
      const domain = requested && hiveDetails.domainOptions.includes(requested) ? requested : hiveDetails.defaultDomain
      setHive(hiveDetails)
      setInitialValues(getDefaultTimeGroupFormValues(domain))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load time group settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const handleCancel = () => navigate(timeGroupPaths.list)

  const handleSubmit = async (values: TimeGroupFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createTimeGroup(values)
      message.success(`Time group "${values.name}" created successfully.`)
      // Add-only users go back to the list; everyone else lands on the new record's Edit page
      // (§3 Create step 6). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? timeGroupPaths.list : timeGroupPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create time group.'))
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
        title="Add Time Group"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="timegroup.add"> (pbx_timeconditions_add) once RBAC is populated. */}
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
        <TimeGroupForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          canManage={canAccessForm}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddTimeGroupPage
