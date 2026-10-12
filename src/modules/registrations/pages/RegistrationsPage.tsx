import { Alert, Button, Space, Switch, Tooltip } from 'antd'
import { UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import { isMockMode } from '../../../services/auth/auth.mock'
import RegistrationFilters from '../components/RegistrationFilters'
import RegistrationTable from '../components/RegistrationTable'
import { useRegistrations } from '../useRegistrations'
import useRegistrationPermissions from '../useRegistrationPermissions'

/**
 * Read-only monitor of SIP registrations (registrations.md §3/§4). No Add, Edit, Delete, bulk,
 * Import/Export or Unregister/Reboot/Provision — the audit confirms none are reachable in Axion.
 * Data is a one-shot SAMPLE snapshot per query: realtime updates are not wired yet.
 */
const RegistrationsPage = () => {
  const { canView, canShowAllByPermission } = useRegistrationPermissions()
  const {
    data,
    totalRecords,
    loading,
    error,
    showAll,
    wildCardDomains,
    searchTerm,
    hasSearch,
    pageNumber,
    pageSize,
    setSearchTerm,
    commitSearch,
    setShowAll,
    setPageNumber,
    setPageSize,
    resetFilters,
    refresh,
  } = useRegistrations(canView)

  // `showAll` keeps the toggle reachable after a failed request clears the wildcard-domain metadata.
  const canShowAll = canShowAllByPermission || wildCardDomains.length > 1 || showAll

  const handlePageChange = (nextPage: number, nextSize: number) => {
    if (nextSize !== pageSize) setPageSize(nextSize)
    else setPageNumber(nextPage)
  }

  const renderBody = () => {
    if (!canView) return <PermissionDenied />
    if (error) return <ErrorState message={error} onRetry={refresh} />
    // Skeleton only until the first rows land; later fetches (search, paging, Show All) keep the table under its own spinner.
    if (loading && data.length === 0 && totalRecords === 0 && !hasSearch) return <LoadingState rows={6} />
    if (!loading && totalRecords === 0) {
      return <EmptyState description={hasSearch ? 'No registrations match your search.' : 'No data found'} />
    }
    return (
      <RegistrationTable
        data={data}
        loading={loading}
        totalRecords={totalRecords}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    )
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Registrations"
        count={canView ? totalRecords : undefined}
        filters={
          canView && (
            <>
              <Tooltip title="Reset">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset search" />
              </Tooltip>
              <RegistrationFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {canShowAll && (
                <Tooltip title="Show registrations across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all registrations" />
                    <span>Show All</span>
                  </Space>
                </Tooltip>
              )}
            </>
          )
        }
      />

      {canView && isMockMode() && (
        <Alert type="info" showIcon title="Sample data — live registration updates are not connected yet; these are not real endpoints, and the status and expiry values are illustrative." />
      )}

      {renderBody()}
    </Space>
  )
}

export default RegistrationsPage
