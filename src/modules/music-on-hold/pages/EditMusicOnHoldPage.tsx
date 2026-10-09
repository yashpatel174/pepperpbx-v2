import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Card, Form, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import MusicOnHoldForm from '../components/MusicOnHoldForm'
import { getChimeFileOptions, getMusicOnHoldDetails, updateMusicOnHold } from '../music-on-hold.service'
import { musicOnHoldListPath } from '../music-on-hold.constants'
import useMusicOnHoldPermissions from '../useMusicOnHoldPermissions'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import type { MohDetails, MohEditFormValues, MohUpdatePayload } from '../music-on-hold.types'

const EDIT_MOH_FORM_ID = 'edit-music-on-hold-form'

const toFormValues = (details: MohDetails): MohEditFormValues => ({
  music_on_hold_name: details.music_on_hold_name,
  music_on_hold_path: details.music_on_hold_path,
  music_on_hold_rate: details.music_on_hold_rate,
  domain_name: details.domain_name,
  music_on_hold_channels: details.music_on_hold_channels,
  music_on_hold_interval: details.music_on_hold_interval === null ? undefined : String(details.music_on_hold_interval),
  music_on_hold_timer_name: details.music_on_hold_timer_name,
  music_on_hold_chime_list: details.music_on_hold_chime_list ?? undefined,
  music_on_hold_chime_freq: details.music_on_hold_chime_freq === null ? undefined : String(details.music_on_hold_chime_freq),
  music_on_hold_chime_max: details.music_on_hold_chime_max === null ? undefined : String(details.music_on_hold_chime_max),
  music_on_hold_shuffle: details.music_on_hold_shuffle,
})

/** Numeric coercion applies only to Interval / Chime Frequency / Chime Maximum (music-on-hold.md §27); empty → null. */
const toNumberOrNull = (value?: string): number | null => (value && value.trim() !== '' ? Number(value) : null)

const toUpdatePayload = (values: MohEditFormValues): MohUpdatePayload => ({
  music_on_hold_channels: values.music_on_hold_channels,
  music_on_hold_interval: toNumberOrNull(values.music_on_hold_interval),
  music_on_hold_timer_name: values.music_on_hold_timer_name.trim(),
  music_on_hold_chime_list: values.music_on_hold_chime_list ?? null,
  music_on_hold_chime_freq: toNumberOrNull(values.music_on_hold_chime_freq),
  music_on_hold_chime_max: toNumberOrNull(values.music_on_hold_chime_max),
  music_on_hold_shuffle: values.music_on_hold_shuffle,
})

const EditMusicOnHoldPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useMusicOnHoldPermissions()
  const { categoryUuid } = useParams<{ categoryUuid: string }>()
  const [form] = Form.useForm<MohEditFormValues>()

  const [details, setDetails] = useState<MohDetails | null>(null)
  const [chimeFileOptions, setChimeFileOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittable, setSubmittable] = useState(false)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users see a read-only form with no Save (music-on-hold.md §14).
  const canEditFields = canManageAll || canEdit

  const load = useCallback(async () => {
    if (!categoryUuid) {
      // No id to fetch: show the not-found state instead of loading forever.
      setNotFound(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      // Both must resolve before the form mounts, so it initializes once from complete data (music-on-hold.md §3).
      const [loadedDetails, loadedChimes] = await Promise.all([getMusicOnHoldDetails(categoryUuid), getChimeFileOptions()])
      setDetails(loadedDetails)
      setChimeFileOptions(loadedChimes)
    } catch (err) {
      // An unknown id gets a record-scoped EmptyState; retrying can't help.
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load this music on hold category.')
    } finally {
      setLoading(false)
    }
  }, [categoryUuid])

  useEffect(() => {
    load()
  }, [load])

  // The Save button mirrors real form validity: re-validated (without touching the UI) on every value change.
  const watchedValues = Form.useWatch([], form)
  useEffect(() => {
    if (!details) return
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false))
  }, [form, details, watchedValues])

  const handleBack = () => navigate(musicOnHoldListPath)

  // onFinish only runs after Ant Design re-validates every field, so the button state is never the only guard.
  const handleSubmit = async (values: MohEditFormValues) => {
    if (!details || submitting) return
    setSubmitting(true)
    try {
      await updateMusicOnHold(details.category_uuid, toUpdatePayload(values))
      message.success(`${details.music_on_hold_name} updated successfully.`)
      navigate(musicOnHoldListPath)
    } catch (err) {
      // Stay on the page: the form still holds everything the user entered.
      message.error(getApiErrorMessage(err, 'Failed to update music on hold.'))
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />
  }

  if (loading) {
    return <LoadingState rows={6} />
  }

  if (notFound || !details) {
    return <EmptyState description="Music on hold category not found." action={<Button onClick={handleBack}>Back to Music On Hold</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Music On Hold"
        toolbar={
          <FormPageToolbar onBack={handleBack}>
            <Button onClick={handleBack} disabled={submitting}>
              Cancel
            </Button>
            {canEditFields && (
              // TODO: wrap with <PermissionGuard permission="music-on-hold.edit"> once RBAC permissions are populated from the backend.
              <Button type="primary" htmlType="submit" form={EDIT_MOH_FORM_ID} loading={submitting} disabled={!submittable}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {canAccessForm ? (
        <Card>
          <MusicOnHoldForm
            formId={EDIT_MOH_FORM_ID}
            form={form}
            initialValues={toFormValues(details)}
            chimeFileOptions={chimeFileOptions}
            disabled={submitting || !canEditFields}
            onFinish={handleSubmit}
          />
        </Card>
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditMusicOnHoldPage
