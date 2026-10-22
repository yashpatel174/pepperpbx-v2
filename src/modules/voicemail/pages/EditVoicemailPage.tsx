import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import VoicemailForm from '../components/VoicemailForm'
import {
  deleteVoicemailOptions,
  getHiveVoicemailDetails,
  getVoicemailDetails,
  getVoicemailLookups,
  updateVoicemail,
} from '../voicemail.service'
// import { voicemailChildPath } from '../voicemail.constants'
import useVoicemailPermissions from '../useVoicemailPermissions'
import type { HiveVoicemailDetails, VoicemailDetails, VoicemailFormValues, VoicemailLookups } from '../voicemail.types'

const EDIT_VOICEMAIL_FORM_ID = 'edit-voicemail-form'

const EditVoicemailPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useVoicemailPermissions()
  const { voicemailId } = useParams<{ voicemailId: string }>()

  const [hive, setHive] = useState<HiveVoicemailDetails | null>(null)
  const [lookups, setLookups] = useState<VoicemailLookups | null>(null)
  const [details, setDetails] = useState<VoicemailDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  // View-only users see a read-only form with no Save (voicemail.md §10).
  const canEditFields = canManageAll || canEdit
  const canAccessForm = canManageAll || canEdit || canView

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!voicemailId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const voicemailDetails = await getVoicemailDetails(voicemailId)
        // Always bootstrap for the record's OWN domain (see getHiveVoicemailDetails).
        const [hiveDetails, voicemailLookups] = await Promise.all([
          getHiveVoicemailDetails(voicemailDetails.domain_name),
          getVoicemailLookups(voicemailDetails.domain_name, voicemailDetails.voicemail_uuid),
        ])
        setDetails(voicemailDetails)
        setHive(hiveDetails)
        setLookups(voicemailLookups)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying can't help.
        if (isNotFoundError(err)) setNotFound(true)
        else setError('Failed to load this voicemail.')
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [voicemailId]
  )

  useEffect(() => {
    load(true)
  }, [load])

  const handleBack = () => navigate('/voicemail')

  const handleDeleteSavedOption = async (optionUuid: string) => {
    try {
      await deleteVoicemailOptions([optionUuid])
      message.success('Option deleted successfully.')
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete option.'))
      throw err
    }
  }

  const handleSubmit = async (values: VoicemailFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateVoicemail(details.voicemail_uuid, values)
      message.success(`Voicemail ${values.voicemail_id} updated successfully.`)
      // Update success does NOT navigate: the details are re-fetched and the same page repopulated
      // (voicemail.md §10).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update voicemail.'))
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

  if (notFound || !details || !hive || !lookups) {
    return <EmptyState description="Voicemail not found." action={<Button onClick={handleBack}>Back to Voicemail</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Voicemail"
        toolbar={
          <FormPageToolbar onBack={handleBack}>
            <Button onClick={handleBack} disabled={submitting}>
              Cancel
            </Button>
            {canEditFields && (
              <Button type="primary" htmlType="submit" form={EDIT_VOICEMAIL_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {canAccessForm ? (
        <VoicemailForm
          key={formKey}
          formId={EDIT_VOICEMAIL_FORM_ID}
          mode="edit"
          initialValues={details}
          hive={hive}
          lookups={lookups}
          canManage={canEditFields}
          canToggleDestination={canManageAll}
          submitting={submitting}
          onDeleteSavedOption={handleDeleteSavedOption}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditVoicemailPage
