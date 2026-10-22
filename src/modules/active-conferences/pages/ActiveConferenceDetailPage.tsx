import { useMemo } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Space, Typography } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'
import ModuleHeader from '../../../components/common/ModuleHeader'
import EmptyState from '../../../components/feedback/EmptyState'
import PermissionDenied from '../../../components/feedback/PermissionDenied'
import ActiveConferenceDetailTable from '../components/ActiveConferenceDetailTable'
import { ACTIVE_CONFERENCES_PATH } from '../active-conferences.constants'
import { isDetailState, toMemberRows } from '../active-conferences.utils'
import useActiveConferencePermissions from '../useActiveConferencePermissions'

/**
 * Member list of one active conference (active-conferences.md §3/§4). Reached only from the
 * list's View action, which hands over the conference snapshot in router state. Without that state
 * (deep link / page reload) there's no confirmed endpoint to load a single conference from, so it
 * redirects to the list — Axion instead rendered a 403/empty page there (§28).
 */
const ActiveConferenceDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { conferenceName } = useParams()
  const { canView } = useActiveConferencePermissions()

  const initial = isDetailState(location.state) && location.state.conference.conference_name === conferenceName ? location.state.conference : null
  // Realtime updates aren't wired, so this is the member snapshot handed over by the list.
  const members = initial?.members
  const rows = useMemo(() => toMemberRows(members ?? []), [members])

  if (!initial) return <Navigate to={ACTIVE_CONFERENCES_PATH} replace />

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <ModuleHeader
        title="Interactive Conferences"
        count={canView ? rows.length : undefined}
        actions={[
          {
            key: 'list',
            label: 'View Active Conference List',
            icon: <UnorderedListOutlined />,
            onClick: () => navigate(ACTIVE_CONFERENCES_PATH),
          },
        ]}
        filters={<Typography.Text strong>{initial.conference_name}</Typography.Text>}
      />

      {!canView ? (
        <PermissionDenied />
      ) : rows.length === 0 ? (
        <EmptyState description="No members are currently in this conference." />
      ) : (
        <ActiveConferenceDetailTable data={rows} />
      )}
    </Space>
  )
}

export default ActiveConferenceDetailPage
