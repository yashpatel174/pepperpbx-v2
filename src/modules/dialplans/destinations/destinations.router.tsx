import { lazy } from 'react'
import { AimOutlined, NodeIndexOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../../router'
import LazyRoute from '../../../components/common/LazyRoute'

const DestinationsPage = lazy(() => import('./pages/DestinationsPage'))
const AddDestinationPage = lazy(() => import('./pages/AddDestinationPage'))
const EditDestinationPage = lazy(() => import('./pages/EditDestinationPage'))
const ImportMatchDestinationPage = lazy(() => import('./pages/ImportMatchDestinationPage'))

const destinationsRoutes: AdminRouterItem[] = [
  {
    path: 'dialplans/destinations',
    element: (
      <LazyRoute>
        <DestinationsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Destinations',
      title: 'Destinations',
      key: '/dialplans/destinations',
      icon: <AimOutlined />,
      order: 1,
      hideBreadcrumb: true,
      // Groups this route under a shared "Dialplans" parent menu entry — future Dialplan
      // modules (e.g. Time Conditions, IVR) can reuse the same group.key to land under the
      // same parent without nesting in the actual route tree. See extensions.router.tsx and
      // Sidebar.tsx's getMenuItems for the same pattern applied to "Account".
      group: {
        key: 'dialplans',
        label: 'Dialplans',
        icon: <NodeIndexOutlined />,
        order: 3,
      },
    },
  },
  {
    path: 'dialplans/destinations/add',
    element: (
      <LazyRoute>
        <AddDestinationPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Destination',
      key: '/dialplans/destinations/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'dialplans/destinations/:destinationId/edit',
    element: (
      <LazyRoute>
        <EditDestinationPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Destination',
      key: '/dialplans/destinations/:destinationId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'dialplans/destinations/import-match',
    element: (
      <LazyRoute>
        <ImportMatchDestinationPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Import Destinations — Match Fields',
      key: '/dialplans/destinations/import-match',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default destinationsRoutes
