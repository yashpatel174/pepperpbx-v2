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
import IVRMenuFilters from '../components/IVRMenuFilters'
import IVRMenuTable from '../components/IVRMenuTable'
import CopyIVRMenuModal from '../components/CopyIVRMenuModal'
import type { CopyIVRMenuValues } from '../components/CopyIVRMenuModal'
import DeleteIVRMenuModal from '../components/DeleteIVRMenuModal'
import type { DeleteTarget } from '../components/DeleteIVRMenuModal'
import ToggleIVRMenuModal from '../components/ToggleIVRMenuModal'
import { ivrMenuPaths } from '../ivr-menu.constants'
import { getHiveUserDetails } from '../ivr-menu.service'
import { useIVRMenus } from '../useIVRMenus'
import useIVRMenuPermissions from '../useIVRMenuPermissions'
import type { IVRMenu, IVRMenuHiveDetails } from '../ivr-menu.types'

/** Axion's two bulk actions, defined inline in its toolbar (§21). */
type BulkAction = 'toggle' | 'delete'

const pluralize = (count: number) => `${count} IVR menu${count === 1 ? '' : 's'}`

const IVRMenusPage = () => {
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
    selectedIds,
    setSelectedIds,
    clearSelection,
    removeIVRMenus,
    toggleSelected,
    toggleRow,
    duplicateIVRMenu,
  } = useIVRMenus()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess, canCopy, isAxionTech } = useIVRMenuPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  const [copyTarget, setCopyTarget] = useState<IVRMenu | null>(null)
  const [copyHive, setCopyHive] = useState<IVRMenuHiveDetails | null>(null)
  const [copyHiveError, setCopyHiveError] = useState(false)
  const [copySubmitting, setCopySubmitting] = useState(false)
  // Row toggles in flight. The ref blocks a re-click before React re-renders.
  const pendingTogglesRef = useRef<Set<string>>(new Set())
  const [pendingToggles, setPendingToggles] = useState<ReadonlySet<string>>(new Set())
  const copyRequestRef = useRef(0)

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canCopy
  const canDeleteRow = canManageAll
  const canToggleRow = canManageAll || canEdit
  const canBulkToggle = canManageAll || canAdd
  // Axion: module admin AND (`pbx_axiontech` OR more than one wildcard domain) (§3/§14/§15).
  const canShowAll = canManageAll && (isAxionTech || wildCardDomains.length > 1)

  // The selection is cleared by the hook after each mutation; drop a stale bulk choice with it.
  useEffect(() => {
    if (selectedIds.length === 0) setBulkAction(undefined)
  }, [selectedIds])

  // Selection spans pages, so remember each row's name as pages load for the bulk-delete list.
  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((menu) => nameByIdRef.current.set(menu.ivr_menu_uuid, menu.ivr_menu_name))
  }, [data])

  const setTogglePending = (uuid: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(uuid)
    else pendingTogglesRef.current.delete(uuid)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Status pill: toggles immediately, no confirmation (§3/§26).
  const handleRowToggle = async (menu: IVRMenu) => {
    if (pendingTogglesRef.current.has(menu.ivr_menu_uuid)) return
    setTogglePending(menu.ivr_menu_uuid, true)
    try {
      await toggleRow(menu.ivr_menu_uuid)
      message.success(`IVR menu "${menu.ivr_menu_name}" ${menu.ivr_menu_enabled ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update IVR menu ${menu.ivr_menu_name}.`))
    } finally {
      setTogglePending(menu.ivr_menu_uuid, false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeIVRMenus(ids)
    message.success(ids.length === 1 ? `IVR menu "${deleteTargets[0].name}" deleted successfully.` : `${pluralize(ids.length)} deleted.`)
    setDeleteTargets(null)
    setDeleteIsBulk(false)
  }

  const handleBulkToggleConfirm = async () => {
    if (!toggleTargetIds) return
    await toggleSelected(toggleTargetIds)
    message.success(`${pluralize(toggleTargetIds.length)} toggled.`)
    setToggleTargetIds(null)
  }

  // Copy stays in the source domain, so its bootstrap (autoExt + range) is that domain's (§3/§15).
  const loadCopyHive = async (menu: IVRMenu) => {
    const requestId = ++copyRequestRef.current
    setCopyHive(null)
    setCopyHiveError(false)
    try {
      const hive = await getHiveUserDetails(menu.domain_name)
      if (requestId === copyRequestRef.current) setCopyHive(hive)
    } catch {
      if (requestId === copyRequestRef.current) setCopyHiveError(true)
    }
  }

  const handleCopyClick = (menu: IVRMenu) => {
    setCopyTarget(menu)
    loadCopyHive(menu)
  }

  const closeCopy = () => {
    copyRequestRef.current++
    setCopyTarget(null)
    setCopyHive(null)
    setCopyHiveError(false)
  }

  const handleCopySubmit = async (values: CopyIVRMenuValues) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await duplicateIVRMenu(copyTarget.ivr_menu_uuid, values)
      message.success(`IVR menu "${copyTarget.ivr_menu_name}" copied successfully.`)
      closeCopy()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy IVR menu ${copyTarget.ivr_menu_name}.`))
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
      {/* TODO: gate with <PermissionGuard> once RBAC is populated — Toggle: pbx_ivrmenus_add|all; Delete: pbx_ivrmenus_all. */}
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160, maxWidth: '100%' }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'toggle', label: 'Toggle', disabled: !canBulkToggle },
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

  // Full-page skeleton only for the first load; later fetches use the table's own spinner.
  if (!initialized) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="IVR Menus"
        count={totalRecords}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="pbx_ivrmenus_add"> (or pbx_ivrmenus_all) once RBAC is populated.
                key: 'add',
                label: 'Add IVR Menu',
                icon: <PlusOutlined />,
                onClick: () => navigate(ivrMenuPaths.add),
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
              <IVRMenuFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {canShowAll && (
                // TODO: gate with <PermissionGuard permission="pbx_ivrmenus_all"> once RBAC is populated.
                <Tooltip title="Show IVR menus across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all IVR menus" />
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
        <EmptyState description={committedSearch ? 'No IVR menus match your search.' : 'No IVR menus found.'} />
      ) : (
        <IVRMenuTable
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
          pendingToggles={pendingToggles}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(menu) => navigate(ivrMenuPaths.edit(menu.ivr_menu_uuid))}
          onCopy={handleCopyClick}
          onDelete={(menu) => {
            setDeleteIsBulk(false)
            setDeleteTargets([{ id: menu.ivr_menu_uuid, name: menu.ivr_menu_name }])
          }}
          onToggle={handleRowToggle}
          selectedRowKeys={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <DeleteIVRMenuModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTargets(null)
          // Closing a bulk delete clears the selection, as Axion's `onHide` does (§20); cancelling a
          // row's Delete leaves an unrelated selection alone.
          if (deleteIsBulk) clearSelection()
          setDeleteIsBulk(false)
        }}
      />

      <ToggleIVRMenuModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleBulkToggleConfirm}
        onCancel={() => {
          setToggleTargetIds(null)
          clearSelection()
        }}
      />

      <CopyIVRMenuModal
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

export default IVRMenusPage
