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
import TimeConditionForm from '../components/TimeConditionForm'
import { createTimeCondition, getHiveTimeConditionDetails } from '../time-condition.service'
import { getDefaultTimeConditionFormValues, timeConditionPaths } from '../time-condition.constants'
import useTimeConditionOptions from '../useTimeConditionOptions'
import useTimeConditionPermissions from '../useTimeConditionPermissions'
import type { TimeConditionFormValues, TimeConditionHiveDetails } from '../time-condition.types'

const ADD_FORM_ID = 'add-time-condition-form'

const AddTimeConditionPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useTimeConditionPermissions()

  const [hive, setHive] = useState<TimeConditionHiveDetails | null>(null)
  const [initialValues, setInitialValues] = useState<Partial<TimeConditionFormValues> | null>(null)
  const [formDomain, setFormDomain] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Add access is `add` or `all`, never `view` alone (§14/§28).
  const canAccessForm = canManageAll || canAdd

  // The Add form starts on the app's current domain (Axion: `localStorage['defaultDomain']`, falling
  // back to the server default, §3/§26). Captured once — the bootstrap itself may seed the store.
  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)
  // Only the latest domain-change bootstrap may apply.
  const domainRequestRef = useRef(0)

  // Time Group + destination options load on their own; a failure never blocks the form.
  const options = useTimeConditionOptions(formDomain)

  /** Bootstrap (`module=TimeCondition`): domains, autoExt, extension range, default domain (§3 Create). */
  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hiveDetails = await getHiveTimeConditionDetails(initialDomainRef.current)
      const requested = initialDomainRef.current
      const domain = requested && hiveDetails.domainOptions.includes(requested) ? requested : hiveDetails.defaultDomain
      setHive(hiveDetails)
      setFormDomain(domain)
      setInitialValues(getDefaultTimeConditionFormValues(hiveDetails, domain))
    } catch (err) {
      // Axion shows the form with empty defaults on a failed bootstrap (§16); PepperPBX shows Retry.
      setError(getApiErrorMessage(err, 'Failed to load time condition settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const handleCancel = () => navigate(timeConditionPaths.list)

  // A confirmed domain change reloads that domain's bootstrap (autoExt + range) and options (§9/§15).
  const handleDomainConfirmed = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setFormDomain(domainName)
    try {
      const hiveDetails = await getHiveTimeConditionDetails(domainName)
      if (requestId === domainRequestRef.current) setHive(hiveDetails)
    } catch (err) {
      if (requestId === domainRequestRef.current) {
        message.error(getApiErrorMessage(err, 'Failed to load the extension settings for this domain.'))
      }
    }
  }

  const handleSubmit = async (values: TimeConditionFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createTimeCondition(values)
      message.success(`Time condition "${values.time_condition_name}" created successfully.`)
      // Add-only users go back to the list; everyone else lands on the new record's Edit page
      // (§3 Create step 8). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? timeConditionPaths.list : timeConditionPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create time condition.'))
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
        title="Add Time Condition"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="timecondition.add"> (pbx_timeconditions_add) once RBAC is populated. */}
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
        <TimeConditionForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          timeGroupOptions={options.timeGroupOptions}
          destinationOptions={options.destinationOptions}
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

export default AddTimeConditionPage
