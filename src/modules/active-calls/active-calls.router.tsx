import { lazy } from 'react'
import { DashboardOutlined, PhoneOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Active Calls — read-only monitor (active-calls.md §1): a single flat list route, no
 * add/edit/delete routes. Lives in the shared "Status" sidebar group.
 */
const ActiveCallsPage = lazy(() => import('./pages/ActiveCallsPage'))

const activeCallsRoutes: AdminRouterItem[] = [
  {
    path: 'activecalls/list',
    element: (
      <LazyRoute>
        <ActiveCallsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Active Calls',
      title: 'Active Calls',
      key: '/activecalls/list',
      icon: <PhoneOutlined />,
      // Follows Active Call Center (0), Active Conferences (1) and Call Center Agents (2) in the Status group.
      order: 3,
      hideBreadcrumb: true,
      group: {
        key: 'status',
        label: 'Status',
        icon: <DashboardOutlined />,
        order: 5,
      },
    },
  },
]

export default activeCallsRoutes
