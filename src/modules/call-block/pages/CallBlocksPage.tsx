import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Flex, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import CallBlockFilters from '../components/CallBlockFilters'
import CallBlockTable from '../components/CallBlockTable'
import DeleteCallBlockModal from '../components/DeleteCallBlockModal'
import type { DeleteTarget } from '../components/DeleteCallBlockModal'
import ToggleCallBlockModal from '../components/ToggleCallBlockModal'
import CopyCallBlockModal from '../components/CopyCallBlockModal'
import { copyCallBlock } from '../call-block.service'
import { useCallBlocks } from '../useCallBlocks'
import useCallBlockPermissions from '../useCallBlockPermissions'
import type { CallBlock } from '../call-block.types'

/**
 * Bulk actions are limited to Toggle + Delete — the audit's bulk-action select only wires those
 * two (call-block.md §21: "a commented-out Copy option exists but is inert"), so that dead branch
 * is deliberately not reproduced here either.
 */
type BulkAction = 'toggle' | 'delete'

const callBlockLabel = (callBlock: CallBlock) => callBlock.call_block_name ?? callBlock.call_block_number ?? callBlock.call_block_uuid

const CallBlocksPage = () => {
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
    removeCallBlocks,
    toggleCallBlocksStatus,
  } = useCallBlocks()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useCallBlockPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedCallBlockIds, setSelectedCallBlockIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  const [copyTarget, setCopyTarget] = useState<CallBlock | null>(null)

  const hasSelection = selectedCallBlockIds.length > 0
  // Row Edit is reachable by view-only users too (read-only form); row Delete and the bulk Delete
  // option require the module-admin tier; Copy and bulk Toggle also allow Add-permission holders
  // — all matching the audit's documented per-action permission split (call-block.md §14).
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  const canToggleRow = canManageAll || canEdit
  const canBulkToggle = canManageAll || canAdd

  useEffect(() => {
    if (selectedCallBlockIds.length === 0) setBulkAction(undefined)
  }, [selectedCallBlockIds])

  // Accumulates call_block_name/number labels (via callBlockLabel's own name→number→uuid
  // priority) across every page this session has fetched (reusing the same `data` the table
  // already renders — no extra request). A row can only ever be selected after appearing in
  // `data` at least once, so by the time a bulk delete is confirmed, every selected id's label is
  // already known here even if that row's page isn't the one currently loaded.
  const callBlockLabelByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((callBlock) => {
      callBlockLabelByIdRef.current.set(callBlock.call_block_uuid, callBlockLabel(callBlock))
    })
  }, [data])

  const clearSelection = () => {
    setSelectedCallBlockIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/call-block/add')
  const handleEdit = (callBlock: CallBlock) => navigate(`/call-block/${callBlock.call_block_uuid}/edit`)

  const handleCopyClick = (callBlock: CallBlock) => setCopyTarget(callBlock)

  const handleCopyConfirm = async () => {
    if (!copyTarget) return
    try {
      await copyCallBlock(copyTarget.call_block_uuid)
      message.success(`Call block ${callBlockLabel(copyTarget)} copied.`)
      setCopyTarget(null)
      await refresh()
      clearSelection()
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to copy call block ${callBlockLabel(copyTarget)}.`)
    }
  }

  const handleDeleteRequest = (callBlock: CallBlock) => {
    setDeleteTargets([{ id: callBlock.call_block_uuid, label: callBlockLabel(callBlock) }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeCallBlocks(ids)
    message.success(`${ids.length} call block${ids.length === 1 ? '' : 's'} deleted.`)
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
    await toggleCallBlocksStatus(toggleTargetIds)
    message.success(`${count} call block${count === 1 ? '' : 's'} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const handleToggleCancel = () => {
    setToggleTargetIds(null)
    clearSelection()
  }

  // Inline pill acts immediately, no confirmation — matches the audit's row Status behavior
  // (call-block.md §3/§11/§25), distinct from the confirmed bulk Toggle flow above.
  const handleToggleStatus = async (callBlock: CallBlock) => {
    try {
      await toggleCallBlocksStatus([callBlock.call_block_uuid])
      message.success(`Call block ${callBlockLabel(callBlock)} ${callBlock.call_block_enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to update call block ${callBlockLabel(callBlock)}.`)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedCallBlockIds.length === 0) return
    // Row selection is preserved across pages (preserveSelectedRowKeys), so a selection can span
    // pages the table isn't currently showing. The delete/toggle targets must come from the full
    // selectedCallBlockIds list, not from `data` (only the current page) — otherwise IDs selected
    // on another page would be silently dropped. The friendly label comes from
    // callBlockLabelByIdRef (accumulated across every page fetched this session, see above),
    // falling back to the raw id only if a selected call block was somehow never fetched.
    if (bulkAction === 'delete') {
      setDeleteTargets(selectedCallBlockIds.map((id) => ({ id, label: callBlockLabelByIdRef.current.get(id) ?? id })))
      return
    }

    setToggleTargetIds([...selectedCallBlockIds])
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedCallBlockIds.length} rows</Typography.Text>
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

  const defaultToolbar = (
    <Flex wrap gap="middle" justify="space-between" align="center" style={{ width: '100%' }}>
      <Flex wrap gap="middle" align="center" style={{ flex: '1 1 260px', minWidth: 0 }}>
        <Tooltip title="Reset filters">
          <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
        </Tooltip>

        <CallBlockFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />

        {/* Show All is visible only for the module-admin tier, matching the audit's
            `isShowAll`-gate concept (call-block.md §7/§14/§25) — narrower than the list's own
            overall view access. */}
        {canManageAll && (
          <Tooltip title="Show call blocks across all accessible domains">
            <Space size="small">
              <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all call blocks" />
              <span>Show All</span>
            </Space>
          </Tooltip>
        )}
      </Flex>

      <Flex wrap gap="middle" align="center" style={{ flex: '0 0 auto' }}>
        {(canManageAll || canAdd) && (
          // TODO: wrap with <PermissionGuard permission="callBlock.add"> once RBAC
          // permissions are populated from the backend.
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Call Block
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
      <ModuleHeader title="Call Block" count={totalRecords} toolbar={hasSelection ? selectionToolbar : defaultToolbar} />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No call blocks match your search.' : 'No call blocks found.'} />
      ) : (
        <CallBlockTable
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
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onCopy={handleCopyClick}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedCallBlockIds}
          onSelectionChange={setSelectedCallBlockIds}
        />
      )}

      <DeleteCallBlockModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ToggleCallBlockModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleToggleConfirm}
        onCancel={handleToggleCancel}
      />

      <CopyCallBlockModal open={!!copyTarget} target={copyTarget} onConfirm={handleCopyConfirm} onCancel={() => setCopyTarget(null)} />
    </Space>
  )
}

export default CallBlocksPage
