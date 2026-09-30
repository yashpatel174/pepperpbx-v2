import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ConferenceControlForm from '../components/ConferenceControlForm'
import { createConferenceControl } from '../conference-control.service'
import { conferenceControlPaths, defaultConferenceControlFormValues } from '../conference-control.constants'
import useConferenceControlPermissions from '../useConferenceControlPermissions'
import type { ConferenceControlFormValues } from '../conference-control.types'

const ADD_FORM_ID = 'add-conference-control-form'

const AddConferenceControlPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canAdd, canEdit, canView } = useConferenceControlPermissions()

  const [submitting, setSubmitting] = useState(false)

  const canAccessForm = canManageAll || canAdd

  const handleCancel = () => navigate(conferenceControlPaths.list)

  const handleSubmit = async (values: ConferenceControlFormValues) => {
    setSubmitting(true)
    try {
      const uuid = await createConferenceControl(values)
      message.success('Conference control created successfully.')
      // Add-only users go back to the list; everyone else lands on the new record's Edit page, where
      // the DTMF rows can be added (conference-controls.md §3/§14). Unreachable until RBAC is populated.
      const onlyHasAdd = canAdd && !canManageAll && !canEdit && !canView
      navigate(onlyHasAdd ? conferenceControlPaths.list : conferenceControlPaths.edit(uuid))
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to create conference control.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Conference Control"
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
        <ConferenceControlForm
          formId={ADD_FORM_ID}
          mode="create"
          initialValues={defaultConferenceControlFormValues}
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

export default AddConferenceControlPage
