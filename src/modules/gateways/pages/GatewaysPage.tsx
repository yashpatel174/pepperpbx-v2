import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import GatewayFilters from '../components/GatewayFilters'
import GatewayTable from '../components/GatewayTable'
import { useGateways } from '../useGateways'
import useGatewayPermissions from '../useGatewayPermissions'
import type { Gateway } from '../gateway.types'
import type { StartStopAction } from '../gateway.service'

type BulkAction = 'start' | 'stop' | 'toggle' | 'delete'

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
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const [selectedGatewayIds, setSelectedGatewayIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)

  const hasSelection = selectedGatewayIds.length > 0

  useEffect(() => {
    if (selectedGatewayIds.length === 0) setBulkAction(undefined)
  }, [selectedGatewayIds])

  const clearSelection = () => {
    setSelectedGatewayIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/account/gateways/add')

  const handleEdit = (gateway: Gateway) => navigate(`/account/gateways/${gateway.id}/edit`)

  const handleCopy = (gateway: Gateway) => {
    modal.confirm({
      title: 'Copy Gateway',
      content: 'Do you really want to copy this gateway?',
      okText: 'Copy',
      onOk: async () => {
        try {
          await copyGateway(gateway.id)
          message.success(`Gateway ${gateway.gateway} copied.`)
        } catch (err) {
          message.error(err instanceof Error ? err.message : `Failed to copy gateway ${gateway.gateway}.`)
        }
      },
    })
  }

  const handleDeleteRow = (gateway: Gateway) => {
    modal.confirm({
      title: 'Delete Gateway',
      content: `Are you sure you want to delete gateway ${gateway.gateway}?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeGateways([gateway.id])
          message.success(`Gateway ${gateway.gateway} deleted.`)
        } catch (err) {
          message.error(err instanceof Error ? err.message : `Failed to delete gateway ${gateway.gateway}.`)
        }
      },
    })
  }

  // Inline pills act immediately, no confirmation — distinct from the bulk-action popups below.
  const handleToggleEnabled = async (gateway: Gateway) => {
    try {
      await toggleGatewaysStatus([gateway.id])
      message.success(`Gateway ${gateway.gateway} ${gateway.enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to update gateway ${gateway.gateway}.`)
    }
  }

  const handleStartStop = async (gateway: Gateway) => {
    const action: StartStopAction = gateway.status === 'Stopped' ? 'start' : 'stop'
    try {
      await startStopSelected([gateway.id], action)
      message.success(`Gateway ${gateway.gateway} ${action === 'start' ? 'started' : 'stopped'}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to update gateway ${gateway.gateway}.`)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedGatewayIds.length === 0) return
    const ids = [...selectedGatewayIds]
    const count = ids.length
    const plural = count === 1 ? '' : 's'

    if (bulkAction === 'delete') {
      modal.confirm({
        title: 'Delete Gateway',
        content: `Are you sure you want to delete ${count === 1 ? 'this gateway' : `these ${count} gateways`}?`,
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await removeGateways(ids)
            message.success(`${count} gateway${plural} deleted.`)
          } catch (err) {
            message.error(err instanceof Error ? err.message : 'Failed to delete selected gateways.')
          } finally {
            clearSelection()
          }
        },
        onCancel: clearSelection,
      })
      return
    }

    if (bulkAction === 'toggle') {
      modal.confirm({
        title: 'Toggle Gateways',
        content: 'Do you really want to toggle this?',
        okText: 'Toggle',
        onOk: async () => {
          try {
            await toggleGatewaysStatus(ids)
            message.success(`${count} gateway${plural} toggled.`)
          } catch (err) {
            message.error(err instanceof Error ? err.message : 'Failed to toggle selected gateways.')
          } finally {
            clearSelection()
          }
        },
        onCancel: clearSelection,
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

    modal.confirm({
      title: bulkAction === 'start' ? 'Start Gateways' : 'Stop Gateways',
      content: `Do you really want to ${bulkAction} this?`,
      okText: bulkAction === 'start' ? 'Start' : 'Stop',
      onOk: async () => {
        try {
          await startStopSelected(registeringIds, bulkAction)
          message.success(`${registeringCount} gateway${registeringPlural} ${bulkAction === 'start' ? 'started' : 'stopped'}.`)
        } catch (err) {
          message.error(err instanceof Error ? err.message : `Failed to ${bulkAction} selected gateways.`)
        } finally {
          clearSelection()
        }
      },
      onCancel: clearSelection,
    })
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
    </Space>
  )
}

export default GatewaysPage
