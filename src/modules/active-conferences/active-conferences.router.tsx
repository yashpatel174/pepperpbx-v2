import { lazy } from 'react'
import { DashboardOutlined, TeamOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Active Conferences — read-only realtime monitor (active-conferences.md). Exactly two routes:
 * the list and one conference's live members. No add/edit/delete routes exist for this module.
 */
const ActiveConferencesPage = lazy(() => import('./pages/ActiveConferencesPage'))
const ActiveConferenceDetailPage = lazy(() => import('./pages/ActiveConferenceDetailPage'))

const activeConferencesRoutes: AdminRouterItem[] = [
  {
    path: 'activeConferences/list',
    element: (
      <LazyRoute>
        <ActiveConferencesPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Active Conferences',
      title: 'Active Conferences',
      key: '/activeConferences/list',
      icon: <TeamOutlined />,
      order: 1,
      hideBreadcrumb: true,
      // First module of the audit's "Status" category (active-conferences.md §1); later Status
      // modules (Registrations, Active Calls, ...) should reuse this group key.
      group: {
        key: 'status',
        label: 'Status',
        icon: <DashboardOutlined />,
        order: 5,
      },
    },
  },
  {
    path: 'activeConferences/view/:conferenceName',
    element: (
      <LazyRoute>
        <ActiveConferenceDetailPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Active Conference',
      key: '/activeConferences/view/:conferenceName',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default activeConferencesRoutes
