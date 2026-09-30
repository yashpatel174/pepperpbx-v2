import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Tooltip, Typography } from 'antd'
import { PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { getApiErrorMessage } from '../../../services/api/apiError'
import ConferenceProfileFilters from '../components/ConferenceProfileFilters'
import ConferenceProfileTable from '../components/ConferenceProfileTable'
import ToggleConferenceProfilesModal from '../components/ToggleConferenceProfilesModal'
import { conferenceProfilePaths } from '../conference-profile.constants'
import { useConferenceProfiles } from '../useConferenceProfiles'
import useConferenceProfilePermissions from '../useConferenceProfilePermissions'
import type { ConferenceProfile } from '../conference-profile.types'

/** Toggle is the only bulk action — Axion has no bulk Delete, and its bulk Copy is commented out (§21). */
type BulkAction = 'toggle'

const pluralize = (count: number) => `${count} conference profile${count === 1 ? '' : 's'}`

const ConferenceProfilesPage = () => {
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
    toggleConferenceProfilesStatus,
  } = useConferenceProfiles()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useConferenceProfilePermissions()
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
  // Axion enables bulk Toggle for `all` OR `add` (§21) — not the `all` OR `edit` rule the inline
  // Status toggle uses (§14). Kept as documented. TODO: confirm with product/backend which rule is
  // intended before RBAC is populated; until then every flag is granted and the two can't differ.
  const canBulkToggle = canManageAll || canAdd

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
    await toggleConferenceProfilesStatus(toggleTargetIds)
    message.success(`${pluralize(toggleTargetIds.length)} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const setTogglePending = (uuid: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(uuid)
    else pendingTogglesRef.current.delete(uuid)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Inline Status click: toggles immediately, no confirmation (conference-profiles.md §3/§26).
  const handleToggleStatus = async (profile: ConferenceProfile) => {
    const uuid = profile.conference_profile_uuid
    if (pendingTogglesRef.current.has(uuid)) return
    setTogglePending(uuid, true)
    try {
      await toggleConferenceProfilesStatus([uuid])
      message.success(`Conference profile ${profile.profile_name} ${profile.profile_enabled ? 'disabled' : 'enabled'}.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update conference profile ${profile.profile_name}.`))
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
      {/* TODO: gate with <PermissionGuard> once RBAC is populated — see canBulkToggle above. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[{ value: 'toggle', label: 'Toggle', disabled: !canBulkToggle }]}
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
        title="Conference Profiles"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC is populated.
                key: 'add',
                label: 'Add Conference Profile',
                icon: <PlusOutlined />,
                onClick: () => navigate(conferenceProfilePaths.add),
              }
            : undefined
        }
        filters={
          <>
            <Tooltip title="Reset filters">
              <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
            </Tooltip>
            <ConferenceProfileFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
          </>
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!hasAnyAccess ? (
        <PermissionDenied />
      ) : totalRecords === 0 && !loading ? (
        <EmptyState description={committedSearch ? 'No conference profiles match your search.' : 'No conference profiles found.'} />
      ) : (
        <ConferenceProfileTable
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
          onEdit={(profile) => navigate(conferenceProfilePaths.edit(profile.conference_profile_uuid))}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <ToggleConferenceProfilesModal
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

export default ConferenceProfilesPage
