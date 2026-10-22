import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import ModuleHeader from '../../../components/common/ModuleHeader'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import UserSettingForm from '../components/UserSettingForm'
import { userEditPath, usersPath } from '../users.constants'
import { getUserSetting, updateUserSetting } from '../users.service'
import type { UserSetting, UserSettingFormValues } from '../users.types'

const EDIT_USER_SETTING_FORM_ID = 'edit-user-setting-form'

const EditUserSettingPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { userId, settingId } = useParams<{ userId: string; settingId: string }>()

  const [setting, setSetting] = useState<UserSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const backPath = userId ? userEditPath(userId) : usersPath
  const goBack = () => navigate(backPath)

  const load = useCallback(async () => {
    if (!userId || !settingId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      setSetting(await getUserSetting(userId, settingId))
    } catch (err) {
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load this user setting.')
    } finally {
      setLoading(false)
    }
  }, [userId, settingId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (values: UserSettingFormValues) => {
    if (!userId || !settingId) return
    setSubmitting(true)
    try {
      await updateUserSetting(userId, settingId, values)
      message.success('User setting updated successfully.')
      navigate(backPath)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update user setting.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading) return <LoadingState rows={6} />
  if (notFound || !setting) {
    return <EmptyState description="User setting not found." action={<Button onClick={goBack}>Back to User</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit User Setting"
        toolbar={
          <FormPageToolbar onBack={goBack}>
            {/* TODO(permissions): gate Save behind PermissionGuard once the backend permission contract exists. */}
            <Button type="primary" htmlType="submit" form={EDIT_USER_SETTING_FORM_ID} loading={submitting}>
              Save
            </Button>
          </FormPageToolbar>
        }
      />
      <UserSettingForm
        formId={EDIT_USER_SETTING_FORM_ID}
        initialValues={{
          category: setting.category,
          type: setting.type,
          subcategory: setting.subcategory,
          value: setting.value,
          enabled: setting.enabled,
          description: setting.description,
        }}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default EditUserSettingPage
