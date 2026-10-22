import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import FormPageToolbar from '../../../components/common/FormPageToolbar'
import ModuleHeader from '../../../components/common/ModuleHeader'
import { getApiErrorMessage } from '../../../services/api/apiError'
import UserSettingForm from '../components/UserSettingForm'
import { userEditPath, usersPath } from '../users.constants'
import { createUserSetting } from '../users.service'
import type { UserSettingFormValues } from '../users.types'

const ADD_USER_SETTING_FORM_ID = 'add-user-setting-form'

const AddUserSettingPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { userId } = useParams<{ userId: string }>()
  const [submitting, setSubmitting] = useState(false)

  const backPath = userId ? userEditPath(userId) : usersPath
  const goBack = () => navigate(backPath)

  const handleSubmit = async (values: UserSettingFormValues) => {
    if (!userId) return
    setSubmitting(true)
    try {
      await createUserSetting(userId, values)
      message.success('User setting created successfully.')
      navigate(backPath)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create user setting.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add User Setting"
        toolbar={
          <FormPageToolbar onBack={goBack}>
            {/* TODO(permissions): gate Save behind PermissionGuard once the backend permission contract exists. */}
            <Button type="primary" htmlType="submit" form={ADD_USER_SETTING_FORM_ID} loading={submitting}>
              Save
            </Button>
          </FormPageToolbar>
        }
      />
      <UserSettingForm
        formId={ADD_USER_SETTING_FORM_ID}
        initialValues={{ category: '', type: '', subcategory: '', enabled: true }}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  )
}

export default AddUserSettingPage
