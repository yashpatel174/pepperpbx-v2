import { lazy } from 'react'
import { AppstoreOutlined, ClusterOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Conference Centers configuration CRUD only (conference-centers.md). No Copy, Import/Export or
 * realtime — the audit confirms none exist for this module. Conference Rooms and Active
 * Conferences are separate modules, reached from the list's toolbar buttons.
 */
const ConferenceCentersPage = lazy(() => import('./pages/ConferenceCentersPage'))
const AddConferenceCenterPage = lazy(() => import('./pages/AddConferenceCenterPage'))
const EditConferenceCenterPage = lazy(() => import('./pages/EditConferenceCenterPage'))

const conferenceCentersRoutes: AdminRouterItem[] = [
  {
    path: 'conference-centers',
    element: (
      <LazyRoute>
        <ConferenceCentersPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Conference Centers',
      title: 'Conference Centers',
      key: '/conference-centers',
      icon: <ClusterOutlined />,
      order: 6,
      hideBreadcrumb: true,
      // Same group key as the other Applications modules (conference-centers.md §1).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'conference-centers/add',
    element: (
      <LazyRoute>
        <AddConferenceCenterPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Conference Center',
      key: '/conference-centers/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'conference-centers/:conferenceCenterId/edit',
    element: (
      <LazyRoute>
        <EditConferenceCenterPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Conference Center',
      key: '/conference-centers/:conferenceCenterId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default conferenceCentersRoutes
