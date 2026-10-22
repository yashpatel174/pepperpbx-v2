import { Alert, Button, Space, Switch, Tooltip } from 'antd'
import { UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { isMockMode } from '../../../services/auth/auth.mock'
import ActiveCallFilters from '../components/ActiveCallFilters'
import ActiveCallTable from '../components/ActiveCallTable'
import { useActiveCalls } from '../useActiveCalls'
import useActiveCallPermissions from '../useActiveCallPermissions'

/**
 * Read-only monitor of active calls (active-calls.md §3/§4). No Add, Edit, Delete, Import/Export
 * or hangup — the audit confirms none are enabled. Data is a one-shot SAMPLE snapshot: realtime
 * updates are not wired yet.
 */
const ActiveCallsPage = () => {
  const { canView, canShowAllByPermission } = useActiveCallPermissions()
  const {
    data,
    totalCount,
    loading,
    searching,
    error,
    showAll,
    wildCardDomains,
    searchTerm,
    setSearchTerm,
    commitSearch,
    setShowAll,
    resetFilters,
    refresh,
  } = useActiveCalls(canView)

  const canShowAll = canShowAllByPermission || wildCardDomains.length > 1

  const renderBody = () => {
    if (!canView) return <PermissionDenied />
    if (error) return <ErrorState message={error} onRetry={refresh} />
    // Skeleton only until the first load lands; later refreshes (Reset, Show All) keep the table and use its own spinner.
    if (loading && totalCount === 0) return <LoadingState rows={6} />
    // A pending (debouncing) search is never treated as an empty result.
    if (searching) return <ActiveCallTable data={data} loading />
    if (totalCount === 0) return <EmptyState description="No data found" />
    if (data.length === 0) return <EmptyState description="No active calls match your search." />
    return <ActiveCallTable data={data} loading={loading} />
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Active Calls"
        count={canView ? data.length : undefined}
        filters={
          canView && (
            <>
              <Tooltip title="Reset">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset search" />
              </Tooltip>
              <ActiveCallFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {canShowAll && (
                <Tooltip title="Show active calls across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all active calls" />
                    <span>Show All</span>
                  </Space>
                </Tooltip>
              )}
            </>
          )
        }
      />

      {canView && isMockMode() && (
        <Alert type="info" showIcon title="Sample data — live call updates are not connected yet; these are not real calls." />
      )}

      {renderBody()}
    </Space>
  )
}

export default ActiveCallsPage
