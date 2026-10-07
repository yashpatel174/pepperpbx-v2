import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, TeamOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import CallCenterFilters from '../components/CallCenterFilters'
import CallCenterTable from '../components/CallCenterTable'
import DeleteCallCentersModal from '../components/DeleteCallCentersModal'
import type { DeleteTarget } from '../components/DeleteCallCentersModal'
import CopyCallCenterModal from '../components/CopyCallCenterModal'
import { copyCallCenter, getHiveCallCenterDetails } from '../call-center.service'
import { useCallCenters } from '../useCallCenters'
import useCallCenterPermissions from '../useCallCenterPermissions'
import type { CallCenter, HiveCallCenterDetails } from '../call-center.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

/**
 * Bulk actions: Delete only — matches the audit exactly (call-center.md §21: "row checkboxes +
 * select ('Delete' only, permission-gated) + Apply. Only delete wired; a commented-out copy
 * branch exists" — the dead bulk-copy branch is deliberately not reproduced here either).
 */
type BulkAction = 'delete'

const CallCentersPage = () => {
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
    removeCallCenters,
    toggleTierRulesApply,
  } = useCallCenters()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useCallCenterPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedCallCenterIds, setSelectedCallCenterIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [copyTarget, setCopyTarget] = useState<CallCenter | null>(null)
  const [copyHive, setCopyHive] = useState<HiveCallCenterDetails | null>(null)
  const [copyHiveError, setCopyHiveError] = useState(false)
  const [copySubmitting, setCopySubmitting] = useState(false)
  // Only the latest Copy bootstrap may apply — a slow response for a closed/replaced Copy target is ignored.
  const copyRequestRef = useRef(0)

  const hasSelection = selectedCallCenterIds.length > 0
  // Row Edit is reachable by view-only users too (read-only form); row Delete requires the
  // module-admin tier; Copy also allows Add-permission holders — matching the audit's documented
  // per-action permission split (call-center.md §14).
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  // Tier Rules Apply inline toggle — same edit tier as Call Block's/Announcements' Status pill.
  const canToggleRow = canManageAll || canEdit

  useEffect(() => {
    if (selectedCallCenterIds.length === 0) setBulkAction(undefined)
  }, [selectedCallCenterIds])

  // Accumulates queue-name labels across every page this session has fetched (reusing the same
  // `data` the table already renders — no extra request). A row can only ever be selected after
  // appearing in `data` at least once, so by the time a bulk delete is confirmed, every selected
  // id's label is already known here even if that row's page isn't the one currently loaded.
  const callCenterLabelByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((callCenter) => {
      callCenterLabelByIdRef.current.set(callCenter.id, callCenter.name)
    })
  }, [data])

  const clearSelection = () => {
    setSelectedCallCenterIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/call-center/add')
  // Global Agent management — NOT scoped to any particular queue (call-center.md §1/§29: the
  // Axion "Agents" button always opens the full Agent CRUD list, never a queue-filtered view).
  // Access to the destination page is enforced by its own useCallCenterAgentPermissions() check,
  // not by this button — deliberately not re-gating with a different, unrelated permission here
  // (call-center.md §28 documents Axion's own confirmed mismatch between the Queue-permission-
  // gated button and the Agent-permission-gated destination; this avoids reproducing it).
  const handleAgents = () => navigate('/call-center/agents')
  const handleEdit = (callCenter: CallCenter) => navigate(`/call-center/${callCenter.id}/edit`)

  const loadCopyHive = async (callCenter: CallCenter) => {
    const requestId = ++copyRequestRef.current
    setCopyHive(null)
    setCopyHiveError(false)
    try {
      const hive = await getHiveCallCenterDetails(callCenter.domain)
      if (requestId === copyRequestRef.current) setCopyHive(hive)
    } catch {
      if (requestId === copyRequestRef.current) setCopyHiveError(true)
    }
  }

  const handleCopyClick = (callCenter: CallCenter) => {
    setCopyTarget(callCenter)
    void loadCopyHive(callCenter)
  }

  const closeCopy = () => {
    copyRequestRef.current++
    setCopyTarget(null)
    setCopyHive(null)
    setCopyHiveError(false)
  }

  const handleCopyConfirm = async ({ name, extension }: { name: string; extension: string }) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await copyCallCenter(copyTarget.id, name, extension)
      message.success(`Call center queue "${copyTarget.name}" copied successfully.`)
      closeCopy()
      await refresh()
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy call center queue ${copyTarget.name}.`))
    } finally {
      setCopySubmitting(false)
    }
  }

  const handleDeleteRequest = (callCenter: CallCenter) => {
    setDeleteIsBulk(false)
    setDeleteTargets([{ id: callCenter.id, name: callCenter.name }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeCallCenters(ids)
    message.success(ids.length === 1 ? `Call center queue "${deleteTargets[0].name}" deleted successfully.` : `${ids.length} call center queues deleted.`)
    setDeleteTargets(null)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    setSelectedCallCenterIds((selected) => selected.filter((id) => !ids.includes(id)))
    setDeleteIsBulk(false)
  }

  const handleDeleteCancel = () => {
    setDeleteTargets(null)
    // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
    if (deleteIsBulk) clearSelection()
    setDeleteIsBulk(false)
  }

  // Inline pill acts immediately, no confirmation — matches every sibling module's identical row
  // Status behavior.
  const handleToggleTierRulesApply = async (callCenter: CallCenter) => {
    try {
      await toggleTierRulesApply(callCenter.id)
      message.success(`Call center queue "${callCenter.name}" tier rules ${callCenter.tierRulesApply ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update call center queue ${callCenter.name}.`))
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedCallCenterIds.length === 0) return
    // Row selection is preserved across pages (preserveSelectedRowKeys), so a selection can span
    // pages the table isn't currently showing. The delete targets must come from the full
    // selectedCallCenterIds list, not from `data` (only the current page) — otherwise IDs selected
    // on another page would be silently dropped. The friendly label comes from
    // callCenterLabelByIdRef (accumulated across every page fetched this session, see above),
    // falling back to the raw id only if a selected queue was somehow never fetched.
    setDeleteIsBulk(true)
    setDeleteTargets(selectedCallCenterIds.map((id) => ({ id, name: callCenterLabelByIdRef.current.get(id) ?? id })))
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedCallCenterIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[{ value: 'delete', label: 'Delete', disabled: !canManageAll }]}
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

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Call Center Queue"
        count={totalRecords}
        primaryAction={
          canManageAll || canAdd
            ? {
                // TODO: wrap with <PermissionGuard permission="callCenter.add"> once RBAC
                // permissions are populated from the backend.
                key: 'add',
                label: 'Add Call Center Queue',
                icon: <PlusOutlined />,
                onClick: handleAdd,
              }
            : undefined
        }
        // "Agents" opens the separate Agent module, which enforces its own permission (see
        // handleAgents) — so it stays visible regardless of this module's access.
        actions={[{ key: 'agents', label: 'Agents', icon: <TeamOutlined />, onClick: handleAgents }]}
        // Without any access the page shows PermissionDenied, so the filters are hidden too.
        filters={
          hasAnyAccess ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <CallCenterFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {/* Show All is visible only for the module-admin tier, matching the audit's
                  `isShowAll`-gate concept (call-center.md §7/§14/§25) — narrower than the list's own
                  overall view access. */}
              {canManageAll && (
                <Tooltip title="Show call center queues across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all call center queues" />
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
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No call center queues match your search.' : 'No call center queues found.'} />
      ) : (
        <CallCenterTable
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
          onToggleTierRulesApply={handleToggleTierRulesApply}
          selectedRowKeys={selectedCallCenterIds}
          onSelectionChange={setSelectedCallCenterIds}
        />
      )}

      <DeleteCallCentersModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <CopyCallCenterModal
        open={!!copyTarget}
        target={copyTarget}
        hive={copyHive}
        hiveError={copyHiveError}
        onRetryHive={() => copyTarget && loadCopyHive(copyTarget)}
        submitting={copySubmitting}
        onSubmit={handleCopyConfirm}
        onCancel={closeCopy}
      />
    </Space>
  )
}

export default CallCentersPage
