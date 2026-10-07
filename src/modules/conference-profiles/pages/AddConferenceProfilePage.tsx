import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage } from '../../../services/api/apiError'
import ConferenceProfileForm from '../components/ConferenceProfileForm'
import { createConferenceProfile } from '../conference-profile.service'
import { conferenceProfilePaths, defaultConferenceProfileFormValues } from '../conference-profile.constants'
import useConferenceProfilePermissions from '../useConferenceProfilePermissions'
import type { ConferenceProfileFormValues } from '../conference-profile.types'

const ADD_FORM_ID = 'add-conference-profile-form'

const AddConferenceProfilePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useConferenceProfilePermissions()

  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  const handleCancel = () => navigate(conferenceProfilePaths.list)

  const handleSubmit = async (values: ConferenceProfileFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createConferenceProfile(values)
      message.success(`Conference profile "${values.profile_name}" created successfully.`)
      // Add-only users go back to the list; everyone else lands on the new record's Edit page, where
      // the profile parameters can be added (conference-profiles.md §3/§14). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? conferenceProfilePaths.list : conferenceProfilePaths.edit(uuid))
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to create conference profile.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Conference Profile"
        toolbar={
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space wrap>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {/* TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC is populated. */}
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
        <ConferenceProfileForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={defaultConferenceProfileFormValues}
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

export default AddConferenceProfilePage
