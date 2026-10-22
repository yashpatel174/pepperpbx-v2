import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App, Button, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { DownloadOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import VoicemailFilters from '../components/VoicemailFilters'
import VoicemailTable from '../components/VoicemailTable'
import DeleteVoicemailModal from '../components/DeleteVoicemailModal'
import type { DeleteTarget } from '../components/DeleteVoicemailModal'
import ToggleVoicemailModal from '../components/ToggleVoicemailModal'
import CopyVoicemailModal from '../components/CopyVoicemailModal'
import ImportVoicemailModal from '../components/ImportVoicemailModal'
import ImportInfoModal from '../components/ImportInfoModal'
import { copyVoicemail, getHiveVoicemailDetails, importVoicemails } from '../voicemail.service'
import { useVoicemails } from '../useVoicemails'
import useVoicemailPermissions from '../useVoicemailPermissions'
import type { HiveVoicemailDetails, ImportInfo, ImportVoicemailOptions, Voicemail } from '../voicemail.types'
import { voicemailChildPath, voicemailFileDisabledMode } from '../voicemail.constants'
import type { VoicemailFlagPatch } from '../voicemail.service'
import { getApiErrorMessage } from '../../../services/api/apiError'

/**
 * Bulk actions are exactly Toggle + Delete (voicemail.md §5) — no separate Enable/Disable, no bulk Copy.
 */
type BulkAction = 'toggle' | 'delete'

const VoicemailsPage = () => {
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
    removeVoicemails,
    toggleVoicemailsStatus,
    updateVoicemailFlag,
  } = useVoicemails()

  const { canManageAll, canAdd, canEdit, canView, hasAnyAccess } = useVoicemailPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)
  const [deleteIsBulk, setDeleteIsBulk] = useState(false)
  const labelByIdRef = useRef<Map<string, string>>(new Map())
  const [toggleTargetIds, setToggleTargetIds] = useState<string[] | null>(null)

  const [copyTarget, setCopyTarget] = useState<Voicemail | null>(null)
  const [copyHive, setCopyHive] = useState<HiveVoicemailDetails | null>(null)
  const [copyHiveError, setCopyHiveError] = useState(false)
  const [copySubmitting, setCopySubmitting] = useState(false)
  const copyRequestRef = useRef(0)

  const [importOpen, setImportOpen] = useState(false)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importInfo, setImportInfo] = useState<ImportInfo | null>(
    (location.state as { importInfo?: ImportInfo } | null)?.importInfo ?? null
  )

  // The import result arrives through router state; clear it once read so a refresh or
  // back-navigation doesn't re-open the popup.
  useEffect(() => {
    if (importInfo) navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasSelection = selectedIds.length > 0

  // Per-action permission split (voicemail.md §19): row Edit is open to view-only users (read-only
  // form); Delete needs the module-admin tier; Copy and bulk Toggle also allow Add; the Status
  // button needs edit.
  const canEditRow = canManageAll || canEdit || canView
  const canCopyRow = canManageAll || canAdd
  const canDeleteRow = canManageAll
  const canToggleRow = canManageAll || canEdit
  const canBulkToggle = canManageAll || canAdd
  const canImport = canManageAll || canAdd

  useEffect(() => {
    if (selectedIds.length === 0) setBulkAction(undefined)
  }, [selectedIds])

  // Selection persists across pages, search and scope changes (PepperPBX list convention, same as
  // Call Block) — it is cleared only after a bulk action completes or a bulk popup is dismissed.
  useEffect(() => {
    data.forEach((voicemail) => labelByIdRef.current.set(voicemail.voicemail_uuid, voicemail.voicemail_id))
  }, [data])

  const clearSelection = () => {
    setSelectedIds([])
    setBulkAction(undefined)
  }


  const handleAdd = () => navigate('/voicemail/add')
  const handleEdit = (voicemail: Voicemail) => navigate(`/voicemail/${voicemail.voicemail_uuid}/edit`)

  // -- Copy ---------------------------------------------------------------------------------

  const loadCopyHive = async (voicemail: Voicemail) => {
    const requestId = ++copyRequestRef.current
    setCopyHive(null)
    setCopyHiveError(false)
    try {
      const hive = await getHiveVoicemailDetails(voicemail.domain_name)
      if (requestId === copyRequestRef.current) setCopyHive(hive)
    } catch {
      if (requestId === copyRequestRef.current) setCopyHiveError(true)
    }
  }

  const handleCopyClick = (voicemail: Voicemail) => {
    setCopyTarget(voicemail)
    void loadCopyHive(voicemail)
  }

  const closeCopy = () => {
    copyRequestRef.current += 1
    setCopyTarget(null)
    setCopyHive(null)
    setCopyHiveError(false)
  }

  const handleCopySubmit = async (newVoicemailId: string) => {
    if (!copyTarget) return
    setCopySubmitting(true)
    try {
      await copyVoicemail(copyTarget.voicemail_uuid, newVoicemailId)
      message.success(`Voicemail ${copyTarget.voicemail_id} copied to ${newVoicemailId}.`)
      closeCopy()
      await refresh()
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy voicemail ${copyTarget.voicemail_id}.`))
    } finally {
      setCopySubmitting(false)
    }
  }

  // -- Delete -------------------------------------------------------------------------------

  const handleDeleteRequest = (voicemail: Voicemail) => {
    setDeleteIsBulk(false)
    setDeleteTargets([{ id: voicemail.voicemail_uuid, label: voicemail.voicemail_id }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeVoicemails(ids)
    message.success(ids.length === 1 ? `Voicemail ${deleteTargets[0].label} deleted successfully.` : `${ids.length} voicemails deleted.`)
    setDeleteTargets(null)
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    setSelectedIds((selected) => selected.filter((id) => !ids.includes(id)))
    setDeleteIsBulk(false)
  }

  // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
  const handleDeleteCancel = () => {
    setDeleteTargets(null)
    if (deleteIsBulk) clearSelection()
    setDeleteIsBulk(false)
  }

  // -- Toggle -------------------------------------------------------------------------------

  const handleToggleConfirm = async () => {
    if (!toggleTargetIds) return
    const count = toggleTargetIds.length
    await toggleVoicemailsStatus(toggleTargetIds)
    message.success(`${count} voicemail${count === 1 ? '' : 's'} toggled.`)
    setToggleTargetIds(null)
    clearSelection()
  }

  const handleToggleCancel = () => {
    setToggleTargetIds(null)
    clearSelection()
  }

  // The Status button acts immediately with no confirmation (voicemail.md §7).
  const handleToggleStatus = async (voicemail: Voicemail) => {
    try {
      await toggleVoicemailsStatus([voicemail.voicemail_uuid])
      message.success(`Voicemail ${voicemail.voicemail_id} ${voicemail.voicemail_enabled ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update voicemail ${voicemail.voicemail_id}.`))
    }
  }

  // Inline Attached / Keep Local / Transcribe pills: direct click, no confirmation, same feedback as Status.
  const handleToggleFlag = async (voicemail: Voicemail, patch: VoicemailFlagPatch, label: string, nextEnabled: boolean) => {
    try {
      await updateVoicemailFlag(voicemail.voicemail_uuid, patch)
      message.success(`Voicemail ${voicemail.voicemail_id}: ${label} ${nextEnabled ? 'enabled' : 'disabled'} successfully.`)
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update voicemail ${voicemail.voicemail_id}.`))
    }
  }

  const handleToggleAttached = (voicemail: Voicemail) => {
    const nextEnabled = voicemail.voicemail_file !== 'attach'
    return handleToggleFlag(voicemail, { voicemail_file: nextEnabled ? 'attach' : voicemailFileDisabledMode }, 'Attached', nextEnabled)
  }
  const handleToggleKeepLocal = (voicemail: Voicemail) =>
    handleToggleFlag(voicemail, { voicemail_local_after_email: !voicemail.voicemail_local_after_email }, 'Keep Local', !voicemail.voicemail_local_after_email)
  const handleToggleTranscription = (voicemail: Voicemail) =>
    handleToggleFlag(
      voicemail,
      { voicemail_transcription_enabled: !voicemail.voicemail_transcription_enabled },
      'Transcribe',
      !voicemail.voicemail_transcription_enabled
    )

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedIds.length === 0) return
    if (bulkAction === 'delete') {
      // Selection spans pages, so targets come from the full selectedIds list; labels from the
      // ids seen on every page fetched this session.
      setDeleteIsBulk(true)
      setDeleteTargets(selectedIds.map((id) => ({ id, label: labelByIdRef.current.get(id) ?? id })))
    } else {
      setToggleTargetIds([...selectedIds])
    }
    setBulkAction(undefined)
  }

  // -- Import -------------------------------------------------------------------------------

  const handleImportSubmit = async (options: ImportVoicemailOptions) => {
    setImportSubmitting(true)
    try {
      const result = await importVoicemails(options)
      setImportOpen(false)
      navigate('/voicemail/import-match', { state: { result } })
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to import CSV.'))
    } finally {
      setImportSubmitting(false)
    }
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[
          { value: 'toggle', label: 'Toggle', disabled: !canBulkToggle },
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

  if (loading && data.length === 0 && totalRecords === 0 && !searchTerm) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Voicemail"
        count={totalRecords}
        primaryAction={
          canManageAll || canAdd
            ? {
                // TODO: wrap with <PermissionGuard permission="voicemail.add"> once RBAC
                // permissions are populated from the backend.
                key: 'add',
                label: 'Add',
                icon: <PlusOutlined />,
                onClick: handleAdd,
              }
            : undefined
        }
        actions={
          canImport
            ? [
                // TODO: wrap with <PermissionGuard permission="voicemail.add"> (Axion gates Import
                // with the same add / module-admin check). No Export exists in Axion (voicemail.md §17).
                { key: 'import', label: 'Import', icon: <DownloadOutlined />, onClick: () => setImportOpen(true) },
              ]
            : undefined
        }
        filters={
          hasAnyAccess ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <VoicemailFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {/* Axion shows Show All for pbx_axiontech or when the user has >1 wildcard domain
                  (voicemail.md §18); neither signal exists here yet, so the module-admin tier is the stand-in. */}
              {canManageAll && (
                <Tooltip title="Show voicemails across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all voicemails" />
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
        <EmptyState description={committedSearch.trim() ? 'No voicemails match your search.' : 'No voicemail found.'} />
      ) : (
        <VoicemailTable
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
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onCopy={handleCopyClick}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          onToggleAttached={handleToggleAttached}
          onToggleKeepLocal={handleToggleKeepLocal}
          onToggleTranscription={handleToggleTranscription}
          onOpenMessages={(voicemail) => navigate(voicemailChildPath('messages', voicemail.voicemail_uuid, voicemail.voicemail_id))}
          onOpenGreetings={(voicemail) => navigate(voicemailChildPath('greetings', voicemail.voicemail_uuid, voicemail.voicemail_id))}
          selectedRowKeys={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      <DeleteVoicemailModal open={!!deleteTargets} targets={deleteTargets ?? []} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />

      <ToggleVoicemailModal
        open={!!toggleTargetIds}
        count={toggleTargetIds?.length ?? 0}
        onConfirm={handleToggleConfirm}
        onCancel={handleToggleCancel}
      />

      <CopyVoicemailModal
        open={!!copyTarget}
        target={copyTarget}
        hive={copyHive}
        hiveError={copyHiveError}
        onRetryHive={() => copyTarget && loadCopyHive(copyTarget)}
        submitting={copySubmitting}
        onSubmit={handleCopySubmit}
        onCancel={closeCopy}
      />

      <ImportVoicemailModal open={importOpen} submitting={importSubmitting} onSubmit={handleImportSubmit} onCancel={() => setImportOpen(false)} />

      <ImportInfoModal info={importInfo} onClose={() => setImportInfo(null)} />
    </Space>
  )
}

export default VoicemailsPage
