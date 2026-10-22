import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { AudioOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ConferenceFilters from '../components/ConferenceFilters'
import ConferenceTable from '../components/ConferenceTable'
import DeleteConferenceModal from '../components/DeleteConferenceModal'
import type { DeleteTarget } from '../components/DeleteConferenceModal'
import ToggleConferenceModal from '../components/ToggleConferenceModal'
import CopyConferenceModal from '../components/CopyConferenceModal'
import { copyConference, getHiveConferenceDetails } from '../conference.service'
import { useConferences } from '../useConferences'
import useConferencePermissions from '../useConferencePermissions'
import type { Conference, ConferenceHiveDetails } from '../conference.types'
import { getApiErrorMessage } from '../../../services/api/apiError'

/**
 * Bulk actions: Toggle + Delete — matches the audit exactly (conferences.md §21: "Two actions are
 * wired: delete and toggle... the dead bulk-copy branch is deliberately not reproduced here
 * either").
 */
type BulkAction = 'toggle' | 'delete'

const ConferencesPage = () => {
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
    removeConferences,
    toggleConferencesStatus,
  } = useConferences()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useConferencePermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedConferenceIds, setSelectedConferenceIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)
  const [copyTarget, setCopyTarget] = useState<Conference | null>(null)
  const [copyHive, setCopyHive] = useState<ConferenceHiveDetails | null>(null)
  const [copyHiveError, setCopyHiveError] = useState(false)
  const [copySubmitting, setCopySubmitting] = useState(false)
  const copyRequestRef = useRef(0)

  const hasSelection = selectedConferenceIds.length > 0
  // Row Edit is reachable by view-only users too (read-only form); row Delete requires the
  // module-admin tier; Copy also allows Add-permission holders — matching the audit's documented
  // per-action permission split (conferences.md §14).
  const canEditRow = canManageAll || canEdit || canView
  // Inline Status toggle requires real edit rights — view-only users see the status but can't
  // flip it (conferences.md §14: "disabled unless user has edit or wildcard+module_admin").
  const canToggleRow = canManageAll || canEdit
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll

  useEffect(() => {
    if (selectedConferenceIds.length === 0) setBulkAction(undefined)
  }, [selectedConferenceIds])

  // Accumulates conference-name labels across every page this session has fetched (reusing the
  // same `data` the table already renders — no extra request). A row can only ever be selected
  // after appearing in `data` at least once, so by the time a bulk delete is confirmed, every
  // selected id's label is already known here even if that row's page isn't currently loaded.
  const conferenceLabelByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((conference) => {
      conferenceLabelByIdRef.current.set(conference.id, conference.name)
    })
  }, [data])

  const clearSelection = () => {
    setSelectedConferenceIds([])
    setBulkAction(undefined)
  }

  const handleAdd = () => navigate('/conferences/add')
  const handleEdit = (conference: Conference) => navigate(`/conferences/${conference.id}/edit`)

  // The audit's own Active Conferences link (paths.conferencesActive, /activeConferences/list) is
  // a separate realtime/monitoring module with its own permission model (conferences.md §23/§30) —
  // out of scope for this task. PepperPBX does not yet have that route implemented, so this button
  // is deliberately kept as an isolated navigation link rather than building that module here; the
  // route currently resolves to the app's NotFound catch-all until Active Conferences exists.
  const handleActiveConferences = () => navigate('/activeConferences/list')

  // Only the latest Copy bootstrap may apply — a slow response for a closed/replaced Copy target is ignored.
  const loadCopyHive = async (conference: Conference) => {
    const requestId = ++copyRequestRef.current
    setCopyHive(null)
    setCopyHiveError(false)
    try {
      const hive = await getHiveConferenceDetails(conference.domain)
      if (requestId === copyRequestRef.current) setCopyHive(hive)
    } catch {
      if (requestId === copyRequestRef.current) setCopyHiveError(true)
    }
  }

  const handleCopyClick = (conference: Conference) => {
    setCopyTarget(conference)
    void loadCopyHive(conference)
  }

  const closeCopy = () => {
    copyRequestRef.current++
    setCopyTarget(null)
    setCopyHive(null)
    setCopyHiveError(false)
  }

  const handleCopyConfirm = async ({ name, extension }: { name: string; extension: string }) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await copyConference(copyTarget.id, name, extension)
      message.success(`Conference "${copyTarget.name}" copied successfully.`)
      closeCopy()
      await refresh()
      clearSelection()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy conference ${copyTarget.name}.`))
    } finally {
      setCopySubmitting(false)
    }
  }

  const handleDeleteRequest = (conference: Conference) => {
    setDeleteIsBulk(false)
    setDeleteTargets([{ id: conference.id, name: conference.name }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeConferences(ids)
    message.success(ids.length === 1 ? `Conference "${deleteTargets[0].name}" deleted successfully.` : `${ids.length} conferences deleted.`)
    setDeleteTargets(null)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    setSelectedConferenceIds((selected) => selected.filter((id) => !ids.includes(id)))
    setDeleteIsBulk(false)
  }

  const handleDeleteCancel = () => {
    setDeleteTargets(null)
    // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
    if (deleteIsBulk) clearSelection()
    setDeleteIsBulk(false)
  }

  const handleToggleConfirm = async () => {
    if (!toggleTargetIds) return
    const count = toggleTargetIds.length
    await toggleConferencesStatus(toggleTargetIds)
    message.success(`${count} conference${count === 1 ? '' : 's'} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const handleToggleCancel = () => {
    setToggleTargetIds(null)
    clearSelection()
  }

  // Inline pill acts immediately, no confirmation — matches the audit's row Status behavior
  // (conferences.md §3/§11/§25/§28), distinct from the confirmed bulk Toggle flow above.
  const handleToggleStatus = async (conference: Conference) => {
    try {
      await toggleConferencesStatus([conference.id])
      message.success(`Conference "${conference.name}" ${conference.enabled ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update conference ${conference.name}.`))
    }
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedConferenceIds.length === 0) return
    // Row selection is preserved across pages (preserveSelectedRowKeys), so a selection can span
    // pages the table isn't currently showing. The delete/toggle targets must come from the full
    // selectedConferenceIds list, not from `data` (only the current page) — otherwise IDs selected
    // on another page would be silently dropped. The friendly label comes from
    // conferenceLabelByIdRef (accumulated across every page fetched this session, see above),
    // falling back to the raw id only if a selected conference was somehow never fetched.
    if (bulkAction === 'delete') {
      setDeleteIsBulk(true)
      setDeleteTargets(selectedConferenceIds.map((id) => ({ id, name: conferenceLabelByIdRef.current.get(id) ?? id })))
      return
    }

    setToggleTargetIds([...selectedConferenceIds])
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedConferenceIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'toggle', label: 'Toggle', disabled: !canManageAll && !canAdd },
          { value: 'delete', label: 'Delete', disabled: !canManageAll },
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
        title="Conferences"
        count={totalRecords}
        primaryAction={
          canManageAll || canAdd
            ? {
                key: 'add',
                // TODO: wrap with <PermissionGuard permission="conference.add"> once RBAC
                // permissions are populated from the backend.
                label: 'Add Conference',
                icon: <PlusOutlined />,
                onClick: handleAdd,
              }
            : undefined
        }
        actions={[
          {
            key: 'active-conferences',
            label: 'Active Conferences',
            icon: <AudioOutlined />,
            onClick: handleActiveConferences,
          },
        ]}
        // Without access the page shows PermissionDenied, so the filters are hidden too.
        filters={
          hasAnyAccess ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>

              <ConferenceFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />

              {/* Show All is visible only for the module-admin tier, matching the audit's
                  `isShowAll`-gate concept (conferences.md §7/§14/§25). */}
              {canManageAll && (
                <Tooltip title="Show conferences across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all conferences" />
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
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No conferences match your search.' : 'No conferences found.'} />
      ) : (
        <ConferenceTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canEditRow={canEditRow}
          canToggleRow={canToggleRow}
          canCopyRow={canCopyRow}
          canDeleteRow={canDeleteRow}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onCopy={handleCopyClick}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedConferenceIds}
          onSelectionChange={setSelectedConferenceIds}
        />
      )}

      <DeleteConferenceModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <ToggleConferenceModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleToggleConfirm}
        onCancel={handleToggleCancel}
      />

      <CopyConferenceModal
        open={!!copyTarget}
        target={copyTarget}
        hive={copyHive}
        hiveError={copyHiveError}
        onRetryHive={() => copyTarget && loadCopyHive(copyTarget)}
        submitting={copySubmitting}
        onSubmit={handleCopyConfirm}
        onCancel={closeCopy}
      />
    </Space>
  )
}

export default ConferencesPage
