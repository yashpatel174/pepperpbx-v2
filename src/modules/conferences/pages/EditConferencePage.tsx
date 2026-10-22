import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ConferenceForm from '../components/ConferenceForm'
import { getConferenceById, getHiveConferenceDetails, getProfileOptions, updateConference } from '../conference.service'
import useConferencePermissions from '../useConferencePermissions'
import type { ConferenceDetails, ConferenceFormValues, ConferenceHiveDetails, ConferenceProfileOption } from '../conference.types'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'

const EDIT_CONFERENCE_FORM_ID = 'edit-conference-form'

/** Maps the stored/API details back into the form model — a straight passthrough (one shared shape). */
const toFormValues = (details: ConferenceDetails): ConferenceFormValues => ({ ...details })

const EditConferencePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useConferencePermissions()
  const { conferenceId } = useParams<{ conferenceId: string }>()

  const [hive, setHive] = useState<ConferenceHiveDetails | null>(null)
  const [profileOptions, setProfileOptions] = useState<ConferenceProfileOption[]>([])
  const [details, setDetails] = useState<ConferenceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users see the form but can't submit changes — matches the audit's
  // `disabledFieldsBasic` (conferences.md §14/§25/§33).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!conferenceId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const conferenceDetails = await getConferenceById(conferenceId)
        // Always supply the record's own domain here — matches the fix already established for
        // every other module's Edit screen (and deliberately does not reproduce the audit's own
        // "getHiveUserDetails with no domain filter" pattern documented for Edit, conferences.md
        // §3/§28).
        const [hiveDetails, options] = await Promise.all([
          getHiveConferenceDetails(conferenceDetails.domain_name),
          getProfileOptions(),
        ])
        setDetails(conferenceDetails)
        setHive(hiveDetails)
        setProfileOptions(options)
        setFormKey((key) => key + 1)
      } catch (err) {
        // getConferenceById rejects with a 404 when the id doesn't match any record — distinguished
        // from a genuine fetch failure so the page can show a record-scoped EmptyState instead of
        // an ErrorState+retry (retrying a bad id can't help).
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this conference.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [conferenceId]
  )

  useEffect(() => {
    // Deliberately does NOT redirect away when conferenceId is missing (unlike the audit's own
    // documented Axion behavior, conferences.md §3: "if the param is missing, immediately redirects
    // to List") — render loop below falls through to a record-scoped EmptyState instead, matching
    // README's own Add/Edit convention and every other module's Edit page in this codebase.
    if (!conferenceId) {
      setLoading(false)
      return
    }
    load(true)
  }, [load, conferenceId])

  const handleCancel = () => navigate('/conferences')

  const handleSubmit = async (values: ConferenceFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateConference(details.conference_uuid, values)
      message.success(`Conference "${values.conference_name}" updated successfully.`)
      // Matches the audit exactly: Update success does NOT navigate away — it re-fetches details
      // and re-populates the same Edit page in place (conferences.md §3/§19).
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update conference.'))
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

  if (!conferenceId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!conferenceId ? 'No conference was specified.' : 'Conference not found.'}
        action={<Button onClick={handleCancel}>Back to Conferences</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Conference"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {/* View-only users get a read-only form with no Save at all (conferences.md §25). */}
            {canEditFields && (
              <Button type="primary" htmlType="submit" form={EDIT_CONFERENCE_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {canAccessForm ? (
        <ConferenceForm
          key={formKey}
          formId={EDIT_CONFERENCE_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
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

export default EditConferencePage
