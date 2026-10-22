import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import ConferenceForm from '../components/ConferenceForm'
import { createConference, getHiveConferenceDetails, getProfileOptions } from '../conference.service'
import { getDefaultConferenceFormValues } from '../conference.constants'
import useConferencePermissions from '../useConferencePermissions'
import type { ConferenceFormValues, ConferenceHiveDetails, ConferenceProfileOption } from '../conference.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const ADD_CONFERENCE_FORM_ID = 'add-conference-form'

const AddConferencePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useConferencePermissions()

  const [hive, setHive] = useState<ConferenceHiveDetails | null>(null)
  const [profileOptions, setProfileOptions] = useState<ConferenceProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  // A failed domain-change refetch shows an inline Retry above the form.
  const [optionsError, setOptionsError] = useState<{ domain: string; message: string } | null>(null)

  const canAccessForm = canManageAll || canAdd

  // The Add form initializes from the app's currently selected domain; with no current domain
  // yet, getHiveConferenceDetails() keeps its existing default-domain fallback. Captured once at
  // mount — the hive call itself seeds an empty store, which must not trigger a second bootstrap.
  const currentDomain = useCurrentDomain()
  const initialDomainNameRef = useRef(currentDomain?.name)
  // Only the latest domain-change request may apply its hive — a slower response for a
  // previously selected domain must never overwrite the newer domain's values.
  const domainRequestIdRef = useRef(0)

  useEffect(() => {
    let active = true
    Promise.all([getHiveConferenceDetails(initialDomainNameRef.current), getProfileOptions()])
      .then(([hiveDetails, options]) => {
        if (!active) return
        setHive(hiveDetails)
        setProfileOptions(options)
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

  const handleCancel = () => navigate('/conferences')

  // Matches the audit: once a domain change is dismissed, re-fetch the hive bootstrap (extension
  // range/auto-extension) for the newly selected domain (conferences.md §9).
  const handleDomainConfirmed = async (domainName: string) => {
    const requestId = ++domainRequestIdRef.current
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const hiveDetails = await getHiveConferenceDetails(domainName)
      if (requestId !== domainRequestIdRef.current) return
      setHive(hiveDetails)
    } catch (err) {
      if (requestId !== domainRequestIdRef.current) return
      setOptionsError({ domain: domainName, message: getApiErrorMessage(err, 'The options for the selected domain failed to load.') })
    } finally {
      if (requestId === domainRequestIdRef.current) setOptionsLoading(false)
    }
  }

  const handleSubmit = async (values: ConferenceFormValues) => {
    setSubmitting(true)
    try {
      const created = await createConference(values)
      message.success(`Conference "${values.conference_name}" created successfully.`)
      // Matches the audit exactly (conferences.md §3/§14/§19/§33): Create success navigates to
      // Edit — UNLESS the user has only the Add permission (no view/edit/all), in which case it
      // navigates to the List instead, so an add-only user is never sent to an Edit page they
      // can't access. With RBAC still foundation-only (empty store = everything granted), this
      // "only add" branch is currently unreachable in practice, but the logic is correct and ready
      // for when real granular permissions arrive.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? '/conferences' : `/conferences/${created.conference_uuid}/edit`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create conference.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/conferences')} />
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Conference"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canAccessForm && (
              <Button type="primary" htmlType="submit" form={ADD_CONFERENCE_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {optionsError && (
        <ErrorState
          type="warning"
          message="Some data couldn't be loaded"
          description={optionsError.message}
          onRetry={() => handleDomainConfirmed(optionsError.domain)}
        />
      )}
      {canAccessForm ? (
        <ConferenceForm
          formId={ADD_CONFERENCE_FORM_ID}
          mode="create"
          initialValues={getDefaultConferenceFormValues(hive)}
          hive={hive}
          profileOptions={profileOptions}
          optionsLoading={optionsLoading}
          canManage={canAccessForm}
          onDomainConfirmed={handleDomainConfirmed}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddConferencePage
