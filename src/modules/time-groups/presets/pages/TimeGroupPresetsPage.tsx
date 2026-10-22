import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Input, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../../components/common/ModuleHeader'
import ErrorState from '../../../../components/feedback/ErrorState'
import LoadingState from '../../../../components/feedback/LoadingState'
import EmptyState from '../../../../components/feedback/EmptyState'
import PermissionDenied from '../../../../components/feedback/PermissionDenied'
import { getApiErrorMessage } from '../../../../services/api/apiError'
import { timeGroupPaths } from '../../time-group.constants'
import useTimeGroupPermissions from '../../useTimeGroupPermissions'
import TimeGroupPresetTable from '../components/TimeGroupPresetTable'
import DeleteTimeGroupPresetModal from '../components/DeleteTimeGroupPresetModal'
import type { DeleteTarget } from '../components/DeleteTimeGroupPresetModal'
import ToggleTimeGroupPresetsModal from '../components/ToggleTimeGroupPresetsModal'
import CopyTimeGroupPresetModal from '../components/CopyTimeGroupPresetModal'
import { presetPaths } from '../time-group-preset.constants'
import { useTimeGroupPresets } from '../useTimeGroupPresets'
import type { TimeGroupPreset } from '../time-group-preset.types'

/** Axion's presets toolbar offers both Toggle and Delete as bulk actions. */
type BulkAction = 'toggle' | 'delete'

const pluralize = (count: number) => `${count} preset${count === 1 ? '' : 's'}`

/**
 * Time Group Presets list (Axion's `presets/index.js` + `LIstPreset` + `TableHeader`). Reached from
 * the Time Groups list's Presets button; the header's Back returns there.
 */
const TimeGroupPresetsPage = () => {
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
    removePresets,
    togglePresets,
    duplicatePreset,
  } = useTimeGroupPresets()

  // Axion gates presets with the same TIMEGROUP_PERMISSION object as Time Groups.
  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useTimeGroupPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [toggleOpen, setToggleOpen] = useState(false)
  const [copyTarget, setCopyTarget] = useState<TimeGroupPreset | null>(null)
  const [copySubmitting, setCopySubmitting] = useState(false)
  // Row toggles in flight. The ref blocks a re-click before React re-renders.
  const pendingTogglesRef = useRef<Set<string>>(new Set())
  const [pendingToggles, setPendingToggles] = useState<ReadonlySet<string>>(new Set())

  const hasSelection = selectedIds.length > 0
  const canAddRecord = canManageAll || canAdd
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  // Row Status pill: admin/all or edit (Axion's `isTechAdminAll || canEdit`).
  const canToggleRow = canManageAll || canEdit
  // Bulk Toggle: all or add — Axion's toolbar gates it on `pbx_timeconditions_add`, not edit.
  const canBulkToggle = canManageAll || canAdd
  const canShowAll = canManageAll && wildCardDomains.length > 1

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }

  const nameByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((item) => nameByIdRef.current.set(item.preset_uuid, item.name))
  }, [data])

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids)
    if (ids.length === 0) setBulkAction(undefined)
  }

  const setTogglePending = (uuid: string, pending: boolean) => {
    if (pending) pendingTogglesRef.current.add(uuid)
    else pendingTogglesRef.current.delete(uuid)
    setPendingToggles(new Set(pendingTogglesRef.current))
  }

  // Status pill click: toggles immediately, no confirmation (Axion's `handleUpdateEnable`).
  const handleRowToggle = async (item: TimeGroupPreset) => {
    const uuid = item.preset_uuid
    if (pendingTogglesRef.current.has(uuid)) return
    setTogglePending(uuid, true)
    try {
      await togglePresets([uuid])
      message.success(`Preset "${item.name}" ${item.enable ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update preset ${item.name}.`))
    } finally {
      setTogglePending(uuid, false)
    }
  }

  const handleBulkToggleConfirm = async () => {
    await togglePresets(selectedIds)
    message.success(`${pluralize(selectedIds.length)} toggled.`)
    setToggleOpen(false)
    clearSelection()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removePresets(ids)
    message.success(ids.length === 1 ? `Preset "${deleteTargets[0].name}" deleted successfully.` : `${pluralize(ids.length)} deleted.`)
    setDeleteTargets(null)
    const remaining = selectedIds.filter((id) => !ids.includes(id))
    setSelectedIds(remaining)
    if (remaining.length === 0) setBulkAction(undefined)
    setDeleteIsBulk(false)
  }

  const handleApplyBulkAction = () => {
    if (!hasSelection) return
    if (bulkAction === 'toggle') setToggleOpen(true)
    if (bulkAction === 'delete') {
      setDeleteIsBulk(true)
      setDeleteTargets(selectedIds.map((id) => ({ id, name: nameByIdRef.current.get(id) ?? id })))
    }
  }

  // Copy success re-fetches and clears the row selection, as Axion's CopyPreset does.
  const handleCopySubmit = async (name: string) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await duplicatePreset(copyTarget.preset_uuid, name)
      message.success(`Preset "${copyTarget.name}" copied successfully.`)
      setCopyTarget(null)
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy preset ${copyTarget.name}.`))
    } finally {
      setCopySubmitting(false)
    }
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>
        You have selected {selectedIds.length} {selectedIds.length === 1 ? 'row' : 'rows'}
      </Typography.Text>
      {/* TODO: gate with <PermissionGuard> (pbx_timeconditions_all / _add) once RBAC is populated. */}
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

  if (!initialized) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Presets"
        count={totalRecords}
        actions={[{ key: 'back', label: 'Back', icon: <ArrowLeftOutlined />, onClick: () => navigate(timeGroupPaths.list) }]}
        primaryAction={
          canAddRecord
            ? {
                // TODO: wrap with <PermissionGuard permission="timegroup.add"> (pbx_timeconditions_add) once RBAC is populated.
                key: 'add',
                label: 'Add Preset',
                icon: <PlusOutlined />,
                onClick: () => navigate(presetPaths.add),
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
              <Input.Search
                allowClear
                placeholder="Search presets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={commitSearch}
                style={{ width: '100%', maxWidth: 200 }}
                aria-label="Search presets"
              />
              {canShowAll && (
                // TODO: gate with <PermissionGuard permission="timegroup.manage"> (pbx_timeconditions_all) once RBAC is populated.
                <Tooltip title="Show presets across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all presets" />
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
        <EmptyState description={committedSearch ? 'No presets match your search.' : 'No presets found.'} />
      ) : (
        <TimeGroupPresetTable
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
          onEdit={(item) => navigate(presetPaths.edit(item.preset_uuid))}
          onCopy={setCopyTarget}
          onDelete={(item) => {
            setDeleteIsBulk(false)
            setDeleteTargets([{ id: item.preset_uuid, name: item.name }])
          }}
          onToggle={handleRowToggle}
          selectedRowKeys={selectedIds}
          onSelectionChange={handleSelectionChange}
        />
      )}

      <DeleteTimeGroupPresetModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTargets(null)
          if (deleteIsBulk) clearSelection()
          setDeleteIsBulk(false)
        }}
      />

      <ToggleTimeGroupPresetsModal
        open={toggleOpen}
        count={selectedIds.length}
        onConfirm={handleBulkToggleConfirm}
        onCancel={() => {
          // Closing clears the selection, as Axion's TogglePreset close does.
          setToggleOpen(false)
          clearSelection()
        }}
      />

      <CopyTimeGroupPresetModal
        open={!!copyTarget}
        target={copyTarget}
        submitting={copySubmitting}
        onSubmit={handleCopySubmit}
        onCancel={() => setCopyTarget(null)}
      />
    </Space>
  )
}

export default TimeGroupPresetsPage
