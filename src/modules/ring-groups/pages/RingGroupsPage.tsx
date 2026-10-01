import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage } from '../../../services/api/apiError'
import RingGroupFilters from '../components/RingGroupFilters'
import RingGroupTable from '../components/RingGroupTable'
import CopyRingGroupModal from '../components/CopyRingGroupModal'
import type { CopyRingGroupValues } from '../components/CopyRingGroupModal'
import DeleteRingGroupsModal from '../components/DeleteRingGroupsModal'
import type { DeleteTarget } from '../components/DeleteRingGroupsModal'
import ToggleRingGroupsModal from '../components/ToggleRingGroupsModal'
import { ringGroupPaths } from '../ring-group.constants'
import { getHiveRingGroupDetails } from '../ring-group.service'
import { useRingGroups } from '../useRingGroups'
import useRingGroupPermissions from '../useRingGroupPermissions'
import type { RingGroup, RingGroupHiveDetails } from '../ring-group.types'

/** Toggle + Delete only — Axion's bulk Copy branch is unreachable dead code and not ported (§21). */
type BulkAction = 'toggle' | 'delete'

const pluralize = (count: number) => `${count} ring group${count === 1 ? '' : 's'}`

const RingGroupsPage = () => {
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
    removeRingGroups,
    toggleRingGroupsEnabled,
    duplicateRingGroup,
  } = useRingGroups()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useRingGroupPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [copyTarget, setCopyTarget] = useState<RingGroup | null>(null)
  const [copyHive, setCopyHive] = useState<RingGroupHiveDetails | null>(null)
  const [copyHiveError, setCopyHiveError] = useState(false)
  const [copySubmitting, setCopySubmitting] = useState(false)
  // Row toggles in flight, keyed by uuid. The ref blocks a re-click before React re-renders.
  const pendingTogglesRef = useRef<Set<string>>(new Set())
  const [pendingToggles, setPendingToggles] = useState<ReadonlySet<string>>(new Set())
  const copyRequestRef = useRef(0)

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  const canToggleRow = canManageAll || canEdit
  // Axion disables bulk Toggle only when both the admin and add permissions are missing (§14).
  const canBulkToggle = canManageAll || canAdd
  // Axion: `pbx_axiontech` OR more than one wildcard domain, nothing else (§9/§15). TODO: the
  // `pbx_axiontech` bypass has no PepperPBX permission equivalent yet.
  const canShowAll = wildCardDomains.length > 1

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  // Selection spans pages (keyed by ring_group_uuid, the table preserves off-page keys), so remember
  // each row's name as pages load for the bulk-delete list — same pattern as the sibling modules.
  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((group) => nameByIdRef.current.set(group.ring_group_uuid, group.ring_group_name))
  }, [data])

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids)
    if (ids.length === 0) setBulkAction(undefined)
  }

  const setTogglePending = (uuid: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(uuid)
    else pendingTogglesRef.current.delete(uuid)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Status pill click: toggles immediately, no confirmation (§3/§11/§33).
  const handleRowToggle = async (group: RingGroup) => {
    if (pendingTogglesRef.current.has(group.ring_group_uuid)) return
    setTogglePending(group.ring_group_uuid, true)
    try {
      await toggleRingGroupsEnabled([group.ring_group_uuid])
      message.success(`Ring group ${group.ring_group_name} ${group.ring_group_enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update ring group ${group.ring_group_name}.`))
    } finally {
      setTogglePending(group.ring_group_uuid, false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeRingGroups(ids)
    message.success(`${pluralize(ids.length)} deleted.`)
    setDeleteTargets(null)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    const remaining = selectedIds.filter((id) => !ids.includes(id))
    setSelectedIds(remaining)
    if (remaining.length === 0) setBulkAction(undefined)
    setDeleteIsBulk(false)
  }

  const handleBulkToggleConfirm = async () => {
    if (!toggleTargetIds) return
    await toggleRingGroupsEnabled(toggleTargetIds)
    message.success(`${pluralize(toggleTargetIds.length)} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  // Copy stays in the source domain, so its bootstrap (autoExt + range) is that domain's (§15).
  const loadCopyHive = async (group: RingGroup) => {
    const requestId = ++copyRequestRef.current
    setCopyHive(null)
    setCopyHiveError(false)
    try {
      const hive = await getHiveRingGroupDetails(group.domain_name)
      if (requestId === copyRequestRef.current) setCopyHive(hive)
    } catch {
      if (requestId === copyRequestRef.current) setCopyHiveError(true)
    }
  }

  const handleCopyClick = (group: RingGroup) => {
    setCopyTarget(group)
    loadCopyHive(group)
  }

  const closeCopy = () => {
    copyRequestRef.current++
    setCopyTarget(null)
    setCopyHive(null)
    setCopyHiveError(false)
  }

  const handleCopySubmit = async (values: CopyRingGroupValues) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await duplicateRingGroup(copyTarget.ring_group_uuid, values)
      message.success(`Ring group ${copyTarget.ring_group_name} copied.`)
      closeCopy()
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy ring group ${copyTarget.ring_group_name}.`))
    } finally {
      setCopySubmitting(false)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || !hasSelection) return
    // Targets are the whole selection across pages, not just the rows on screen.
    if (bulkAction === 'delete') {
      setDeleteIsBulk(true)
      setDeleteTargets(selectedIds.map((id) => ({ id, name: nameByIdRef.current.get(id) ?? id })))
      return
    }
    setToggleTargetIds([...selectedIds])
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>
        You have selected {selectedIds.length} {selectedIds.length === 1 ? 'row' : 'rows'}
      </Typography.Text>
      {/* TODO: PermissionGuard once backend permission contract is confirmed — Delete: ring-group.manage; Toggle: ring-group.manage|add. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160, maxWidth: '100%' }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'toggle', label: 'Toggle', disabled: !canBulkToggle },
          { value: 'delete', label: 'Delete', disabled: !canDeleteRow },
        ]}
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
        title="Ring Groups"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: PermissionGuard once backend permission contract is confirmed — ring-group.add (pbx_ringgroups_add).
                key: 'add',
                label: 'Add Ring Group',
                icon: <PlusOutlined />,
                onClick: () => navigate(ringGroupPaths.add),
              }
            : undefined
        }
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <RingGroupFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            {canShowAll && (
              <Tooltip title="Show ring groups across all accessible domains">
                <Space size="small">
                  <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all ring groups" />
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
        <EmptyState description={committedSearch ? 'No ring groups match your search.' : 'No ring groups found.'} />
      ) : (
        <RingGroupTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canCopyRow={canCopyRow}
          canDeleteRow={canDeleteRow}
          canToggleRow={canToggleRow}
          pendingToggles={pendingToggles}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(group) => navigate(ringGroupPaths.edit(group.ring_group_uuid))}
          onCopy={handleCopyClick}
          onDelete={(group) => {
            setDeleteIsBulk(false)
            setDeleteTargets([{ id: group.ring_group_uuid, name: group.ring_group_name }])
          }}
          onToggle={handleRowToggle}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <DeleteRingGroupsModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTargets(null)
          // Closing a bulk delete clears the selection, as Axion's `onHide` does (§20); cancelling a
          // row's Delete leaves an unrelated multi-page selection alone.
          if (deleteIsBulk) clearSelection()
          setDeleteIsBulk(false)
        }}
      />

      <ToggleRingGroupsModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleBulkToggleConfirm}
        onCancel={() => {
          setToggleTargetIds(null)
          clearSelection()
        }}
      />

      <CopyRingGroupModal
        open={!!copyTarget}
        target={copyTarget}
        hive={copyHive}
        hiveError={copyHiveError}
        onRetryHive={() => copyTarget && loadCopyHive(copyTarget)}
        submitting={copySubmitting}
        onSubmit={handleCopySubmit}
        onCancel={closeCopy}
      />
    </Space>
  )
}

export default RingGroupsPage
