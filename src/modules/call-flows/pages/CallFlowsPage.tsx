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
import CallFlowsFilters from '../components/CallFlowsFilters'
import CallFlowsTable from '../components/CallFlowsTable'
import CopyCallFlowModal from '../components/CopyCallFlowModal'
import type { CopyCallFlowValues } from '../components/CopyCallFlowModal'
import DeleteCallFlowModal from '../components/DeleteCallFlowModal'
import type { DeleteTarget } from '../components/DeleteCallFlowModal'
import ToggleCallFlowsModal from '../components/ToggleCallFlowsModal'
import { callFlowPaths, callFlowToggleKeyLabels, pendingToggleKey } from '../call-flows.constants'
import { getHiveCallFlowDetails } from '../call-flows.service'
import { useCallFlows } from '../useCallFlows'
import useCallFlowPermissions from '../useCallFlowPermissions'
import type { CallFlow, CallFlowHiveDetails, CallFlowToggleKey } from '../call-flows.types'

/** Delete + Toggle only — Axion's bulk Copy is commented-out dead code and not ported (§21). */
type BulkAction = 'delete' | 'toggle'

const pluralize = (count: number) => `${count} call flow${count === 1 ? '' : 's'}`

const CallFlowsPage = () => {
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
    removeCallFlows,
    toggleCallFlowsKey,
    duplicateCallFlow,
  } = useCallFlows()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useCallFlowPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [copyTarget, setCopyTarget] = useState<CallFlow | null>(null)
  const [copyHive, setCopyHive] = useState<CallFlowHiveDetails | null>(null)
  const [copyHiveError, setCopyHiveError] = useState(false)
  const [copySubmitting, setCopySubmitting] = useState(false)
  // Row toggles in flight, keyed by uuid + flag. The ref blocks a re-click before React re-renders.
  const pendingTogglesRef = useRef<Set<string>>(new Set())
  const [pendingToggles, setPendingToggles] = useState<ReadonlySet<string>>(new Set())
  const copyRequestRef = useRef(0)

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  // Row badges and bulk Toggle share one rule — see useCallFlowPermissions.
  const canToggle = canManageAll || canEdit
  // Axion: module admin AND (`pbx_axiontech` OR more than one wildcard domain) (§7/§15).
  const canShowAll = canManageAll && wildCardDomains.length > 1

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  // Selection spans pages (keyed by call_flow_uuid, the table preserves off-page keys), so remember
  // each row's name as pages load for the bulk-delete list — same pattern as the sibling modules.
  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((flow) => nameByIdRef.current.set(flow.call_flow_uuid, flow.call_flow_name))
  }, [data])

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids)
    if (ids.length === 0) setBulkAction(undefined)
  }

  const setTogglePending = (key: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(key)
    else pendingTogglesRef.current.delete(key)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Row badge click: toggles immediately, no confirmation (§3/§11).
  const handleRowToggle = async (flow: CallFlow, toggleKey: CallFlowToggleKey) => {
    const key = pendingToggleKey(flow.call_flow_uuid, toggleKey)
    if (pendingTogglesRef.current.has(key)) return
    setTogglePending(key, true)
    try {
      await toggleCallFlowsKey([flow.call_flow_uuid], toggleKey)
      message.success(`${callFlowToggleKeyLabels[toggleKey]} ${flow[toggleKey] ? 'disabled' : 'enabled'} for ${flow.call_flow_name}.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update call flow ${flow.call_flow_name}.`))
    } finally {
      setTogglePending(key, false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeCallFlows(ids)
    message.success(`${pluralize(ids.length)} deleted.`)
    setDeleteTargets(null)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    const remaining = selectedIds.filter((id) => !ids.includes(id))
    setSelectedIds(remaining)
    if (remaining.length === 0) setBulkAction(undefined)
    setDeleteIsBulk(false)
  }

  const handleBulkToggleConfirm = async (toggleKey: CallFlowToggleKey) => {
    if (!toggleTargetIds) return
    await toggleCallFlowsKey(toggleTargetIds, toggleKey)
    message.success(`${callFlowToggleKeyLabels[toggleKey]} toggled for ${pluralize(toggleTargetIds.length)}.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  // Copy stays in the source domain, so its bootstrap (autoExt + range) is that domain's (§15).
  const loadCopyHive = async (flow: CallFlow) => {
    const requestId = ++copyRequestRef.current
    setCopyHive(null)
    setCopyHiveError(false)
    try {
      const hive = await getHiveCallFlowDetails(flow.domain_name)
      if (requestId === copyRequestRef.current) setCopyHive(hive)
    } catch {
      if (requestId === copyRequestRef.current) setCopyHiveError(true)
    }
  }

  const handleCopyClick = (flow: CallFlow) => {
    setCopyTarget(flow)
    loadCopyHive(flow)
  }

  const closeCopy = () => {
    copyRequestRef.current++
    setCopyTarget(null)
    setCopyHive(null)
    setCopyHiveError(false)
  }

  const handleCopySubmit = async (values: CopyCallFlowValues) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await duplicateCallFlow(copyTarget.call_flow_uuid, values)
      message.success(`Call flow ${copyTarget.call_flow_name} copied.`)
      closeCopy()
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy call flow ${copyTarget.call_flow_name}.`))
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
      {/* TODO: gate with <PermissionGuard> once RBAC is populated — Delete: callflow.manage; Toggle: callflow.edit. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160, maxWidth: '100%' }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'delete', label: 'Delete', disabled: !canDeleteRow },
          { value: 'toggle', label: 'Toggle', disabled: !canToggle },
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
        title="Call Flows"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="callflow.add"> (pbx_callflow_add) once RBAC is populated.
                key: 'add',
                label: 'Add Call Flow',
                icon: <PlusOutlined />,
                onClick: () => navigate(callFlowPaths.add),
              }
            : undefined
        }
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <CallFlowsFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            {canShowAll && (
              // TODO: gate with <PermissionGuard permission="callflow.manage"> (pbx_callflow_all) once RBAC is populated.
              <Tooltip title="Show call flows across all accessible domains">
                <Space size="small">
                  <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all call flows" />
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
        <EmptyState description={committedSearch ? 'No call flows match your search.' : 'No call flows found.'} />
      ) : (
        <CallFlowsTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canCopyRow={canCopyRow}
          canDeleteRow={canDeleteRow}
          canToggleRow={canToggle}
          pendingToggles={pendingToggles}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(flow) => navigate(callFlowPaths.edit(flow.call_flow_uuid))}
          onCopy={handleCopyClick}
          onDelete={(flow) => {
            setDeleteIsBulk(false)
            setDeleteTargets([{ id: flow.call_flow_uuid, name: flow.call_flow_name }])
          }}
          onToggle={handleRowToggle}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <DeleteCallFlowModal
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

      <ToggleCallFlowsModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleBulkToggleConfirm}
        onCancel={() => {
          setToggleTargetIds(null)
          clearSelection()
        }}
      />

      <CopyCallFlowModal
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

export default CallFlowsPage
