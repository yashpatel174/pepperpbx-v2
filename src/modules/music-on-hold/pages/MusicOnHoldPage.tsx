import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Space, Spin, Switch, Tooltip } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import MusicOnHoldFilters from '../components/MusicOnHoldFilters'
import MusicOnHoldGroups from '../components/MusicOnHoldGroups'
import AddMusicOnHoldModal from '../components/AddMusicOnHoldModal'
import ViewMusicOnHoldModal from '../components/ViewMusicOnHoldModal'
import type { ViewMohTarget } from '../components/ViewMusicOnHoldModal'
import DeleteMusicOnHoldModal from '../components/DeleteMusicOnHoldModal'
import type { DeleteMohTarget } from '../components/DeleteMusicOnHoldModal'
import { createMusicOnHold } from '../music-on-hold.service'
import { mohRateLabel, musicOnHoldEditPath } from '../music-on-hold.constants'
import useMusicOnHold from '../useMusicOnHold'
import useMusicOnHoldPermissions from '../useMusicOnHoldPermissions'
import { getApiErrorMessage } from '../../../services/api/apiError'
import type { CreateMohPayload, MohCategory } from '../music-on-hold.types'

const MusicOnHoldPage = () => {
  const { data, loading, error, showAll, searchTerm, committedSearch, setSearchTerm, commitSearch, setShowAll, resetFilters, refresh, removeFile, shuffle } =
    useMusicOnHold()
  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useMusicOnHoldPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [addOpen, setAddOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const uploadingRef = useRef(false)
  const [viewTarget, setViewTarget] = useState<ViewMohTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteMohTarget | null>(null)
  // The target is kept until the popup's closing animation ends (cleared in onAfterClose).
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shufflingUuids, setShufflingUuids] = useState<string[]>([])
  const shufflingRef = useRef<Set<string>>(new Set())

  // Per-action permission split (music-on-hold.md §14): View is open to view-only users, Delete
  // needs the module-admin tier (Axion: wildcard / module_admin), Shuffle and Edit need edit.
  const canViewRow = canManageAll || canEdit || canView
  const canDeleteRow = canManageAll
  const canEditCategory = canManageAll || canEdit || canView
  const canShuffle = canManageAll || canEdit
  // View-only users can preview but not download; the model has no separate download key.
  const canDownload = canManageAll || canEdit

  const categoryCount = data.reduce((total, group) => total + group.child.length, 0)

  const handleUpload = async (payload: CreateMohPayload) => {
    if (uploadingRef.current) return
    uploadingRef.current = true
    setUploading(true)
    try {
      await createMusicOnHold(payload)
      message.success(`${payload.file.name} uploaded successfully.`)
      setAddOpen(false)
      await refresh()
    } catch (err) {
      // The popup stays open with everything the user entered.
      message.error(getApiErrorMessage(err, 'Failed to upload music on hold.'))
    } finally {
      uploadingRef.current = false
      setUploading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    // A rejection propagates to ConfirmActionModal, which reports it and keeps the popup open.
    await removeFile({ music_on_hold_uuid: deleteTarget.categoryUuid, file_name: deleteTarget.fileName })
    message.success(`${deleteTarget.fileName} deleted successfully.`)
    setDeleteOpen(false)
  }

  const handleShuffle = async (category: MohCategory) => {
    const { category_uuid, category_name } = category
    if (shufflingRef.current.has(category_uuid)) return
    shufflingRef.current.add(category_uuid)
    setShufflingUuids([...shufflingRef.current])
    try {
      await shuffle(category_uuid)
      message.success(`${category_name} shuffled successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to shuffle music on hold.'))
    } finally {
      shufflingRef.current.delete(category_uuid)
      setShufflingUuids([...shufflingRef.current])
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  if (loading && data.length === 0 && !committedSearch && !searchTerm) {
    return <LoadingState rows={8} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Music On Hold"
        count={categoryCount}
        primaryAction={
          canManageAll || canAdd
            ? {
                // TODO: wrap with <PermissionGuard permission="music-on-hold.add"> once RBAC
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
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <MusicOnHoldFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {/* Axion shows Show All for pbx_axiontech or when the user has >1 wildcard domain
                  (music-on-hold.md §15); neither signal exists here yet, so the module-admin tier is the stand-in. */}
              {canManageAll && (
                <Tooltip title="Show music on hold across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all music on hold" />
                    <span>{showAll ? 'Show Less' : 'Show All'}</span>
                  </Space>
                </Tooltip>
              )}
            </>
          ) : undefined
        }
      />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : data.length === 0 && !loading ? (
        <EmptyState description={committedSearch.trim() ? 'No music on hold matches your search.' : 'No music on hold found.'} />
      ) : (
        <Spin spinning={loading}>
          <MusicOnHoldGroups
            groups={data}
            showAll={showAll}
            canEditCategory={canEditCategory}
            canViewRow={canViewRow}
            canDeleteRow={canDeleteRow}
            canShuffle={canShuffle}
            shufflingUuids={shufflingUuids}
            onEditCategory={(category) => navigate(musicOnHoldEditPath(category.category_uuid))}
            onShuffle={handleShuffle}
            onView={(category, file) => setViewTarget({ categoryUuid: category.category_uuid, fileName: file.audio_name })}
            onDelete={(category, file) => {
              setDeleteTarget({
                categoryUuid: category.category_uuid,
                categoryLabel: `${category.category_name} (${mohRateLabel(category.music_on_hold_rate)})`,
                fileName: file.audio_name,
              })
              setDeleteOpen(true)
            }}
          />
        </Spin>
      )}

      <AddMusicOnHoldModal
        open={addOpen}
        submitting={uploading}
        canUpload={canManageAll || canAdd}
        onSubmit={handleUpload}
        onCancel={() => setAddOpen(false)}
      />

      <ViewMusicOnHoldModal target={viewTarget} canDownload={canDownload} onClose={() => setViewTarget(null)} />

      <DeleteMusicOnHoldModal
        open={deleteOpen}
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
        onAfterClose={() => setDeleteTarget(null)}
      />
    </Space>
  )
}

export default MusicOnHoldPage
