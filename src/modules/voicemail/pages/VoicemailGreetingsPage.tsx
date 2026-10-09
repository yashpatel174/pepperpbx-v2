import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Typography } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import AudioPreviewModal from '../components/AudioPreviewModal'
import AddGreetingModal from '../components/AddGreetingModal'
import EditGreetingModal from '../components/EditGreetingModal'
import VoicemailGreetingTable from '../components/VoicemailGreetingTable'
import { createGreeting, deleteGreetings, getVoicemailDetails, listGreetings, playGreeting } from '../voicemail.service'
import useVoicemailChildList from '../useVoicemailChildList'
import useVoicemailContext from '../useVoicemailContext'
import useVoicemailPermissions from '../useVoicemailPermissions'
import type { VoicemailGreeting } from '../voicemail.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

/** Bulk actions are Delete only (voicemail.md §23b). */
type BulkAction = 'delete'

const LOAD_ERROR = 'Failed to load voicemail greetings.'

interface GreetingsListProps {
  voicemailUuid: string
  voicemailId: string
}

const VoicemailGreetingsList = ({ voicemailUuid, voicemailId }: GreetingsListProps) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView, hasAnyAccess } = useVoicemailPermissions()

  const fetcher = useCallback(
    (page: number, pageSize: number) => listGreetings({ voicemailUuid, voicemailId, page, pageSize }),
    [voicemailUuid, voicemailId]
  )
  const { data, loading, error, notFound, page, pageSize, total, setPage, setPageSize, refresh } = useVoicemailChildList(fetcher, LOAD_ERROR)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null)
  const [viewTarget, setViewTarget] = useState<VoicemailGreeting | null>(null)
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Add and bulk Delete need the module-admin tier; View / Edit need edit (voicemail.md §19).
  const canEditRow = canManageAll || canEdit || canView
  const canEditFields = canManageAll || canEdit
  const canAddOrDelete = canManageAll

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  useEffect(() => {
    if (selectedIds.length === 0) setBulkAction(undefined)
  }, [selectedIds])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      // The mailbox is verified (and its domain read) first, so the upload targets the mailbox's
      // own domain. Axion sends the user's default domain here (voicemail.md §18).
      const mailbox = await getVoicemailDetails(voicemailUuid)
      await createGreeting({ domain_name: mailbox.domain_name, voicemail_id: voicemailId, voicemail_uuid: voicemailUuid, uploadFile: file })
      message.success('Greeting uploaded successfully.')
      setAddOpen(false)
      await refresh()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to upload greeting.'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteIds) return
    await deleteGreetings(deleteIds)
    message.success(deleteIds.length === 1 ? 'Greeting deleted successfully.' : `${deleteIds.length} greetings deleted.`)
    setDeleteIds(null)
    clearSelection()
    await refresh()
  }

  const loadViewUrl = useCallback(
    () => (viewTarget ? playGreeting(viewTarget.voicemail_greeting_uuid, voicemailId) : Promise.reject(new Error('No greeting selected.'))),
    [viewTarget, voicemailId]
  )

  const toolbar = (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/voicemail')}>
        Back
      </Button>
      <Space wrap>
        {selectedIds.length > 0 ? (
          <>
            <Typography.Text>You have selected {selectedIds.length} rows</Typography.Text>
            <Select<BulkAction>
              placeholder="Select action"
              style={{ width: 160 }}
              value={bulkAction}
              onChange={setBulkAction}
              options={[{ value: 'delete', label: 'Delete', disabled: !canAddOrDelete }]}
              aria-label="Select action"
            />
            <Button
              type="primary"
              disabled={!bulkAction}
              onClick={() => {
                setDeleteIds([...selectedIds])
                setBulkAction(undefined)
              }}
            >
              Apply
            </Button>
          </>
        ) : (
          canAddOrDelete && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              Add
            </Button>
          )
        )}
      </Space>
    </div>
  )

  if (error) return <ErrorState message={error} onRetry={refresh} />
  if (notFound) {
    return <EmptyState description="Voicemail not found." action={<Button onClick={() => navigate('/voicemail')}>Back to Voicemail</Button>} />
  }
  if (loading && data.length === 0 && total === 0) return <LoadingState rows={10} />

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader title={`Voicemails Greetings — Mailbox: ${voicemailId}`} count={total} toolbar={toolbar} />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : total === 0 && !loading ? (
        <EmptyState description="No voicemail greetings found." />
      ) : (
        <VoicemailGreetingTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canEditRow={canEditRow}
          canDeleteRow={canAddOrDelete}
          onPageChange={(nextPage) => {
            clearSelection()
            setPage(nextPage)
          }}
          onPageSizeChange={(size) => {
            clearSelection()
            setPageSize(size)
          }}
          onView={setViewTarget}
          onEdit={(greeting) => setEditUuid(greeting.voicemail_greeting_uuid)}
          onDelete={(greeting) => setDeleteIds([greeting.voicemail_greeting_uuid])}
          selectedRowKeys={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <AddGreetingModal open={addOpen} submitting={uploading} onSubmit={handleUpload} onCancel={() => setAddOpen(false)} />

      <AudioPreviewModal
        open={!!viewTarget}
        title={viewTarget ? `Greeting — ${viewTarget.greeting_name}` : 'Greeting'}
        loadUrl={loadViewUrl}
        downloadFileName="greetingFile.mp3"
        canDownload={canEditFields}
        onClose={() => setViewTarget(null)}
      />

      <EditGreetingModal greetingUuid={editUuid} canEdit={canEditFields} onSaved={refresh} onClose={() => setEditUuid(null)} />

      <ConfirmActionModal
        open={!!deleteIds}
        title="Delete Voicemail Greeting"
        confirmText="Delete"
        danger
        errorMessage="Delete failed."
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteIds(null)
          clearSelection()
        }}
      >
        <Typography.Paragraph>
          {deleteIds && deleteIds.length > 1
            ? `Are you sure you want to delete these ${deleteIds.length} voicemail greetings?`
            : 'Are you sure you want to delete this voicemail greeting?'}
        </Typography.Paragraph>
        <Typography.Text type="danger">
          Note: Please ensure that this voicemail greeting is not linked to any other records before proceeding, as deleting it may affect
          related data.
        </Typography.Text>
      </ConfirmActionModal>
    </Space>
  )
}

/** Greetings sub-page (voicemail.md §3/§23b). Both `voicemail-uuid` and `voicemail-id` are required, else back to the list. */
const VoicemailGreetingsPage = () => {
  const navigate = useNavigate()
  const context = useVoicemailContext()

  useEffect(() => {
    if (!context) navigate('/voicemail', { replace: true })
  }, [context, navigate])

  if (!context) return null
  return <VoicemailGreetingsList key={context.voicemailUuid} voicemailUuid={context.voicemailUuid} voicemailId={context.voicemailId} />
}

export default VoicemailGreetingsPage
