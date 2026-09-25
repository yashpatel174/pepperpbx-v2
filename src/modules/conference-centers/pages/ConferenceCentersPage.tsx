import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { ApartmentOutlined, AudioOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ConferenceCenterFilters from '../components/ConferenceCenterFilters'
import ConferenceCenterTable from '../components/ConferenceCenterTable'
import DeleteConferenceCentersModal from '../components/DeleteConferenceCentersModal'
import type { DeleteTarget } from '../components/DeleteConferenceCentersModal'
import ToggleConferenceCentersModal from '../components/ToggleConferenceCentersModal'
import { useConferenceCenters } from '../useConferenceCenters'
import useConferenceCenterPermissions from '../useConferenceCenterPermissions'
import type { ConferenceCenter } from '../conference-center.types'

type BulkAction = 'delete' | 'toggle'

const LIST_PATH = '/conference-centers'
/**
 * Neither module exists in PepperPBX yet, so both links resolve to the NotFound catch-all until
 * they're built. Active Conferences uses the same path the Conferences list already links to;
 * Conference Rooms uses the kebab-case route the future module is expected to register.
 */
const CONFERENCE_ROOMS_PATH = '/conferenceCenters/conferenceRooms/list'
const ACTIVE_CONFERENCES_PATH = '/activeConferences/list'

const pluralize = (count: number) => `${count} conference center${count === 1 ? '' : 's'}`

const ConferenceCentersPage = () => {
  const {
    data,
    loading,
    error,
    totalRecords,
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
    removeConferenceCenters,
    toggleConferenceCentersStatus,
  } = useConferenceCenters()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useConferenceCenterPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canToggleRow = canManageAll || canEdit
  const canDeleteRow = canManageAll

  // Selection survives paging, so remember each row's name for the bulk-delete list.
  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((center) => nameByIdRef.current.set(center.id, center.name))
  }, [data])

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids)
    if (ids.length === 0) setBulkAction(undefined)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeConferenceCenters(ids)
    message.success(`${pluralize(ids.length)} deleted.`)
    setDeleteTargets(null)
    clearSelection()
  }

  const handleToggleConfirm = async () => {
    if (!toggleTargetIds) return
    await toggleConferenceCentersStatus(toggleTargetIds)
    message.success(`${pluralize(toggleTargetIds.length)} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  // Inline Status click: no confirmation (conference-centers.md §3/§26).
  const handleToggleStatus = async (center: ConferenceCenter) => {
    try {
      await toggleConferenceCentersStatus([center.id])
      message.success(`Conference center ${center.name} ${center.enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Failed to update conference center ${center.name}.`)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || !hasSelection) return
    if (bulkAction === 'delete') {
      setDeleteTargets(selectedIds.map((id) => ({ id, name: nameByIdRef.current.get(id) ?? id })))
    } else {
      setToggleTargetIds([...selectedIds])
    }
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedIds.length} rows</Typography.Text>
      {/* TODO: gate options with <PermissionGuard> (conference.add / conference.manage) once RBAC is populated. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'delete', label: 'Delete', disabled: !canDeleteRow },
          { value: 'toggle', label: 'Toggle', disabled: !canAddRecord },
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
        title="Conference Centers"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC is populated.
                key: 'add',
                label: 'Add Conference Center',
                icon: <PlusOutlined />,
                onClick: () => navigate(`${LIST_PATH}/add`),
              }
            : undefined
        }
        actions={[
           { key: 'active-conferences', label: 'Active Conferences', icon: <AudioOutlined />, onClick: () => navigate(ACTIVE_CONFERENCES_PATH) },
          ...(canAddRecord
            ? [{ key: 'rooms', label: 'Conference Rooms', icon: <ApartmentOutlined />, onClick: () => navigate(CONFERENCE_ROOMS_PATH) }]
            : []),
         
        ]}
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <ConferenceCenterFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
            {/* TODO: Axion shows this for `pbx_axiontech` or >1 wildcard domain; the admin tier stands in for now. */}
            {canManageAll && (
              <Tooltip title="Show conference centers across all accessible domains">
                <Space size="small">
                  <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all conference centers" />
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
      ) : totalRecords === 0 ? (
        <EmptyState description={committedSearch ? 'No conference centers match your search.' : 'No conference centers found.'} />
      ) : (
        <ConferenceCenterTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canToggleRow={canToggleRow}
          canDeleteRow={canDeleteRow}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(center) => navigate(`${LIST_PATH}/${center.id}/edit`)}
          onDelete={(center) => setDeleteTargets([{ id: center.id, name: center.name }])}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <DeleteConferenceCentersModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTargets(null)
          clearSelection()
        }}
      />

      <ToggleConferenceCentersModal
        open={!!toggleTargetIds}
        onConfirm={handleToggleConfirm}
        onCancel={() => {
          setToggleTargetIds(null)
          clearSelection()
        }}
      />
    </Space>
  )
}

export default ConferenceCentersPage
