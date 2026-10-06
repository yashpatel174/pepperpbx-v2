import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import LoadingState from '../../../../components/feedback/LoadingState'
import ErrorState from '../../../../components/feedback/ErrorState'
import PermissionDenied from '../../../../components/feedback/PermissionDenied'
import useCurrentDomain from '../../../../hooks/useCurrentDomain'
import { getApiErrorMessage } from '../../../../services/api/apiError'
import { getHiveTimeGroupDetails } from '../../time-group.service'
import useTimeGroupPermissions from '../../useTimeGroupPermissions'
import TimeGroupPresetForm from '../components/TimeGroupPresetForm'
import { createTimeGroupPreset } from '../time-group-preset.service'
import { getDefaultPresetFormValues, presetPaths } from '../time-group-preset.constants'
import type { TimeGroupHiveDetails } from '../../time-group.types'
import type { TimeGroupPresetFormValues } from '../time-group-preset.types'

const ADD_FORM_ID = 'add-time-group-preset-form'

const AddTimeGroupPresetPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  // Axion gates presets with the same TIMEGROUP_PERMISSION object as Time Groups.
  const { canManageAll, canAdd, canEdit, canView } = useTimeGroupPermissions()

  const [hive, setHive] = useState<TimeGroupHiveDetails | null>(null)
  const [initialValues, setInitialValues] = useState<TimeGroupPresetFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  const currentDomain = useCurrentDomain()
  const initialDomainRef = useRef(currentDomain?.name)

  const bootstrap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hiveDetails = await getHiveTimeGroupDetails(initialDomainRef.current)
      const requested = initialDomainRef.current
      const domain = requested && hiveDetails.domainOptions.includes(requested) ? requested : hiveDetails.defaultDomain
      setHive(hiveDetails)
      setInitialValues(getDefaultPresetFormValues(domain))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load preset settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const handleCancel = () => navigate(presetPaths.list)

  const handleSubmit = async (values: TimeGroupPresetFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createTimeGroupPreset(values)
      message.success('Preset created successfully.')
      // Add-only users go back to the list; everyone else lands on the new preset's Edit page
      // (Axion's AddPreset). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? presetPaths.list : presetPaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create preset.'))
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
        title="Add Preset"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="timegroup.add"> (pbx_timeconditions_add) once RBAC is populated. */}
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
        <TimeGroupPresetForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={initialValues}
          hive={hive}
          canManage={canAccessForm}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <PermissionDenied />
      )}
    </Space>
  )
}

export default AddTimeGroupPresetPage
