import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import { getApiErrorMessage } from '../../../services/api/apiError'
import useUnsavedChangesGuard from '../../group-manager/useUnsavedChangesGuard'
import UserForm from '../components/UserForm'
import { defaultLanguage, defaultStatus, defaultTimezone, GLOBAL_DOMAIN_ID, PASSWORD_NOT_SAVED_HINT, usersPath } from '../users.constants'
import { createUser, getUserFormOptions } from '../users.service'
import type { UserFormOptions, UserFormValues } from '../users.types'

const ADD_USER_FORM_ID = 'add-user-form'

const AddUserPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [options, setOptions] = useState<UserFormOptions | null>(null)
  const [optionsError, setOptionsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formDirty, setFormDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Navigation waits for `saved` so the unsaved-changes guard has already been released.
  useUnsavedChangesGuard(formDirty && !saved)
  useEffect(() => {
    if (saved) navigate(usersPath)
  }, [saved, navigate])

  useEffect(() => {
    let active = true
    setOptionsError(false)
    getUserFormOptions()
      .then((result) => active && setOptions(result))
      .catch(() => active && setOptionsError(true))
    return () => {
      active = false
    }
  }, [])

  const goBack = () => navigate(usersPath)

  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true)
    try {
      await createUser(values)
      message.warning(`User "${values.username.trim()}" created. The password was not saved: ${PASSWORD_NOT_SAVED_HINT}`)
      setSaved(true)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create user.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (optionsError) return <ErrorState message="Failed to load groups and domains." onRetry={() => navigate(0)} />
  if (!options) return <LoadingState rows={6} />

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add User"
        toolbar={
          <FormPageToolbar onBack={goBack}>
            <Button onClick={goBack}>Cancel</Button>
            {/* TODO(permissions): gate Save behind PermissionGuard once the backend permission contract exists. */}
            <Button type="primary" htmlType="submit" form={ADD_USER_FORM_ID} loading={submitting}>
              Save
            </Button>
          </FormPageToolbar>
        }
      />
      <UserForm
        formId={ADD_USER_FORM_ID}
        mode="create"
        options={options}
        initialValues={{
          username: '',
          email: '',
          timezone: defaultTimezone,
          language: defaultLanguage,
          domain_id: GLOBAL_DOMAIN_ID,
          group_id: undefined,
          status: defaultStatus,
          enabled: true,
        }}
        submitting={submitting}
        onSubmit={handleSubmit}
        onDirtyChange={setFormDirty}
      />
    </Space>
  )
}

export default AddUserPage
