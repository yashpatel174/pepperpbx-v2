import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ConferenceControlFilters from '../components/ConferenceControlFilters'
import ConferenceControlTable from '../components/ConferenceControlTable'
import ToggleConferenceControlsModal from '../components/ToggleConferenceControlsModal'
import { conferenceControlPaths } from '../conference-control.constants'
import { useConferenceControls } from '../useConferenceControls'
import useConferenceControlPermissions from '../useConferenceControlPermissions'
import type { ConferenceControl } from '../conference-control.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

/** Toggle is the only bulk action — Axion has no bulk Delete or Copy for this module (§21). */
type BulkAction = 'toggle'

const pluralize = (count: number) => `${count} conference control${count === 1 ? '' : 's'}`

const ConferenceControlsPage = () => {
  const {
    data,
    loading,
    initialized,
    error,
    totalRecords,
    page,
    pageSize,
    searchTerm,
    committedSearch,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize,
    resetFilters,
    refresh,
    toggleConferenceControlsStatus,
  } = useConferenceControls()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useConferenceControlPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  // Inline toggles in flight, by uuid. The ref blocks a same-row re-click before React re-renders;
  // the state drives which Status cells render as not clickable.
  const pendingTogglesRef = useRef<Set<string>>(new Set())
  const [pendingToggles, setPendingToggles] = useState<ReadonlySet<string>>(new Set())

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canToggleRow = canManageAll || canEdit

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids)
    if (ids.length === 0) setBulkAction(undefined)
  }

  // Errors propagate to the modal, which stays open and reports them; selection is only cleared on success.
  const handleBulkToggleConfirm = async () => {
    if (!toggleTargetIds) return
    await toggleConferenceControlsStatus(toggleTargetIds)
    message.success(`${pluralize(toggleTargetIds.length)} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const setTogglePending = (uuid: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(uuid)
    else pendingTogglesRef.current.delete(uuid)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Inline Status click: toggles immediately, no confirmation (conference-controls.md §3/§5).
  const handleToggleStatus = async (control: ConferenceControl) => {
    const uuid = control.conference_control_uuid
    if (pendingTogglesRef.current.has(uuid)) return
    setTogglePending(uuid, true)
    try {
      await toggleConferenceControlsStatus([uuid])
      message.success(`Conference control "${control.control_name}" ${control.control_enabled ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update conference control ${control.control_name}.`))
    } finally {
      setTogglePending(uuid, false)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || !hasSelection) return
    setToggleTargetIds([...selectedIds])
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>
        {selectedIds.length} {selectedIds.length === 1 ? 'row' : 'rows'} selected
      </Typography.Text>
      {/* TODO: gate with <PermissionGuard permission="conference.edit"> once RBAC is populated. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[{ value: 'toggle', label: 'Toggle', disabled: !canToggleRow }]}
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

  // Full-page skeleton only for the very first load; later fetches use the table's own spinner.
  if (!initialized) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Conference Controls"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC is populated.
                key: 'add',
                label: 'Add Conference Control',
                icon: <PlusOutlined />,
                onClick: () => navigate(conferenceControlPaths.add),
              }
            : undefined
        }
        // Without access the page shows PermissionDenied, so the filters are hidden too.
        filters={
          hasAnyAccess ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <ConferenceControlFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            </>
          ) : undefined
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : totalRecords === 0 && !loading ? (
        <EmptyState description={committedSearch ? 'No conference controls match your search.' : 'No conference controls found.'} />
      ) : (
        <ConferenceControlTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          canEditRow={canEditRow}
          canToggleRow={canToggleRow}
          pendingToggles={pendingToggles}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(control) => navigate(conferenceControlPaths.edit(control.conference_control_uuid))}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <ToggleConferenceControlsModal
        open={!!toggleTargetIds}
        onConfirm={handleBulkToggleConfirm}
        onCancel={() => {
          // Closing the popup clears the selection, as Axion's `onHide` does (§20).
          setToggleTargetIds(null)
          clearSelection()
        }}
      />
    </Space>
  )
}

export default ConferenceControlsPage
