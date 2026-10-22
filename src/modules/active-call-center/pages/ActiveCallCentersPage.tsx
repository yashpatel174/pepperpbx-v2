import { useNavigate } from 'react-router-dom'
import { Button, Space, Switch, Tooltip } from 'antd'
import { UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ActiveCallCenterFilters from '../components/ActiveCallCenterFilters'
import ActiveCallCenterQueueTable from '../components/ActiveCallCenterQueueTable'
import { buildActivityUrl } from '../active-call-center.utils'
import useActiveCallCenterQueues from '../useActiveCallCenterQueues'
import useActiveCallCenterPermissions from '../useActiveCallCenterPermissions'
import type { ActiveCallCenterQueue } from '../active-call-center.types'

/**
 * Queue List of the Active Call Center monitor (active-call-center.md §3/§4): search, Show All,
 * paging and a View action per queue. Read-only — no Add, Edit, Delete, selection or bulk actions.
 * Local mock data only: no realtime connection, no polling.
 */
const ActiveCallCentersPage = () => {
  const navigate = useNavigate()
  const { canView, canShowAll } = useActiveCallCenterPermissions()
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
  } = useActiveCallCenterQueues(canView)

  const handleView = (queue: ActiveCallCenterQueue) =>
    navigate(buildActivityUrl({ queueExtension: queue.extension, domainName: queue.domain, queueUuid: queue.id, queueName: queue.name }))

  const renderBody = () => {
    if (!canView) return <PermissionDenied />
    if (error) return <ErrorState message={error} onRetry={refresh} />
    if (loading && data.length === 0 && totalRecords === 0 && !searchTerm) return <LoadingState rows={8} />
    if (totalRecords === 0 && !loading) {
      return <EmptyState description={committedSearch.trim() ? 'No queues match your search.' : 'No data found'} />
    }
    return (
      <ActiveCallCenterQueueTable
        data={data}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={totalRecords}
        showAll={showAll}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onView={handleView}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Active Call Center"
        count={canView ? totalRecords : undefined}
        filters={
          canView && (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>
              <ActiveCallCenterFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {canShowAll && (
                <Tooltip title="Show queues across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all queues" />
                    <span>{showAll ? 'Show Less' : 'Show All'}</span>
                  </Space>
                </Tooltip>
              )}
            </>
          )
        }
      />

      {renderBody()}
    </Space>
  )
}

export default ActiveCallCentersPage
