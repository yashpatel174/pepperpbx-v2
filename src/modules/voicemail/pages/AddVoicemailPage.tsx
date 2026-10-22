import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import VoicemailForm from '../components/VoicemailForm'
import { createVoicemail, deleteVoicemailOptions, getHiveVoicemailDetails, getVoicemailLookups } from '../voicemail.service'
import { getDefaultVoicemailFormValues } from '../voicemail.constants'
import useVoicemailPermissions from '../useVoicemailPermissions'
import useCurrentDomain from '../../../hooks/useCurrentDomain'
import type { HiveVoicemailDetails, VoicemailFormValues, VoicemailLookups } from '../voicemail.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

const ADD_VOICEMAIL_FORM_ID = 'add-voicemail-form'

const AddVoicemailPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useVoicemailPermissions()

  const [hive, setHive] = useState<HiveVoicemailDetails | null>(null)
  const [lookups, setLookups] = useState<VoicemailLookups | null>(null)
  const [initialValues, setInitialValues] = useState<VoicemailFormValues | null>(null)
  // Bumped on every re-bootstrap so the form remounts with fresh defaults (voicemail.md §8 step 6).
  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState<{ domain: string; message: string } | null>(null)
  const domainRequestRef = useRef(0)

  const canAccessForm = canManageAll || canAdd

  // Add starts in the domain the list is currently scoped to (the global current domain), so the new
  // voicemail is created where the user is working and shows up in the list. Captured once: later
  // domain changes inside the form are handled by handleDomainChange. When no current domain is set
  // yet, the bootstrap's own default domain is used, as before.
  const currentDomainName = useCurrentDomain()?.name
  const initialDomainRef = useRef(currentDomainName)

  useEffect(() => {
    let active = true
    const startDomain = initialDomainRef.current
    getHiveVoicemailDetails(startDomain)
      .then(async (hiveDetails) => {
        const domainName = startDomain ?? hiveDetails.defaultDomain
        const initialLookups = await getVoicemailLookups(domainName)
        if (!active) return
        setHive(hiveDetails)
        setLookups(initialLookups)
        setInitialValues({ ...getDefaultVoicemailFormValues(hiveDetails), domain_name: domainName })
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

  const handleCancel = () => navigate('/voicemail')

  /**
   * Domain change (voicemail.md §8/§18): re-bootstrap for the new domain — new autoExt, ranges and
   * lookups — and reset the whole form to defaults for it, which also clears every option destination.
   */
  const handleDomainChange = async (domainName: string) => {
    const requestId = ++domainRequestRef.current
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const [nextHive, nextLookups] = await Promise.all([getHiveVoicemailDetails(domainName), getVoicemailLookups(domainName)])
      if (requestId !== domainRequestRef.current) return
      setHive(nextHive)
      setLookups(nextLookups)
      setInitialValues({ ...getDefaultVoicemailFormValues(nextHive), domain_name: domainName })
      setFormKey((key) => key + 1)
    } catch (err) {
      if (requestId !== domainRequestRef.current) return
      setOptionsError({ domain: domainName, message: getApiErrorMessage(err, 'The options for the selected domain failed to load.') })
    } finally {
      if (requestId === domainRequestRef.current) setOptionsLoading(false)
    }
  }

  // Add rows have no saved option uuid, so this is never reached in practice — kept for the shared form contract.
  const handleDeleteSavedOption = async (optionUuid: string) => {
    await deleteVoicemailOptions([optionUuid])
  }

  const handleSubmit = async (values: VoicemailFormValues) => {
    setSubmitting(true)
    try {
      const created = await createVoicemail(values)
      message.success(`Voicemail ${values.voicemail_id} created successfully.`)
      // Create success opens Edit — unless the user holds only the Add permission, who couldn't
      // open Edit and goes to the list instead (voicemail.md §8). With RBAC foundation-only (empty
      // store = everything granted) that branch is currently unreachable, but the logic is ready.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? '/voicemail' : `/voicemail/${created.voicemail_uuid}/edit`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create voicemail.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/voicemail')} />
  }

  if (loading || !hive || !lookups || !initialValues) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Voicemail"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canAccessForm && (
              <Button type="primary" htmlType="submit" form={ADD_VOICEMAIL_FORM_ID} loading={submitting}>
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
          onRetry={() => handleDomainChange(optionsError.domain)}
        />
      )}
      {canAccessForm ? (
        <VoicemailForm
          key={formKey}
          formId={ADD_VOICEMAIL_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          lookups={lookups}
          optionsLoading={optionsLoading}
          canManage={canAccessForm}
          canToggleDestination={canManageAll}
          submitting={submitting}
          onDomainChange={handleDomainChange}
          onDeleteSavedOption={handleDeleteSavedOption}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddVoicemailPage
