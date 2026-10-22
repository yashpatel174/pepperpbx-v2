import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import RecordingFilters from '../components/RecordingFilters'
import RecordingTable from '../components/RecordingTable'
import AddRecordingModal from '../components/AddRecordingModal'
import PlayRecordingModal from '../components/PlayRecordingModal'
import DeleteRecordingModal from '../components/DeleteRecordingModal'
import type { DeleteTarget } from '../components/DeleteRecordingModal'
import { createRecording } from '../recordings.service'
import { recordingEditPath } from '../recordings.constants'
import { useRecordings } from '../useRecordings'
import useRecordingPermissions from '../useRecordingPermissions'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { CreateRecordingPayload, Recording } from '../recordings.types'

/** Bulk actions are Delete only (recordings.md §21). */
type BulkAction = 'delete'

const RecordingsPage = () => {
  const {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm,
    committedSearch,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize,
    setShowAll,
    resetFilters,
    refresh,
    removeRecordings,
  } = useRecordings()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useRecordingPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [playTarget, setPlayTarget] = useState<Recording | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const uploadingRef = useRef(false)
  const labelByIdRef = useRef<Map<string, string>>(new Map())

  const hasSelection = selectedIds.length > 0

  // Per-action permission split (recordings.md §14): Play and Edit are open to view-only users
  // (the Edit form is then read-only); Delete needs the module-admin tier; Add needs add.
  const canPlayRow = canManageAll || canEdit || canView
  const canEditRow = canManageAll || canEdit || canView
  const canDeleteRow = canManageAll
  // recordings.md §33: view-only users can play but not download; edit (or module admin) can. The
  // permission model has no separate download key, so this reuses the edit tier rather than inventing one.
  const canDownloadRow = canManageAll || canEdit

  useEffect(() => {
    if (selectedIds.length === 0) setBulkAction(undefined)
  }, [selectedIds])

  // Selection persists across pages, page size, search and scope changes (PepperPBX list
  // convention, same as Voicemail) — it is cleared only after a bulk action completes or a bulk
  // popup is dismissed. Names seen on every fetched page label the bulk-delete list.
  useEffect(() => {
    data.forEach((recording) => labelByIdRef.current.set(recording.recording_uuid, recording.recording_name))
  }, [data])

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  // -- Add ----------------------------------------------------------------------------------

  const handleUpload = async (payload: CreateRecordingPayload) => {
    if (uploadingRef.current) return
    uploadingRef.current = true
    setUploading(true)
    try {
      await createRecording(payload)
      message.success(`Recording ${payload.recording_name} uploaded successfully.`)
      setAddOpen(false)
      await refresh()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to upload recording.'))
    } finally {
      uploadingRef.current = false
      setUploading(false)
    }
  }

  // -- Delete -------------------------------------------------------------------------------

  const handleDeleteRequest = (recording: Recording) => {
    setDeleteIsBulk(false)
    setDeleteTargets([{ id: recording.recording_uuid, label: recording.recording_name }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeRecordings(ids)
    message.success(ids.length === 1 ? `Recording ${deleteTargets[0].label} deleted successfully.` : `${ids.length} recordings deleted.`)
    setDeleteTargets(null)
    setDeleteIsBulk(false)
    setSelectedIds((selected) => selected.filter((id) => !ids.includes(id)))
  }

  // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
  const handleDeleteCancel = () => {
    setDeleteTargets(null)
    if (deleteIsBulk) clearSelection()
    setDeleteIsBulk(false)
  }

  const handleApplyBulkAction = () => {
    if (bulkAction !== 'delete' || selectedIds.length === 0) return
    setDeleteIsBulk(true)
    setDeleteTargets(selectedIds.map((id) => ({ id, label: labelByIdRef.current.get(id) ?? id })))
    setBulkAction(undefined)
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[{ value: 'delete', label: 'Delete', disabled: !canDeleteRow }]}
        aria-label="Select action"
      />
      <Button type="primary" disabled={!bulkAction} onClick={handleApplyBulkAction}>
        Apply
      </Button>
    </Space>
  )

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  if (loading && data.length === 0 && totalRecords === 0 && !searchTerm) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Recordings"
        count={totalRecords}
        primaryAction={
          canManageAll || canAdd
            ? {
                // TODO: wrap with <PermissionGuard permission="recordings.add"> once RBAC
                // permissions are populated from the backend.
                key: 'add',
                label: 'Add',
                icon: <PlusOutlined />,
                onClick: () => setAddOpen(true),
              }
            : undefined
        }
        filters={
          hasAnyAccess ? (
            <>
              <Tooltip title="Reset filters">
                <Button
                  icon={<UndoOutlined />}
                  onClick={resetFilters}
                  aria-label="Reset filters"
                />
              </Tooltip>
              <RecordingFilters
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={commitSearch}
              />
              {/* Axion shows Show All for pbx_axiontech or when the user has >1 wildcard domain
                  (recordings.md §15); neither signal exists here yet, so the module-admin tier is the stand-in. */}
              {canManageAll && (
                <Tooltip title="Show recordings across all accessible domains">
                  <Space size="small">
                    <Switch
                      checked={showAll}
                      onChange={setShowAll}
                      size="small"
                      aria-label="Show all recordings"
                    />
                    <span>Show All</span>
                  </Space>
                </Tooltip>
              )}
            </>
          ) : undefined
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : totalRecords === 0 && !loading ? (
        <EmptyState description={committedSearch.trim() ? 'No recordings match your search.' : 'No recordings found.'} />
      ) : (
        <RecordingTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canPlayRow={canPlayRow}
          canEditRow={canEditRow}
          canDeleteRow={canDeleteRow}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onPlay={setPlayTarget}
          onEdit={(recording) => navigate(recordingEditPath(recording.recording_uuid))}
          onDelete={handleDeleteRequest}
          selectedRowKeys={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <AddRecordingModal open={addOpen} submitting={uploading} onSubmit={handleUpload} onCancel={() => setAddOpen(false)} />

      <PlayRecordingModal recording={playTarget} canDownload={canDownloadRow} onClose={() => setPlayTarget(null)} />

      <DeleteRecordingModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Space>
  )
}

export default RecordingsPage
