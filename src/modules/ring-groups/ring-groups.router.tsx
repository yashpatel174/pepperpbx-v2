import { lazy } from 'react'
import { AppstoreOutlined, TeamOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Ring Groups (ring-groups.md): list, Add, Edit (read-only for view-only users), Copy, Delete,
 * Status toggle (row + bulk). No Import/Export, bulk Copy or realtime view — the audit confirms none
 * exist. Routes follow PepperPBX's `/<module>`, `/<module>/add`, `/<module>/:id/edit` convention
 * rather than Axion's `/ring-groups/list` and `/ring-groups/edit?ring_group_uuid=`.
 */
const RingGroupsPage = lazy(() => import('./pages/RingGroupsPage'))
const AddRingGroupPage = lazy(() => import('./pages/AddRingGroupPage'))
const EditRingGroupPage = lazy(() => import('./pages/EditRingGroupPage'))

const ringGroupsRoutes: AdminRouterItem[] = [
  {
    path: 'ring-groups',
    element: (
      <LazyRoute>
        <RingGroupsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Ring Groups',
      title: 'Ring Groups',
      key: '/ring-groups',
      icon: <TeamOutlined />,
      order: 11,
      hideBreadcrumb: true,
      // Applications → Ring Groups (§1), after the most recently added Applications entry.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'ring-groups/add',
    element: (
      <LazyRoute>
        <AddRingGroupPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Ring Group',
      key: '/ring-groups/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'ring-groups/:ringGroupId/edit',
    element: (
      <LazyRoute>
        <EditRingGroupPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Ring Group',
      key: '/ring-groups/:ringGroupId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default ringGroupsRoutes
