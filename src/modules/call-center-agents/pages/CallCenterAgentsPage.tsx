import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Flex, Select, Space, Switch, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, UndoOutlined, UserSwitchOutlined } from '@ant-design/icons'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ModuleHeader from '../../../components/common/ModuleHeader'
import AgentFilters from '../components/AgentFilters'
import AgentTable from '../components/AgentTable'
import DeleteAgentsModal from '../components/DeleteAgentsModal'
import type { DeleteTarget } from '../components/DeleteAgentsModal'
import { useCallCenterAgents } from '../useCallCenterAgents'
import useCallCenterAgentPermissions from '../useCallCenterAgentPermissions'
import type { CallCenterAgent } from '../call-center-agents.types'

/** Bulk actions: Delete only — matches the audit exactly (call-center.md §21: "Agent list: row
 * checkboxes + select ('Delete' only, permission-gated) + Apply. Only delete wired"). */
type BulkAction = 'delete'

const CallCenterAgentsPage = () => {
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
    removeCallCenterAgents,
  } = useCallCenterAgents()

  const { canManage } = useCallCenterAgentPermissions()
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined)
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null)

  const hasSelection = selectedAgentIds.length > 0

  useEffect(() => {
    if (selectedAgentIds.length === 0) setBulkAction(undefined)
  }, [selectedAgentIds])

  // Accumulates agent-name labels across every page this session has fetched (reusing the same
  // `data` the table already renders — no extra request). A row can only ever be selected after
  // appearing in `data` at least once, so by the time a bulk delete is confirmed, every selected
  // id's label is already known here even if that row's page isn't the one currently loaded.
  const agentLabelByIdRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    data.forEach((agent) => {
      agentLabelByIdRef.current.set(agent.id, agent.name)
    })
  }, [data])

  const clearSelection = () => {
    setSelectedAgentIds([])
    setBulkAction(undefined)
  }

  const handleBack = () => navigate('/call-center')
  const handleStatus = () => navigate('/call-center/agents/status')
  const handleAdd = () => navigate('/call-center/agents/add')
  const handleEdit = (agent: CallCenterAgent) => navigate(`/call-center/agents/${agent.id}/edit`)

  const handleDeleteRequest = (agent: CallCenterAgent) => {
    setDeleteTargets([{ id: agent.id, name: agent.name }])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map((target) => target.id)
    await removeCallCenterAgents(ids)
    message.success(`${ids.length} call center agent${ids.length === 1 ? '' : 's'} deleted.`)
    setDeleteTargets(null)
    clearSelection()
  }

  const handleDeleteCancel = () => {
    setDeleteTargets(null)
    clearSelection()
  }

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedAgentIds.length === 0) return
    // Row selection is preserved across pages (preserveSelectedRowKeys), so a selection can span
    // pages the table isn't currently showing. The delete targets must come from the full
    // selectedAgentIds list, not from `data` (only the current page) — otherwise IDs selected on
    // another page would be silently dropped. The friendly label comes from agentLabelByIdRef
    // (accumulated across every page fetched this session, see above), falling back to the raw id
    // only if a selected agent was somehow never fetched.
    setDeleteTargets(selectedAgentIds.map((id) => ({ id, name: agentLabelByIdRef.current.get(id) ?? id })))
  }

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedAgentIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[{ value: 'delete', label: 'Delete', disabled: !canManage }]}
        aria-label="Select action"
      />
      <Button type="primary" disabled={!bulkAction} onClick={handleApplyBulkAction}>
        Apply
      </Button>
    </Space>
  )

  const defaultToolbar = (
    <Flex wrap gap="middle" justify="space-between" align="center" style={{ width: '100%' }}>
      <Flex wrap gap="middle" align="center" style={{ flex: '1 1 260px', minWidth: 0 }}>
        <Tooltip title="Reset filters">
          <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
        </Tooltip>

        <AgentFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />

        {canManage && (
          <Tooltip title="Show call center agents across all accessible domains">
            <Space size="small">
              <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all call center agents" />
              <span>Show All</span>
            </Space>
          </Tooltip>
        )}
      </Flex>

      <Flex wrap gap="middle" align="center" style={{ flex: '0 0 auto' }}>
        <Button type='primary' icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Back
        </Button>
        <Button icon={<UserSwitchOutlined />} onClick={handleStatus}>
          Status
        </Button>
        {canManage && (
          // TODO: wrap with <PermissionGuard permission="callCenterAgent.manage"> once RBAC
          // permissions are populated from the backend.
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Agent
          </Button>
        )}
      </Flex>
    </Flex>
  )

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader title="Call Center Agents" count={totalRecords} toolbar={hasSelection ? selectionToolbar : defaultToolbar} />

      {!canManage ? (
        <PermissionDenied />
      ) : totalRecords === 0 ? (
        <EmptyState description={searchTerm ? 'No call center agents match your search.' : 'No call center agents found.'} />
      ) : (
        <AgentTable
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
          onDelete={handleDeleteRequest}
          selectedRowKeys={selectedAgentIds}
          onSelectionChange={setSelectedAgentIds}
        />
      )}

      <DeleteAgentsModal open={!!deleteTargets} targets={deleteTargets ?? []} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
    </Space>
  )
}

export default CallCenterAgentsPage
