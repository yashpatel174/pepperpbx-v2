import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import ConferenceCenterForm from '../components/ConferenceCenterForm'
import { createConferenceCenter, getGreetingOptions, getHiveUserDetails } from '../conference-center.service'
import { getDefaultConferenceCenterFormValues } from '../conference-center.constants'
import useConferenceCenterPermissions from '../useConferenceCenterPermissions'
import type { ConferenceCenterFormValues, GreetingOption, HiveUserConferenceDetails } from '../conference-center.types'

const ADD_FORM_ID = 'add-conference-center-form'
const LIST_PATH = '/conference-centers'

const AddConferenceCenterPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useConferenceCenterPermissions()

  const [hive, setHive] = useState<HiveUserConferenceDetails | null>(null)
  const [greetingOptions, setGreetingOptions] = useState<GreetingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // The confirmed domain whose hive/greetings failed to load. While set, `hive` still belongs to the
  // previous domain, so the form is locked (no editing, no submit) until Retry loads this domain.
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
    getHiveUserDetails(initialDomainRef.current)
      .then(async (hiveDetails) => {
        const greetings = await getGreetingOptions(hiveDetails.defaultDomain).catch(() => [])
        if (!active) return
        setHive(hiveDetails)
        setGreetingOptions(greetings)
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

  const handleCancel = () => navigate(LIST_PATH)

  /** Re-fetch the new domain's extension range / auto-extension / account code and its greetings (conference-centers.md §9). */
  const handleDomainConfirmed = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setOptionsLoading(true)
    setFailedDomain(null)
    try {
      const [hiveDetails, greetings] = await Promise.all([getHiveUserDetails(domainName), getGreetingOptions(domainName)])
      if (requestId !== domainRequestRef.current) return
      // A new `hive` is what makes the form apply this domain's auto-extension and account code.
      setHive(hiveDetails)
      setGreetingOptions(greetings)
    } catch {
      if (requestId === domainRequestRef.current) setFailedDomain(domainName)
    } finally {
      if (requestId === domainRequestRef.current) setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: ConferenceCenterFormValues) => {
    // Enter in a field can still submit; never create against the previous domain's range.
    if (failedDomain) return
    setSubmitting(true)
    try {
      const created = await createConferenceCenter(values)
      message.success('Conference center created successfully.')
      // Add-only users go back to the list; everyone else lands on the new record's Edit page
      // (conference-centers.md §3/§14). Unreachable until RBAC is populated, but ready for it.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? LIST_PATH : `${LIST_PATH}/${created.conference_center_uuid}/edit`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create conference center.')
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
        title="Add Conference Center"
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
          message={`Failed to load details for ${failedDomain}. Retry to continue with this domain.`}
          onRetry={() => handleDomainConfirmed(failedDomain)}
        />
      )}
      {canAccessForm ? (
        <ConferenceCenterForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={getDefaultConferenceCenterFormValues(hive)}
          hive={hive}
          greetingOptions={greetingOptions}
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

export default AddConferenceCenterPage
