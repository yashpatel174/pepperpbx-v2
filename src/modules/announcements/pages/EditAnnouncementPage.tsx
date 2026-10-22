import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import AnnouncementForm from '../components/AnnouncementForm'
import {
  getAnnouncementDetails,
  getExecuteActionOptions,
  getHiveAnnouncementDetails,
  getPlayActionOptions,
  updateAnnouncement,
} from '../announcement.service'
import useAnnouncementPermissions from '../useAnnouncementPermissions'
import type { ActionOptionGroup, AnnouncementDetails, AnnouncementFormValues, HiveAnnouncementDetails } from '../announcement.types'

const EDIT_ANNOUNCEMENT_FORM_ID = 'edit-announcement-form'

/** Maps the stored/API details back into the form model — a straight passthrough (one shared shape). */
const toFormValues = (details: AnnouncementDetails): AnnouncementFormValues => ({ ...details })

const EditAnnouncementPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canUseFreeText } = useAnnouncementPermissions()
  const { announcementId } = useParams<{ announcementId: string }>()

  const [hive, setHive] = useState<HiveAnnouncementDetails | null>(null)
  const [playOptions, setPlayOptions] = useState<ActionOptionGroup[]>([])
  const [executeOptions, setExecuteOptions] = useState<ActionOptionGroup[]>([])
  const [details, setDetails] = useState<AnnouncementDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)

  // View-only users see the form but can't submit changes — matches the audit's
  // `disabledFieldsBasic` (announcements.md §14/§25/§33).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!announcementId) return
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const announcementDetails = await getAnnouncementDetails(announcementId)
        // Always supply the record's own domain here — matches the fix already established for
        // Gateways'/Outbound Routes' Edit screens (the Axion reference has a confirmed bug of
        // calling hive bootstrap with no domain at all on some Edit screens).
        const [hiveDetails, play, execute] = await Promise.all([
          getHiveAnnouncementDetails(announcementDetails.domain_name),
          getPlayActionOptions(announcementDetails.domain_name),
          getExecuteActionOptions(announcementDetails.domain_name),
        ])
        setDetails(announcementDetails)
        setHive(hiveDetails)
        setPlayOptions(play)
        setExecuteOptions(execute)
        setFormKey((key) => key + 1)
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setError('Failed to load this announcement.')
        }
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [announcementId]
  )

  useEffect(() => {
    // Matches the audit: a missing announcement id redirects straight back to the List
    // (announcements.md §3's Edit flow, step 1).
    if (!announcementId) {
      navigate('/announcements')
      return
    }
    load(true)
  }, [load, announcementId, navigate])

  const handleCancel = () => navigate('/announcements')

  const handleSubmit = async (values: AnnouncementFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      const updated = await updateAnnouncement(details.phrase_uuid, values)
      message.success(`Announcement "${updated.phrase_name}" updated successfully.`)
      // Matches the audit exactly: Update success does NOT navigate away — it re-fetches details
      // and re-populates the same Edit page in place (announcements.md §3/§19), unlike Outbound
      // Routes'/Destinations' "navigate back to List" convention.
      await load(false)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update announcement.'))
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

  if (notFound || !details || !hive) {
    return (
      <EmptyState description="Announcement not found." action={<Button onClick={handleCancel}>Back to Announcements</Button>} />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Announcement"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {/* View-only users get a read-only form with no Save at all. */}
            {canEditFields && (
              <Button type="primary" htmlType="submit" form={EDIT_ANNOUNCEMENT_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <AnnouncementForm
        key={formKey}
        formId={EDIT_ANNOUNCEMENT_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        hive={hive}
        playOptions={playOptions}
        executeOptions={executeOptions}
        canManage={canEditFields}
        canUseFreeText={canUseFreeText}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default EditAnnouncementPage
