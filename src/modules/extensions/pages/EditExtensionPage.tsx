import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { App, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import ErrorState from '../../../components/feedback/ErrorState'
import ExtensionForm from '../components/ExtensionForm'
import { getExtensionById, toExtensionFormValues, updateExtension } from '../extension.service'
import type { Extension, ExtensionFormValues } from '../extension.types'

const EditExtensionPage = () => {
  const { extensionId } = useParams<{ extensionId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [extension, setExtension] = useState<Extension | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!extensionId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const found = await getExtensionById(extensionId)
      setExtension(found ?? null)
    } catch {
      setError('Failed to load this extension.')
    } finally {
      setLoading(false)
    }
  }, [extensionId])

  useEffect(() => {
    load()
  }, [load])

  const handleCancel = () => navigate('/account/extensions')

  const handleSubmit = async (values: ExtensionFormValues) => {
    if (!extension) return
    setSubmitting(true)
    try {
      const updated = await updateExtension(extension.id, values)
      message.success(`Extension ${updated.extension} updated successfully.`)
      navigate('/account/extensions')
    } catch {
      message.error('Failed to update extension.')
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

  if (!extension) {
    return (
      <EmptyState
        description="Extension not found."
        action={<Button onClick={handleCancel}>Back to Extensions</Button>}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Edit Extension"
        // TODO: wrap with <PermissionGuard permission="extension.edit"> once RBAC
        // permissions are populated from the backend (see CLAUDE.md section 11).
        actions={[{ key: 'back', label: 'Back', icon: <ArrowLeftOutlined />, onClick: handleCancel }]}
      />
      <ExtensionForm
        mode="edit"
        initialValues={toExtensionFormValues(extension)}
        excludeId={extension.id}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Space>
  )
}

export default EditExtensionPage
