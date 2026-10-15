import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Card, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import ModuleHeader from '../../../components/common/ModuleHeader'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import { getApiErrorMessage, isNotFoundError } from '../../../services/api/apiError'
import useUnsavedChangesGuard from '../../group-manager/useUnsavedChangesGuard'
import UserForm from '../components/UserForm'
import UserSettingsTable from '../components/UserSettingsTable'
import { GLOBAL_DOMAIN_ID, PASSWORD_NOT_SAVED_HINT, userSettingAddPath, userSettingEditPath, usersPath } from '../users.constants'
import { getUserById, getUserFormOptions, getUserSettings, updateUser } from '../users.service'
import type { User, UserFormOptions, UserFormValues, UserSetting } from '../users.types'

const EDIT_USER_FORM_ID = 'edit-user-form'

const EditUserPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { userId } = useParams<{ userId: string }>()

  const [user, setUser] = useState<User | null>(null)
  const [options, setOptions] = useState<UserFormOptions | null>(null)
  const [settings, setSettings] = useState<UserSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formDirty, setFormDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Navigation waits for `saved` so the unsaved-changes guard has already been released.
  useUnsavedChangesGuard(formDirty && !saved)
  useEffect(() => {
    if (saved) navigate(usersPath)
  }, [saved, navigate])

  const goBack = () => navigate(usersPath)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const [loadedUser, loadedOptions, loadedSettings] = await Promise.all([
        getUserById(userId),
        getUserFormOptions(),
        getUserSettings(userId),
      ])
      setUser(loadedUser)
      setOptions(loadedOptions)
      setSettings(loadedSettings)
    } catch (err) {
      if (isNotFoundError(err)) setNotFound(true)
      else setError('Failed to load this user.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (values: UserFormValues) => {
    if (!user) return
    setSubmitting(true)
    try {
      await updateUser(user.user_uuid, values)
      if (values.password) {
        message.warning(`User "${values.username.trim()}" updated. The new password was not saved: ${PASSWORD_NOT_SAVED_HINT}`)
      } else {
        message.success(`User "${values.username.trim()}" updated successfully.`)
      }
      setSaved(true)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to update user.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading) return <LoadingState rows={6} />
  if (notFound || !user || !options || !userId) {
    return <EmptyState description="User not found." action={<Button onClick={goBack}>Back to Users</Button>} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title={`Edit User (${user.username})`}
        toolbar={
          <FormPageToolbar onBack={goBack}>
            <Button onClick={goBack}>Cancel</Button>
            {/* TODO(permissions): gate Save behind PermissionGuard once the backend permission contract exists. */}
            <Button type="primary" htmlType="submit" form={EDIT_USER_FORM_ID} loading={submitting}>
              Save
            </Button>
          </FormPageToolbar>
        }
      />
      <UserForm
        formId={EDIT_USER_FORM_ID}
        mode="edit"
        userId={user.user_uuid}
        options={options}
        initialValues={{
          username: user.username,
          email: user.email,
          timezone: user.timezone,
          language: user.language,
          first_name: user.first_name,
          organization: user.organization,
          last_name: user.last_name,
          // A domain-less user is global, so the dropdown shows Global for them.
          domain_id: user.domain_id ?? GLOBAL_DOMAIN_ID,
          group_id: user.group_ids[0],
          api_key: user.api_key,
          status: user.status,
          enabled: user.enabled,
        }}
        submitting={submitting}
        onSubmit={handleSubmit}
        onDirtyChange={setFormDirty}
      />

      <Card
        title="User Settings"
        extra={
          // TODO(permissions): gate Add behind PermissionGuard once the backend permission contract exists.
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(userSettingAddPath(userId))}>
            Add
          </Button>
        }
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            Settings for this user that should override those defined in Domain or Default Settings.
          </Typography.Text>
          <UserSettingsTable
            data={settings}
            loading={false}
            onEdit={(setting) => navigate(userSettingEditPath(userId, setting.user_setting_uuid))}
          />
        </Space>
      </Card>
    </Space>
  )
}

export default EditUserPage
