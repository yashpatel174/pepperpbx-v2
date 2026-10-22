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
import RingGroupForm from '../components/RingGroupForm'
import { createRingGroup, getHiveRingGroupDetails } from '../ring-group.service'
import { getDefaultRingGroupFormValues, ringGroupPaths } from '../ring-group.constants'
import useRingGroupOptions from '../useRingGroupOptions'
import useRingGroupPermissions from '../useRingGroupPermissions'
import type { RingGroupFormValues, RingGroupHiveDetails } from '../ring-group.types'

const ADD_FORM_ID = 'add-ring-group-form'

const AddRingGroupPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useRingGroupPermissions()

  const [hive, setHive] = useState<RingGroupHiveDetails | null>(null)
  const [initialValues, setInitialValues] = useState<Partial<RingGroupFormValues> | null>(null)
  const [formDomain, setFormDomain] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  // The Add form starts on the app's current domain (Axion: `localStorage['defaultDomain']`, falling
  // back to the server default, §15). Captured once — the bootstrap itself may seed the store.
  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)
  // Only the latest domain-change bootstrap may apply.
  const domainRequestRef = useRef(0)

  // Destination/Greeting/Ring Back options load on their own; a failure never blocks the form (§16/§18).
  const options = useRingGroupOptions(formDomain)

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hiveDetails = await getHiveRingGroupDetails(initialDomainRef.current)
      const requested = initialDomainRef.current
      const domain = requested && hiveDetails.domainOptions.includes(requested) ? requested : hiveDetails.defaultDomain
      setHive(hiveDetails)
      setFormDomain(domain)
      setInitialValues(getDefaultRingGroupFormValues(hiveDetails, domain))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load ring group settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const handleCancel = () => navigate(ringGroupPaths.list)

  // A confirmed domain change reloads that domain's bootstrap (autoExt + range) and options (§9).
  const handleDomainConfirmed = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setFormDomain(domainName)
    try {
      const hiveDetails = await getHiveRingGroupDetails(domainName)
      if (requestId === domainRequestRef.current) setHive(hiveDetails)
    } catch (err) {
      if (requestId === domainRequestRef.current) message.error(getApiErrorMessage(err, 'Failed to load the extension settings for this domain.'))
    }
  }

  const handleSubmit = async (values: RingGroupFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createRingGroup(values)
      message.success(`Ring group "${values.ring_group_name}" created successfully.`)
      // Add-only users go back to the list; everyone else lands on the new record's Edit page
      // (§3/§26). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? ringGroupPaths.list : ringGroupPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create ring group.'))
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
        title="Add Ring Group"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: PermissionGuard once backend permission contract is confirmed — ring-group.add (pbx_ringgroups_add). */}
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
        <RingGroupForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          destinationOptions={options.destinationOptions}
          timeoutDestinationOptions={options.timeoutDestinationOptions}
          greetingOptions={options.greetingOptions}
          ringBackOptions={options.ringBackOptions}
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

export default AddRingGroupPage
