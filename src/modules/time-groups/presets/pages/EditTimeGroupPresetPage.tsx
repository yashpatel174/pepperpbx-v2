import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import LoadingState from '../../../../components/feedback/LoadingState'
import EmptyState from '../../../../components/feedback/EmptyState'
import ErrorState from '../../../../components/feedback/ErrorState'
import PermissionDenied from '../../../../components/feedback/PermissionDenied'
import { getApiErrorMessage, isNotFoundError } from '../../../../services/api/apiError'
import { getHiveTimeGroupDetails } from '../../time-group.service'
import useTimeGroupPermissions from '../../useTimeGroupPermissions'
import TimeGroupPresetForm from '../components/TimeGroupPresetForm'
import { getTimeGroupPresetById, updateTimeGroupPreset } from '../time-group-preset.service'
import { presetPaths } from '../time-group-preset.constants'
import type { TimeGroupHiveDetails } from '../../time-group.types'
import type { TimeGroupPresetDetails, TimeGroupPresetFormValues } from '../time-group-preset.types'

const EDIT_FORM_ID = 'edit-time-group-preset-form'

const toFormValues = (details: TimeGroupPresetDetails): TimeGroupPresetFormValues => ({
  name: details.name,
  domain_name: details.domain_name,
  description: details.description,
  festivals: details.festivals,
})

const EditTimeGroupPresetPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView } = useTimeGroupPermissions()
  const { presetId } = useParams<{ presetId: string }>()

  const [details, setDetails] = useState<TimeGroupPresetDetails | null>(null)
  const [hive, setHive] = useState<TimeGroupHiveDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Remounts the form so it picks up the server-confirmed record after a save.
  const [formKey, setFormKey] = useState(0)

  // Axion's EditPreset: access = edit || view; view-only gets a read-only form and no Save.
  const canAccessForm = canManageAll || canEdit || canView
  const canEditFields = canManageAll || canEdit

  /**
   * Record + bootstrap. Axion redirects to the list without a `preset-uuid`; PepperPBX shows an
   * EmptyState (unknown id) or ErrorState with Retry instead, never a blank form.
   */
  const load = useCallback(async () => {
    if (!presetId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const record = await getTimeGroupPresetById(presetId)
      const hiveDetails = await getHiveTimeGroupDetails(record.domain_name)
      setDetails(record)
      setHive(hiveDetails)
      setFormKey((key) => key + 1)
    } catch (err) {
      if (isNotFoundError(err)) setNotFound(true)
      else setError(getApiErrorMessage(err, 'Failed to load this preset.'))
    } finally {
      setLoading(false)
    }
  }, [presetId])

  useEffect(() => {
    if (!presetId) {
      setLoading(false)
      return
    }
    load()
  }, [load, presetId])

  const handleCancel = () => navigate(presetPaths.list)

  const handleSubmit = async (values: TimeGroupPresetFormValues) => {
    if (!details) return
    setSubmitting(true)
    try {
      await updateTimeGroupPreset(details.preset_uuid, values)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update preset.'))
      setSubmitting(false)
      return
    }
    message.success('Preset updated successfully.')
    // Stay here and reload the saved record, as Axion's EditPreset re-fetches details after update.
    try {
      const record = await getTimeGroupPresetById(details.preset_uuid)
      setDetails(record)
      setFormKey((key) => key + 1)
    } catch (err) {
      message.warning(getApiErrorMessage(err, 'Preset was saved, but reloading it failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />
  }

  if (loading) {
    return <LoadingState rows={10} />
  }

  if (!presetId || notFound || !details || !hive) {
    return (
      <EmptyState
        description={!presetId ? 'No preset was specified.' : 'Preset not found.'}
        action={<Button onClick={handleCancel}>Back to Presets</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Preset"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="timegroup.edit"> (pbx_timeconditions_edit) once RBAC is populated. */}
              {canEditFields && (
                <Button type="primary" htmlType="submit" form={EDIT_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      {canAccessForm ? (
        <TimeGroupPresetForm
          key={formKey}
          formId={EDIT_FORM_ID}
          mode="edit"
          initialValues={toFormValues(details)}
          hive={hive}
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

export default EditTimeGroupPresetPage
