import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ExtensionForm from '../components/ExtensionForm'
import { createExtension } from '../extension.service'
import { defaultExtensionFormValues } from '../extension.constants'
import type { ExtensionFormValues } from '../extension.types'

const initialValues: ExtensionFormValues = {
  ...defaultExtensionFormValues,
  extension: '',
  context: '',
}

const AddExtensionPage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  const handleCancel = () => navigate('/account/extensions')

  const handleSubmit = async (values: ExtensionFormValues) => {
    setSubmitting(true)
    try {
      const created = await createExtension(values)
      message.success(`Extension ${created.extension} created successfully.`)
      navigate('/account/extensions')
    } catch {
      message.error('Failed to create extension.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Add Extension"
        // TODO: wrap with <PermissionGuard permission="extension.create"> once RBAC
        // permissions are populated from the backend (see CLAUDE.md section 11).
        actions={[{ key: 'back', label: 'Back', icon: <ArrowLeftOutlined />, onClick: handleCancel }]}
      />
      <ExtensionForm
        mode="create"
        initialValues={initialValues}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Space>
  )
}

export default AddExtensionPage
