import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import AudioPreviewModal from '../components/AudioPreviewModal'
import VoicemailMessageTable from '../components/VoicemailMessageTable'
import { deleteMessages, listMessages, playMessage } from '../voicemail.service'
import { voicemailChildPath, voicemailEditPath } from '../voicemail.constants'
import useVoicemailChildList from '../useVoicemailChildList'
import useVoicemailContext from '../useVoicemailContext'
import useVoicemailPermissions from '../useVoicemailPermissions'
import type { VoicemailMessage } from '../voicemail.types'

type BulkAction = 'delete'

const LOAD_ERROR = 'Failed to load voicemail messages.'

interface MessagesListProps {
  voicemailUuid: string
  voicemailId: string
}

const VoicemailMessagesList = ({ voicemailUuid, voicemailId }: MessagesListProps) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { canManageAll, canEdit, canView, hasAnyAccess } = useVoicemailPermissions()

  const fetcher = useCallback(
    (page: number, pageSize: number) => listMessages({ voicemailUuid, voicemailId, page, pageSize }),
    [voicemailUuid, voicemailId]
  )
  const { data, loading, error, notFound, page, pageSize, total, setPage, setPageSize, refresh } = useVoicemailChildList(fetcher, LOAD_ERROR)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null)
  const [viewTarget, setViewTarget] = useState<VoicemailMessage | null>(null)

  // Axion: row View needs admin/edit; Delete needs the module-admin tier; bulk actions, the popup
  // Delete and Download need edit (voicemail.md §19).
  const canEditMessages = canManageAll || canEdit
  const canViewRow = canEditMessages || canView
  const canDeleteRow = canManageAll

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  useEffect(() => {
    if (selectedIds.length === 0) setBulkAction(undefined)
  }, [selectedIds])

  const handlePageChange = (nextPage: number) => {
    clearSelection()
    setPage(nextPage)
  }
  const handlePageSizeChange = (size: number) => {
    clearSelection()
    setPageSize(size)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteIds) return
    await deleteMessages(voicemailUuid, deleteIds)
    message.success(deleteIds.length === 1 ? 'Message deleted successfully.' : `${deleteIds.length} messages deleted.`)
    setDeleteIds(null)
    setViewTarget(null)
    clearSelection()
    await refresh()
  }

  const handleApply = () => {
    if (!bulkAction || selectedIds.length === 0) return
    if (bulkAction === 'delete') setDeleteIds([...selectedIds])
    setBulkAction(undefined)
  }

  const loadViewUrl = useCallback(
    () => (viewTarget ? playMessage(viewTarget.voicemail_message_uuid, voicemailUuid) : Promise.reject(new Error('No message selected.'))),
    [viewTarget, voicemailUuid]
  )

  // Closing the View popup refetches the list (voicemail.md §23a).
  const closeView = () => {
    setViewTarget(null)
    void refresh()
  }

  const toolbar = (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/voicemail')}>
        Back
      </Button>
      <Space wrap>
        {selectedIds.length > 0 && (
          <>
            <Typography.Text>You have selected {selectedIds.length} rows</Typography.Text>
            <Select<BulkAction>
              placeholder="Select action"
              style={{ width: 160 }}
              value={bulkAction}
              onChange={setBulkAction}
              options={[
                { value: 'delete', label: 'Delete', disabled: !canEditMessages },
              ]}
              aria-label="Select action"
            />
            <Button type="primary" disabled={!bulkAction} onClick={handleApply}>
              Apply
            </Button>
          </>
        )}
        {/* Both buttons carry the full mailbox context — Axion's Settings link dropped voicemail-id. */}
        <Button onClick={() => navigate(voicemailChildPath('greetings', voicemailUuid, voicemailId))}>Greetings</Button>
        <Button onClick={() => navigate(voicemailEditPath(voicemailUuid))}>Settings</Button>
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
      <ModuleHeader title={`Voicemails Messages — Mailbox: ${voicemailId}`} count={total} toolbar={toolbar} />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : total === 0 && !loading ? (
        <EmptyState description="No voicemail messages found." />
      ) : (
        <VoicemailMessageTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          canViewRow={canViewRow}
          canDeleteRow={canDeleteRow}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onView={setViewTarget}
          onDelete={(row) => setDeleteIds([row.voicemail_message_uuid])}
          selectedRowKeys={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <AudioPreviewModal
        open={!!viewTarget}
        title="Voicemail Message"
        loadUrl={loadViewUrl}
        downloadFileName="Voicemail-Message-File.mp3"
        canDownload={canEditMessages}
        onClose={closeView}
        footerActions={
          viewTarget && (
            <>
             
            </>
          )
        }
      >
        <Typography.Title level={5} style={{ marginTop: 16 }}>
          Transcription
        </Typography.Title>
        <Typography.Paragraph type={viewTarget?.message_transcription ? undefined : 'secondary'}>
          {viewTarget?.message_transcription ?? 'Transcription not available'}
        </Typography.Paragraph>
      </AudioPreviewModal>

      <ConfirmActionModal
        open={!!deleteIds}
        title="Delete Message"
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
          {deleteIds && deleteIds.length > 1 ? `Are you sure you want to delete these ${deleteIds.length} messages?` : 'Are you sure you want to delete this message?'}
        </Typography.Paragraph>
      </ConfirmActionModal>

    </Space>
  )
}

/** Messages sub-page (voicemail.md §3/§23a). Both `voicemail-uuid` and `voicemail-id` are required, else back to the list. */
const VoicemailMessagesPage = () => {
  const navigate = useNavigate()
  const context = useVoicemailContext()

  useEffect(() => {
    if (!context) navigate('/voicemail', { replace: true })
  }, [context, navigate])

  if (!context) return null
  return <VoicemailMessagesList key={context.voicemailUuid} voicemailUuid={context.voicemailUuid} voicemailId={context.voicemailId} />
}

export default VoicemailMessagesPage
