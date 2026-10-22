import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Card, Form, Input, Space } from 'antd'
import ModuleHeader from '../../../components/common/ModuleHeader'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getRecording, updateRecording } from '../recordings.service'
import { noEdgeWhitespaceRule, recordingNameRules } from '../recordings.validation'
import useRecordingPermissions from '../useRecordingPermissions'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import type { Recording, RecordingEditValues } from '../recordings.types'

const EDIT_RECORDING_FORM_ID = 'edit-recording-form'

interface EditRecordingFormValues extends RecordingEditValues {
  recording_filename: string
  domain_name: string
  recording_description?: string
}

const toFormValues = (recording: Recording): EditRecordingFormValues => ({
  recording_name: recording.recording_name,
  recording_filename: recording.recording_filename,
  domain_name: recording.domain_name,
  recording_description: recording.recording_description,
})

const EditRecordingPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useRecordingPermissions()
  const { recordingId } = useParams<{ recordingId: string }>()
  const [form] = Form.useForm<EditRecordingFormValues>()

  const [recording, setRecording] = useState<Recording | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canEdit || canView
  // View-only users see a read-only form with no Save (recordings.md §14); system recordings are never editable (§26).
  const canEditFields = (canManageAll || canEdit) && !recording?.default

  const load = useCallback(
    /** Resolves whether the details loaded. */
    async (withSpinner: boolean): Promise<boolean> => {
      if (!recordingId) return false
      if (withSpinner) setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const loaded = await getRecording(recordingId)
        setRecording(loaded)
        // The first load seeds the Form through `initialValues` when it mounts (it isn't mounted
        // yet). Only a post-save refresh, with the Form mounted, needs to repopulate it.
        if (!withSpinner) form.setFieldsValue(toFormValues(loaded))
        return true
      } catch (err) {
        // A failed post-save refresh must not replace the page with a load error: the save already
        // succeeded and the form still holds the saved values. The caller reports it.
        if (!withSpinner) return false
        // An unknown id gets a record-scoped EmptyState; retrying can't help.
        if (isNotFoundError(err)) setNotFound(true)
        else setError('Failed to load this recording.')
        return false
      } finally {
        if (withSpinner) setLoading(false)
      }
    },
    [recordingId, form]
  )

  useEffect(() => {
    load(true)
  }, [load])

  const handleBack = () => navigate('/recordings')

  const handleSubmit = async (values: EditRecordingFormValues) => {
    if (!recording || submitting) return
    setSubmitting(true)
    try {
      await updateRecording(recording.recording_uuid, { recording_name: values.recording_name })
      message.success(`Recording ${values.recording_name.trim()} updated successfully.`)
      // Update success does NOT navigate: the record is re-fetched and the same page repopulated
      // with the server's data (recordings.md §3).
      const refreshed = await load(false)
      if (!refreshed) message.warning('Recording saved, but the latest details could not be refreshed.')
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update recording.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load(true)} />
  }

  if (loading) {
    return <LoadingState rows={6} />
  }

  if (notFound || !recording) {
    return <EmptyState description="Recording not found." action={<Button onClick={handleBack}>Back to Recordings</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Recording"
        toolbar={
          <FormPageToolbar onBack={handleBack}>
            <Button onClick={handleBack} disabled={submitting}>
              Cancel
            </Button>
            {canEditFields && (
              // TODO: wrap with <PermissionGuard permission="recordings.edit"> once RBAC permissions are populated from the backend.
              <Button type="primary" htmlType="submit" form={EDIT_RECORDING_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      {canAccessForm ? (
        <Card>
          <Form<EditRecordingFormValues>
            id={EDIT_RECORDING_FORM_ID}
            form={form}
            layout="vertical"
            initialValues={toFormValues(recording)}
            disabled={submitting}
            onFinish={handleSubmit}
            style={{ maxWidth: 560 }}
          >
            <Form.Item name="recording_name" label="Recording Name" validateFirst required rules={recordingNameRules}>
              <Input placeholder="Enter recording name" disabled={!canEditFields} aria-label="Recording name" />
            </Form.Item>
            {/* File name, domain and description are permanently read-only (recordings.md §8/§26). */}
            <Form.Item name="recording_filename" label="File Name">
              <Input disabled aria-label="File name" />
            </Form.Item>
            <Form.Item name="domain_name" label="Domain Name">
              <Input disabled aria-label="Domain name" />
            </Form.Item>
            <Form.Item name="recording_description" label="Description" rules={[noEdgeWhitespaceRule]}>
              <Input.TextArea rows={2} disabled aria-label="Description" />
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default EditRecordingPage
