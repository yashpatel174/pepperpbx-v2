import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, AudioOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ConferenceRoomFilters from '../components/ConferenceRoomFilters'
import ConferenceRoomTable from '../components/ConferenceRoomTable'
import DeleteConferenceRoomModal from '../components/DeleteConferenceRoomModal'
import type { DeleteTarget } from '../components/DeleteConferenceRoomModal'
import ToggleConferenceRoomModal from '../components/ToggleConferenceRoomModal'
import { conferenceRoomPaths, conferenceRoomToggleFields } from '../conference-room.constants'
import { useConferenceRooms } from '../useConferenceRooms'
import useConferenceRoomPermissions from '../useConferenceRoomPermissions'
import type { ConferenceRoom, ConferenceRoomToggleKey } from '../conference-room.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

type BulkAction = 'delete' | 'toggle'

const pluralize = (count: number) => `${count} conference room${count === 1 ? '' : 's'}`

const ConferenceRoomsPage = () => {
  const {
    data,
    loading,
    initialized,
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
    removeConferenceRooms,
    toggleConferenceRoomsField,
  } = useConferenceRooms()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useConferenceRoomPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  // Targets outlive `open` until the modal's close animation ends, so a closing modal never shows "0".
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[]>([])
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [toggleOpen, setToggleOpen] = useState(false)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[]>([])
  // Inline toggles in flight, keyed `${uuid}:${field}`. The ref blocks a same-cell re-click before
  // React re-renders; the state drives which cells render as not clickable.
  const pendingTogglesRef = useRef<Set<string>>(new Set())
  const [pendingToggles, setPendingToggles] = useState<ReadonlySet<string>>(new Set())

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canToggleRow = canManageAll || canEdit
  const canDeleteRow = canManageAll

  // Selection survives paging, so remember each row's name for the bulk-delete list.
  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((room) => nameByIdRef.current.set(room.conference_room_uuid, room.conference_room_name))
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
    const ids = deleteTargets.map((target) => target.id)
    if (ids.length === 0) return
    await removeConferenceRooms(ids)
    message.success(ids.length === 1 ? `Conference room "${deleteTargets[0].name}" deleted successfully.` : `${pluralize(ids.length)} deleted.`)
    setDeleteOpen(false)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    const remaining = selectedIds.filter((id) => !ids.includes(id))
    setSelectedIds(remaining)
    if (remaining.length === 0) setBulkAction(undefined)
    setDeleteIsBulk(false)
  }

  const handleBulkToggleConfirm = async (toggleKey: ConferenceRoomToggleKey) => {
    if (toggleTargetIds.length === 0) return
    await toggleConferenceRoomsField(toggleTargetIds, toggleKey)
    const label = conferenceRoomToggleFields.find((field) => field.key === toggleKey)?.label ?? toggleKey
    message.success(`${label} toggled for ${pluralize(toggleTargetIds.length)}.`)
    setToggleOpen(false)
    clearSelection()
  }

  const setTogglePending = (key: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(key)
    else pendingTogglesRef.current.delete(key)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Inline column click: flips that one flag immediately, no confirmation (conference-rooms.md §3/§5).
  const handleToggleField = async (room: ConferenceRoom, field: ConferenceRoomToggleKey) => {
    const pendingKey = `${room.conference_room_uuid}:${field}`
    if (pendingTogglesRef.current.has(pendingKey)) return
    setTogglePending(pendingKey, true)
    try {
      await toggleConferenceRoomsField([room.conference_room_uuid], field)
      message.success(` ${room[field] ? 'disabled' : 'enabled'} successfully for conference room "${room.conference_room_name}".`)
      // Toggle success clears the row selection, inline included (conference-rooms.md §11).
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update ${room.conference_room_name}.`))
    } finally {
      setTogglePending(pendingKey, false)
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || !hasSelection) return
    if (bulkAction === 'delete') {
      setDeleteIsBulk(true)
      setDeleteTargets(selectedIds.map((id) => ({ id, name: nameByIdRef.current.get(id) ?? id })))
      setDeleteOpen(true)
    } else {
      setToggleTargetIds([...selectedIds])
      setToggleOpen(true)
    }
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>
        {selectedIds.length} {selectedIds.length === 1 ? 'row' : 'rows'} selected
      </Typography.Text>
      {/* TODO: gate options with <PermissionGuard> (conference.add / conference.manage) once RBAC is populated. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'toggle', label: 'Toggle', disabled: !canAddRecord },
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

  // Full-page skeleton only for the very first load; later fetches use the table's own spinner.
  if (!initialized) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Conference Rooms"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC is populated.
                key: 'add',
                label: 'Add Conference Room',
                icon: <PlusOutlined />,
                onClick: () => navigate(conferenceRoomPaths.add),
              }
            : undefined
        }
        actions={[
          // Active Conferences has its own permission model (§30) — its page enforces that itself.
          {
            key: 'active-conferences',
            label: 'Active Conferences',
            icon: <AudioOutlined />,
            onClick: () => navigate(conferenceRoomPaths.activeConferences),
          },
          { key: 'back', label: 'Back', icon: <ArrowLeftOutlined />, onClick: () => navigate(conferenceRoomPaths.conferenceCenters) },
        ]}
        // Without access the page shows PermissionDenied, so the filters are hidden too.
        filters={
          hasAnyAccess ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <ConferenceRoomFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {/* TODO: Axion shows this for `pbx_axiontech` or >1 wildcard domain; the admin tier stands in for now. */}
              {canManageAll && (
                <Tooltip title="Show conference rooms across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all conference rooms" />
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
      ) : totalRecords === 0 && !loading ? (
        <EmptyState description={committedSearch ? 'No conference rooms match your search.' : 'No conference rooms found.'} />
      ) : (
        <ConferenceRoomTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canToggleRow={canToggleRow}
          canDeleteRow={canDeleteRow}
          pendingToggles={pendingToggles}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(room) => navigate(conferenceRoomPaths.edit(room.conference_room_uuid))}
          onDelete={(room) => {
            setDeleteIsBulk(false)
            setDeleteTargets([{ id: room.conference_room_uuid, name: room.conference_room_name }])
            setDeleteOpen(true)
          }}
          onToggleField={handleToggleField}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <DeleteConferenceRoomModal
        open={deleteOpen}
        targets={deleteTargets}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteOpen(false)
          // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
          if (deleteIsBulk) clearSelection()
          setDeleteIsBulk(false)
        }}
        afterClose={() => setDeleteTargets([])}
      />

      <ToggleConferenceRoomModal
        open={toggleOpen}
        count={toggleTargetIds.length}
        onConfirm={handleBulkToggleConfirm}
        onCancel={() => {
          setToggleOpen(false)
          clearSelection()
        }}
        afterClose={() => setToggleTargetIds([])}
      />
    </Space>
  )
}

export default ConferenceRoomsPage
