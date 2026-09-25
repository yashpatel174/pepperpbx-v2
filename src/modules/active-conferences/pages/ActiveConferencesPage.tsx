import { useNavigate } from 'react-router-dom'
import { Button, Space, Switch, Tooltip } from 'antd'
import { AudioOutlined, UndoOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import ErrorState from '../../../components/feedback/ErrorState'
import LoadingState from '../../../components/feedback/LoadingState'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ActiveConferenceFilters from '../components/ActiveConferenceFilters'
import ActiveConferenceTable from '../components/ActiveConferenceTable'
import { ACTIVE_CONFERENCE_VIEW_PATH, CONFERENCES_PATH } from '../active-conferences.constants'
import { useActiveConferences } from '../useActiveConferences'
import useActiveConferencePermissions from '../useActiveConferencePermissions'
import type { ActiveConference, ActiveConferenceDetailState } from '../active-conferences.types'

/**
 * Read-only live monitor of active conference rooms (active-conferences.md §3/§4). No Add, Edit,
 * Delete, Copy, Import/Export, bulk selection, or pagination footer — the audit confirms none exist.
 */
const ActiveConferencesPage = () => {
  const navigate = useNavigate()
  const { canView, canShowAllByPermission } = useActiveConferencePermissions()
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
  } = useActiveConferences(canView)

  const canShowAll = canShowAllByPermission || wildCardDomains.length > 1

  const handleView = (conference: ActiveConference) => {
    const state: ActiveConferenceDetailState = { conference }
    navigate(`${ACTIVE_CONFERENCE_VIEW_PATH}/${encodeURIComponent(conference.conference_name)}`, { state })
  }

  const renderBody = () => {
    if (!canView) return <PermissionDenied />
    if (error) return <ErrorState message={error} onRetry={refresh} />
    // Skeleton only until the first load lands; later refreshes (Reset, Show All) keep the table and use its own spinner.
    if (loading && totalCount === 0) return <LoadingState rows={6} />
    const table = <ActiveConferenceTable data={data} loading={loading || searching} showAll={showAll} onView={handleView} />
    // A pending (debouncing) search is never treated as an empty result.
    if (searching) return table
    if (totalCount === 0) return <EmptyState description="No data found" />
    if (data.length === 0) return <EmptyState description="No active conferences match your search." />
    return table
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Active Conferences"
        count={canView ? data.length : undefined}
        actions={[
          { key: 'conferences', label: 'View Conference List', icon: <AudioOutlined />, onClick: () => navigate(CONFERENCES_PATH) },
        ]}
        filters={
          canView && (
            <>
              <Tooltip title="Reset">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset search" />
              </Tooltip>
              <ActiveConferenceFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />
              {canShowAll && (
                <Tooltip title="Show active conferences across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all active conferences" />
                    <span>Show All</span>
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

export default ActiveConferencesPage
