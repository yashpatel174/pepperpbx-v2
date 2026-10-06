import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { CalendarOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage } from '../../../services/api/apiError'
import TimeGroupFilters from '../components/TimeGroupFilters'
import TimeGroupTable from '../components/TimeGroupTable'
import DeleteTimeGroupModal from '../components/DeleteTimeGroupModal'
import type { DeleteTarget } from '../components/DeleteTimeGroupModal'
import CopyTimeGroupModal from '../components/CopyTimeGroupModal'
import { timeGroupPaths } from '../time-group.constants'
import { presetPaths } from '../presets/time-group-preset.constants'
import { useTimeGroups } from '../useTimeGroups'
import useTimeGroupPermissions from '../useTimeGroupPermissions'
import type { TimeGroup } from '../time-group.types'

/**
 * Delete only — the one bulk action Axion's toolbar offers. Its Toggle branch exists in code but is
 * unreachable (time-groups.md §21/§28), and with no Enabled column or field anywhere a toggle would
 * flip a flag the user can't see, so it isn't ported.
 */
type BulkAction = 'delete'

const pluralize = (count: number) => `${count} time group${count === 1 ? '' : 's'}`

const TimeGroupsPage = () => {
  const {
    data,
    loading,
    initialized,
    error,
    totalRecords,
    wildCardDomains,
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
    removeTimeGroups,
    duplicateTimeGroup,
  } = useTimeGroups()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useTimeGroupPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [copyTarget, setCopyTarget] = useState<TimeGroup | null>(null)
  const [copySubmitting, setCopySubmitting] = useState(false)

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  // Axion: module admin AND (`pbx_axiontech` OR more than one wildcard domain) (§7/§15). Axion's
  // dead `?? false` fallback (§28) has no equivalent here.
  const canShowAll = canManageAll && wildCardDomains.length > 1

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  // Selection spans pages (keyed by uuid, the table preserves off-page keys), so remember each row's
  // name as pages load for the bulk-delete list — same pattern as the sibling modules.
  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((item) => nameByIdRef.current.set(item.dialplan_uuid, item.dialplan_name))
  }, [data])

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids)
    if (ids.length === 0) setBulkAction(undefined)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeTimeGroups(ids)
    message.success(`${pluralize(ids.length)} deleted.`)
    setDeleteTargets(null)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    const remaining = selectedIds.filter((id) => !ids.includes(id))
    setSelectedIds(remaining)
    if (remaining.length === 0) setBulkAction(undefined)
    setDeleteIsBulk(false)
  }

  const handleApplyBulkAction = () => {
    if (bulkAction !== 'delete' || !hasSelection) return
    setDeleteIsBulk(true)
    setDeleteTargets(selectedIds.map((id) => ({ id, name: nameByIdRef.current.get(id) ?? id })))
  }

  // Copy success re-fetches and clears the row selection, as Axion does (§3 Copy step 4).
  const handleCopySubmit = async (name: string) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await duplicateTimeGroup(copyTarget.dialplan_uuid, name)
      message.success(`Time group ${copyTarget.dialplan_name} copied.`)
      setCopyTarget(null)
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy time group ${copyTarget.dialplan_name}.`))
    } finally {
      setCopySubmitting(false)
    }
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>
        You have selected {selectedIds.length} {selectedIds.length === 1 ? 'row' : 'rows'}
      </Typography.Text>
      {/* TODO: gate with <PermissionGuard permission="timegroup.manage"> (pbx_timeconditions_all) once RBAC is populated. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160, maxWidth: '100%' }}
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

  // Full-page skeleton only for the first load; later fetches use the table's own spinner.
  if (!initialized) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Time Groups"
        count={totalRecords}
        // Axion's toolbar "Presets" button, gated like Add (`all || add`, time-groups.md §14).
        actions={
          canAddRecord
            ? [{ key: 'presets', label: 'Presets', icon: <CalendarOutlined />, onClick: () => navigate(presetPaths.list) }]
            : []
        }
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="timegroup.add"> (pbx_timeconditions_add) once RBAC is populated.
                key: 'add',
                label: 'Add Time Group',
                icon: <PlusOutlined />,
                onClick: () => navigate(timeGroupPaths.add),
              }
            : undefined
        }
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <TimeGroupFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            {canShowAll && (
              // TODO: gate with <PermissionGuard permission="timegroup.manage"> (pbx_timeconditions_all) once RBAC is populated.
              <Tooltip title="Show time groups across all accessible domains">
                <Space size="small">
                  <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all time groups" />
                  <span>Show All</span>
                </Space>
              </Tooltip>
            )}
          </>
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : totalRecords === 0 && !loading ? (
        <EmptyState description={committedSearch ? 'No time groups match your search.' : 'No time groups found.'} />
      ) : (
        <TimeGroupTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canCopyRow={canCopyRow}
          canDeleteRow={canDeleteRow}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(item) => navigate(timeGroupPaths.edit(item.dialplan_uuid))}
          onCopy={setCopyTarget}
          onDelete={(item) => {
            setDeleteIsBulk(false)
            setDeleteTargets([{ id: item.dialplan_uuid, name: item.dialplan_name }])
          }}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <DeleteTimeGroupModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTargets(null)
          // Closing a bulk delete clears the selection, as Axion's Close does (§20); cancelling a
          // row's Delete leaves an unrelated multi-page selection alone.
          if (deleteIsBulk) clearSelection()
          setDeleteIsBulk(false)
        }}
      />

      <CopyTimeGroupModal
        open={!!copyTarget}
        target={copyTarget}
        submitting={copySubmitting}
        onSubmit={handleCopySubmit}
        onCancel={() => setCopyTarget(null)}
      />
    </Space>
  )
}

export default TimeGroupsPage
