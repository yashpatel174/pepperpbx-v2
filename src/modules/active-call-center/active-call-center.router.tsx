import { lazy } from 'react'
import { CustomerServiceOutlined, DashboardOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Active Call Center — read-only queue monitor (active-call-center.md). Two routes: the Queue List
 * and one queue's Activity. The Activity route has no menu entry; it is reached from a list row's
 * View action (§1). No add/edit/delete routes exist for this module.
 */
const ActiveCallCentersPage = lazy(() => import('./pages/ActiveCallCentersPage'))
const QueueActivityPage = lazy(() => import('./pages/QueueActivityPage'))

const activeCallCenterRoutes: AdminRouterItem[] = [
  {
    path: 'activeCallCenter/list',
    element: (
      <LazyRoute>
        <ActiveCallCentersPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Active Call Center',
      title: 'Active Call Center',
      key: '/activeCallCenter/list',
      icon: <CustomerServiceOutlined />,
      // First item of the audit's "Status" group (active-call-center.md §1); Active Conferences
      // (order 1) and later Status modules follow it.
      order: 0,
      hideBreadcrumb: true,
      group: {
        key: 'status',
        label: 'Status',
        icon: <DashboardOutlined />,
        order: 5,
      },
    },
  },
  {
    path: 'activeCallCenter/activity',
    element: (
      <LazyRoute>
        <QueueActivityPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Queue Activity',
      key: '/activeCallCenter/activity',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default activeCallCenterRoutes
