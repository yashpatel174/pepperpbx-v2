import { lazy } from 'react'
import { DashboardOutlined, WifiOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Registrations — read-only monitor (registrations.md §1): a single flat list route, no
 * add/edit/delete routes. Lives in the shared "Status" sidebar group.
 */
const RegistrationsPage = lazy(() => import('./pages/RegistrationsPage'))

const registrationsRoutes: AdminRouterItem[] = [
  {
    path: 'registrations/list',
    element: (
      <LazyRoute>
        <RegistrationsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Registrations',
      title: 'Registrations',
      key: '/registrations/list',
      icon: <WifiOutlined />,
      // Follows Active Call Center (0), Active Conferences (1), Call Center Agents (2) and Active Calls (3) in the Status group.
      order: 4,
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

export default registrationsRoutes
