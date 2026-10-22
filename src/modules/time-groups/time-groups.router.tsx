import { lazy } from 'react'
import { AppstoreOutlined, FieldTimeOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Time Groups (time-groups.md): list, Add, Edit (read-only for view-only users), Copy, Delete (row
 * + bulk). Routes follow PepperPBX's `/<module>`, `/<module>/add`, `/<module>/:id/edit` convention
 * rather than Axion's `/timegroups/edit?timegroup-uuid=`.
 *
 * The Presets sub-module (`/timegroups/presets/*`, §1) lives in `./presets/` with its own router,
 * reached from the list's Presets button.
 */
const TimeGroupsPage = lazy(() => import('./pages/TimeGroupsPage'))
const AddTimeGroupPage = lazy(() => import('./pages/AddTimeGroupPage'))
const EditTimeGroupPage = lazy(() => import('./pages/EditTimeGroupPage'))

const timeGroupsRoutes: AdminRouterItem[] = [
  {
    path: 'time-groups',
    element: (
      <LazyRoute>
        <TimeGroupsPage />
      </LazyRoute>
    ),
    meta: {
      // Axion's nav label (siteMaps.js, §1).
      label: 'Time Group',
      title: 'Time Groups',
      key: '/time-groups',
      icon: <FieldTimeOutlined />,
      order: 13,
      hideBreadcrumb: true,
      // Applications → Time Group (§1).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'time-groups/add',
    element: (
      <LazyRoute>
        <AddTimeGroupPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Time Group',
      key: '/time-groups/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'time-groups/:timeGroupId/edit',
    element: (
      <LazyRoute>
        <EditTimeGroupPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Time Group',
      key: '/time-groups/:timeGroupId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default timeGroupsRoutes
