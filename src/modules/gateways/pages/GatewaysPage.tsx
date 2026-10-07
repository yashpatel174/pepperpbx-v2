import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import GatewayFilters from '../components/GatewayFilters'
import GatewayTable from '../components/GatewayTable'
import { useGateways } from '../useGateways'
import useGatewayPermissions from '../useGatewayPermissions'
import type { Gateway } from '../gateway.types'
import type { StartStopAction } from '../gateway.service'
import { getApiErrorMessage } from '../../../services/api/apiError'

type BulkAction = 'start' | 'stop' | 'toggle' | 'delete'

/** The action awaiting confirmation in the shared ConfirmActionModal. */
interface PendingConfirm {
  title: string
  content: ReactNode
  confirmText: string
  danger?: boolean
  errorMessage: string
  /** Bulk actions clear the selection when cancelled; row actions leave it alone. */
  bulk: boolean
  /** Performs the action and its success feedback; a rejection keeps the modal open. */
  run: () => Promise<void>
}

const GatewaysPage = () => {
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
    removeGateways,
    toggleGatewaysStatus,
    startStopSelected,
    copyGateway,
  } = useGateways()

  const { canManage } = useGatewayPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedGatewayIds, setSelectedGatewayIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  // Kept separate from pendingConfirm so the dialog keeps its content through the close animation.
  const [confirmOpen, setConfirmOpen] = useState(false)

  const hasSelection = selectedGatewayIds.length > 0

  useEffect(() => {
    if (selectedGatewayIds.length === 0) setBulkAction(undefined)
  }, [selectedGatewayIds])

  // Accumulates gateway-name labels across every page this session has fetched (reusing the same
  // `data` the table already renders — no extra request). A row can only ever be selected after
  // appearing in `data` at least once, so by the time a bulk delete is confirmed, every selected
  // id's label is already known here even if that row's page isn't the one currently loaded.
  const gatewayLabelByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((gateway) => {
      gatewayLabelByIdRef.current.set(gateway.id, gateway.gateway)
    })
  }, [data])

  const clearSelection = () => {
    setSelectedGatewayIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/account/gateways/add')

  const handleEdit = (gateway: Gateway) => navigate(`/account/gateways/${gateway.id}/edit`)

  const openConfirm = (confirm: PendingConfirm) => {
    setPendingConfirm(confirm)
    setConfirmOpen(true)
  }

  const handleCopy = (gateway: Gateway) => {
    openConfirm({
      title: 'Copy Gateway',
      content: 'Do you really want to copy this gateway?',
      confirmText: 'Copy',
      errorMessage: `Failed to copy gateway ${gateway.gateway}.`,
      bulk: false,
      run: async () => {
        await copyGateway(gateway.id)
        message.success(`Gateway "${gateway.gateway}" copied successfully.`)
      },
    })
  }

  const handleDeleteRow = (gateway: Gateway) => {
    openConfirm({
      title: 'Delete Gateway',
      content: `Are you sure you want to delete gateway ${gateway.gateway}?`,
      confirmText: 'Delete',
      danger: true,
      errorMessage: `Failed to delete gateway ${gateway.gateway}.`,
      bulk: false,
      run: async () => {
        await removeGateways([gateway.id])
        message.success(`Gateway "${gateway.gateway}" deleted successfully.`)
        // Drop only the deleted row — an unrelated multi-page selection stays intact.
        setSelectedGatewayIds((ids) => ids.filter((id) => id !== gateway.id))
      },
    })
  }

  // Inline pills act immediately, no confirmation — distinct from the bulk-action popups below.
  const handleToggleEnabled = async (gateway: Gateway) => {
    try {
      await toggleGatewaysStatus([gateway.id])
      message.success(`Gateway "${gateway.gateway}" ${gateway.enabled ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update gateway ${gateway.gateway}.`))
    }
  }

  const handleStartStop = async (gateway: Gateway) => {
    const action: StartStopAction = gateway.status === 'Stopped' ? 'start' : 'stop'
    try {
      await startStopSelected([gateway.id], action)
      message.success(`Gateway "${gateway.gateway}" ${action === 'start' ? 'started' : 'stopped'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update gateway ${gateway.gateway}.`))
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedGatewayIds.length === 0) return
    const ids = [...selectedGatewayIds]
    const count = ids.length
    const plural = count === 1 ? '' : 's'

    if (bulkAction === 'delete') {
      // Display-only: names are resolved from gatewayLabelByIdRef purely for the confirmation
      // list. `ids` (passed to removeGateways below) is untouched — always the raw selected
      // gateway_uuid values, never a display value.
      openConfirm({
        title: 'Delete Gateway',
        content: (
          <div>
            <p>Are you sure you want to delete {count === 1 ? 'this gateway' : `these ${count} gateways`}?</p>
            <ul style={{ paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
              {ids.map((id) => (
                <li key={id}>{gatewayLabelByIdRef.current.get(id) ?? id}</li>
              ))}
            </ul>
          </div>
        ),
        confirmText: 'Delete',
        danger: true,
        errorMessage: 'Failed to delete selected gateways.',
        bulk: true,
        run: async () => {
          await removeGateways(ids)
          message.success(
            count === 1
              ? `Gateway "${gatewayLabelByIdRef.current.get(ids[0]) ?? ids[0]}" deleted successfully.`
              : `${count} gateway${plural} deleted.`
          )
          clearSelection()
        },
      })
      return
    }

    if (bulkAction === 'toggle') {
      openConfirm({
        title: 'Toggle Gateways',
        content: `Do you really want to toggle the status of ${count === 1 ? 'this gateway' : `these ${count} gateways`}?`,
        confirmText: 'Toggle',
        errorMessage: 'Failed to toggle selected gateways.',
        bulk: true,
        run: async () => {
          await toggleGatewaysStatus(ids)
          message.success(`${count} gateway${plural} toggled.`)
          clearSelection()
        },
      })
      return
    }

    // start | stop — only gateways that register with a SIP server have a start/stop concept,
    // matching the inline Gateway Action pill's own `register === true` gate (see GatewayTable.tsx).
    const registeringIds = ids.filter((id) => data.find((gateway) => gateway.id === id)?.register)
    if (registeringIds.length === 0) {
      message.warning('No eligible gateways selected — only registering gateways can be started or stopped.')
      return
    }
    const registeringCount = registeringIds.length
    const registeringPlural = registeringCount === 1 ? '' : 's'
    const action = bulkAction

    openConfirm({
      title: action === 'start' ? 'Start Gateways' : 'Stop Gateways',
      content: `Do you really want to ${action} ${registeringCount === 1 ? 'this gateway' : 'these gateways'}?`,
      confirmText: action === 'start' ? 'Start' : 'Stop',
      errorMessage: `Failed to ${action} selected gateways.`,
      bulk: true,
      run: async () => {
        await startStopSelected(registeringIds, action)
        message.success(`${registeringCount} gateway${registeringPlural} ${action === 'start' ? 'started' : 'stopped'}.`)
        clearSelection()
      },
    })
  }

  const handleConfirmAction = async () => {
    if (!pendingConfirm) return
    await pendingConfirm.run()
    setConfirmOpen(false)
  }

  // Cancelling a bulk action clears the selection (as before); cancelling a row action leaves it alone.
  const handleCancelConfirm = () => {
    if (pendingConfirm?.bulk) clearSelection()
    setConfirmOpen(false)
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedGatewayIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'start', label: 'Start' },
          { value: 'stop', label: 'Stop' },
          { value: 'toggle', label: 'Toggle' },
          { value: 'delete', label: 'Delete' },
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

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Gateways"
        count={totalRecords}
        // Add/Search/Show All are only meaningful once the user can actually manage gateways —
        // per gateway.md, an unauthorized user sees just the title while the whole toolbar
        // (not only the table) is replaced by the permission-denied state below.
        primaryAction={
          canManage
            ? {
                key: 'add',
                // TODO: wrap with <PermissionGuard permission="gateway.manage"> once RBAC
                // permissions are populated from the backend — not gated in the Axion reference either.
                label: 'Add Gateway',
                icon: <PlusOutlined />,
                onClick: handleAdd,
              }
            : undefined
        }
        filters={
          canManage ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <GatewayFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              <Tooltip title="Show gateways across all accessible domains">
                <Space size="small">
                  <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all gateways" />
                  <span>Show All</span>
                </Space>
              </Tooltip>
            </>
          ) : undefined
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!canManage ? (
        <PermissionDenied />
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No gateways match your search.' : 'No gateways found.'} />
      ) : (
        <GatewayTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canManage={canManage}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onDelete={handleDeleteRow}
          onToggleEnabled={handleToggleEnabled}
          onStartStop={handleStartStop}
          selectedRowKeys={selectedGatewayIds}
          onSelectionChange={setSelectedGatewayIds}
        />
      )}

      <ConfirmActionModal
        open={confirmOpen}
        title={pendingConfirm?.title}
        confirmText={pendingConfirm?.confirmText ?? ''}
        danger={pendingConfirm?.danger}
        errorMessage={pendingConfirm?.errorMessage ?? ''}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
        afterClose={() => setPendingConfirm(null)}
      >
        {pendingConfirm?.content}
      </ConfirmActionModal>
    </Space>
  )
}

export default GatewaysPage
