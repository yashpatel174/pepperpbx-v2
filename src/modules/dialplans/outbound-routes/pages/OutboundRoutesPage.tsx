import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../../components/feedback/ErrorState'
import LoadingState from '../../../../components/feedback/LoadingState'
import EmptyState from '../../../../components/feedback/EmptyState'
import PermissionDenied from '../../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import OutboundRouteFilters from '../components/OutboundRouteFilters'
import OutboundRouteTable from '../components/OutboundRouteTable'
import DeleteOutboundRoutesModal from '../components/DeleteOutboundRoutesModal'
import type { DeleteTarget } from '../components/DeleteOutboundRoutesModal'
import ToggleOutboundRoutesModal from '../components/ToggleOutboundRoutesModal'
import CopyOutboundRouteModal from '../components/CopyOutboundRouteModal'
import { copyOutboundRoute } from '../outbound-route.service'
import { useOutboundRoutes } from '../useOutboundRoutes'
import useOutboundRoutePermissions from '../useOutboundRoutePermissions'
import type { OutboundRoute } from '../outbound-route.types'

/**
 * Bulk actions are limited to Toggle + Delete — the audit's `tableActionOptions` list only wires
 * those two; a bulk Copy branch exists in the Axion source but is commented out/dead
 * (outbound-routes.md §12/§21/§26), so it's deliberately not implemented here either.
 */
type BulkAction = 'toggle' | 'delete'

const OutboundRoutesPage = () => {
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
    removeOutboundRoutes,
    toggleOutboundRoutesStatus,
  } = useOutboundRoutes()

  const { canManage } = useOutboundRoutePermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  const [copyTarget, setCopyTarget] = useState<OutboundRoute | null>(null)

  const hasSelection = selectedRouteIds.length > 0

  useEffect(() => {
    if (selectedRouteIds.length === 0) setBulkAction(undefined)
  }, [selectedRouteIds])

  const clearSelection = () => {
    setSelectedRouteIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/dialplans/outbound-routes/add')
  const handleEdit = (route: OutboundRoute) => navigate(`/dialplans/outbound-routes/${route.id}/edit`)

  const handleCopyClick = (route: OutboundRoute) => setCopyTarget(route)

  const handleCopyConfirm = async () => {
    if (!copyTarget) return
    try {
      await copyOutboundRoute(copyTarget.id)
      message.success(`Outbound route ${copyTarget.name} copied.`)
      setCopyTarget(null)
      await refresh()
      clearSelection()
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to copy outbound route ${copyTarget.name}.`)
    }
  }

  const handleDeleteRequest = (route: OutboundRoute) => {
    setDeleteTargets([{ id: route.id, name: route.name }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeOutboundRoutes(ids)
    message.success(`${ids.length} outbound route${ids.length === 1 ? '' : 's'} deleted.`)
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
    await toggleOutboundRoutesStatus(toggleTargetIds)
    message.success(`${count} outbound route${count === 1 ? '' : 's'} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const handleToggleCancel = () => {
    setToggleTargetIds(null)
    clearSelection()
  }

  // Inline pill acts immediately, no confirmation — matches the audit's row Status behavior
  // (outbound-routes.md §3/§11/§26), distinct from the confirmed bulk Toggle flow above.
  const handleToggleStatus = async (route: OutboundRoute) => {
    try {
      await toggleOutboundRoutesStatus([route.id])
      message.success(`Outbound route ${route.name} ${route.enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to update outbound route ${route.name}.`)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedRouteIds.length === 0) return
    const rows = data.filter((route) => selectedRouteIds.includes(route.id))

    if (bulkAction === 'delete') {
      setDeleteTargets(rows.map((route) => ({ id: route.id, name: route.name })))
      return
    }

    setToggleTargetIds(rows.map((route) => route.id))
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedRouteIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
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
        title="Outbound Routes"
        count={totalRecords}
        primaryAction={{
          key: 'add',
          // TODO: wrap with <PermissionGuard permission="outboundRoute.create"> once RBAC
          // permissions are populated from the backend.
          label: 'Add Outbound Route',
          icon: <PlusOutlined />,
          onClick: handleAdd,
        }}
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>

            <OutboundRouteFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />

            <Tooltip title="Show outbound routes across all accessible domains">
              <Space size="small">
                <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all outbound routes" />
                <span>Show All</span>
              </Space>
            </Tooltip>
          </>
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!canManage ? (
        <PermissionDenied />
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No outbound routes match your search.' : 'No outbound routes found.'} />
      ) : (
        <OutboundRouteTable
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
          onCopy={handleCopyClick}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedRouteIds}
          onSelectionChange={setSelectedRouteIds}
        />
      )}

      <DeleteOutboundRoutesModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ToggleOutboundRoutesModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleToggleConfirm}
        onCancel={handleToggleCancel}
      />

      <CopyOutboundRouteModal
        open={!!copyTarget}
        target={copyTarget}
        onConfirm={handleCopyConfirm}
        onCancel={() => setCopyTarget(null)}
      />
    </Space>
  )
}

export default OutboundRoutesPage
