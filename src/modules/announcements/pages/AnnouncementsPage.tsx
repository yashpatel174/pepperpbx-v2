import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Flex, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import AnnouncementFilters from '../components/AnnouncementFilters'
import AnnouncementTable from '../components/AnnouncementTable'
import DeleteAnnouncementsModal from '../components/DeleteAnnouncementsModal'
import type { DeleteTarget } from '../components/DeleteAnnouncementsModal'
import ToggleAnnouncementsModal from '../components/ToggleAnnouncementsModal'
import { useAnnouncements } from '../useAnnouncements'
import useAnnouncementPermissions from '../useAnnouncementPermissions'
import type { Announcement } from '../announcement.types'

/**
 * Bulk actions are limited to Toggle + Delete — no Copy action exists anywhere in this module per
 * the audit (announcements.md §3/§8/§21/§32: "No Copy popup... not applicable"), so unlike
 * Outbound Routes there's no CopyModal here at all, not even a dead-branch equivalent.
 */
type BulkAction = 'toggle' | 'delete'

const AnnouncementsPage = () => {
  const {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    searchTerm,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize,
    setShowAll,
    resetFilters,
    refresh,
    removeAnnouncements,
    toggleAnnouncementsStatus,
  } = useAnnouncements()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useAnnouncementPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedAnnouncementIds, setSelectedAnnouncementIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)

  const hasSelection = selectedAnnouncementIds.length > 0
  // Row Edit is reachable by view-only users too (read-only form); row Delete and the bulk Delete
  // option require the module-admin tier; bulk Toggle also allows Add-permission holders — all
  // matching the audit's documented per-action permission split (announcements.md §14).
  const canEditRow = canManageAll || canEdit || canView
  const canDeleteRow = canManageAll
  const canToggleRow = canManageAll || canEdit
  const canBulkToggle = canManageAll || canAdd

  useEffect(() => {
    if (selectedAnnouncementIds.length === 0) setBulkAction(undefined)
  }, [selectedAnnouncementIds])

  const clearSelection = () => {
    setSelectedAnnouncementIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/announcements/add')
  const handleEdit = (announcement: Announcement) => navigate(`/announcements/${announcement.id}/edit`)

  const handleDeleteRequest = (announcement: Announcement) => {
    setDeleteTargets([{ id: announcement.id, name: announcement.name }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeAnnouncements(ids)
    message.success(`${ids.length} announcement${ids.length === 1 ? '' : 's'} deleted.`)
    setDeleteTargets(null)
    clearSelection()
  }

  const handleDeleteCancel = () => {
    setDeleteTargets(null)
    clearSelection()
  }

  const handleToggleConfirm = async () => {
    if (!toggleTargetIds) return
    const count = toggleTargetIds.length
    await toggleAnnouncementsStatus(toggleTargetIds)
    message.success(`${count} announcement${count === 1 ? '' : 's'} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const handleToggleCancel = () => {
    setToggleTargetIds(null)
    clearSelection()
  }

  // Inline pill acts immediately, no confirmation — matches the audit's row Status behavior
  // (announcements.md §3/§11/§26), distinct from the confirmed bulk Toggle flow above.
  const handleToggleStatus = async (announcement: Announcement) => {
    try {
      await toggleAnnouncementsStatus([announcement.id])
      message.success(`Announcement ${announcement.name} ${announcement.enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to update announcement ${announcement.name}.`)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedAnnouncementIds.length === 0) return
    // Row selection is preserved across pages (preserveSelectedRowKeys), so a selection can span
    // pages the table isn't currently showing. The delete/toggle targets must come from the full
    // selectedAnnouncementIds list, not from `data` (only the current page) — otherwise IDs
    // selected on another page would be silently dropped. `data` is still used opportunistically to
    // show a friendly label for whichever selected rows happen to be on the current page; a row
    // from another page falls back to its id — matches Outbound Routes' established pattern.
    const labelById = new Map(data.map((announcement) => [announcement.id, announcement.name]))

    if (bulkAction === 'delete') {
      setDeleteTargets(selectedAnnouncementIds.map((id) => ({ id, name: labelById.get(id) ?? id })))
      return
    }

    setToggleTargetIds([...selectedAnnouncementIds])
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedAnnouncementIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'toggle', label: 'Toggle', disabled: !canBulkToggle },
          { value: 'delete', label: 'Delete', disabled: !canManageAll },
        ]}
        aria-label="Select action"
      />
      <Button type="primary" disabled={!bulkAction} onClick={handleApplyBulkAction}>
        Apply
      </Button>
    </Space>
  )

  /**
   * Custom toolbar (replaces ModuleHeader's default `filters`+`primaryAction` composition) so the
   * three logical groups — [Reset+Search], [Show All], [Add] — regroup responsively via plain
   * flexbox wrapping rather than ModuleHeader's generic even-wrap, matching the desired shape:
   * desktop/tablet one row (search cluster left, Show All + Add right); mobile Search takes its
   * own full-width row, Show All and Add share the next row. No media queries or window.innerWidth
   * — the two-line mobile grouping falls out naturally from flex-wrap once the search cluster's
   * own min width no longer fits beside the right-hand cluster.
   */
  const defaultToolbar = (
    <Flex wrap gap="middle" justify="space-between" align="center" style={{ width: '100%' }}>
      <Flex wrap gap="middle" align="center" style={{ flex: '1 1 260px', minWidth: 0 }}>
        <Tooltip title="Reset filters">
          <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
        </Tooltip>

        <AnnouncementFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
         {canManageAll && (
          <Tooltip title="Show announcements across all accessible domains">
            <Space size="small">
              <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all announcements" />
              <span>Show All</span>
            </Space>
          </Tooltip>
        )}
      </Flex>

      <Flex wrap gap="middle" align="center" style={{ flex: '0 0 auto' }}>
        {/* Show All is visible only for the module-admin tier, matching the audit's
            `actionPermission`-only gate (announcements.md §7/§14/§25) — narrower than the list's
            own overall view access. */}
       

        {(canManageAll || canAdd) && (
          // TODO: wrap with <PermissionGuard permission="announcement.add"> once RBAC
          // permissions are populated from the backend.
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Announcement
          </Button>
        )}
      </Flex>
    </Flex>
  )

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Announcements"
        count={totalRecords}
        toolbar={hasSelection ? selectionToolbar : defaultToolbar}
      />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No announcements match your search.' : 'No announcements found.'} />
      ) : (
        <AnnouncementTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canDeleteRow={canDeleteRow}
          canToggleRow={canToggleRow}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedAnnouncementIds}
          onSelectionChange={setSelectedAnnouncementIds}
        />
      )}

      <DeleteAnnouncementsModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ToggleAnnouncementsModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleToggleConfirm}
        onCancel={handleToggleCancel}
      />
    </Space>
  )
}

export default AnnouncementsPage
