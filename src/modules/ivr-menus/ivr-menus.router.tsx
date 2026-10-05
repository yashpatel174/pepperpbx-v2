import { lazy } from 'react'
import { AppstoreOutlined, PartitionOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * IVR Menus (ivr-menus.md): list, Add, Edit (read-only for view-only users), Copy, Delete and
 * Toggle. No Import/Export or realtime view — the audit confirms none exist. Axion's dead
 * `Old_EditIVRMenus.js` Dialplan XML editor is intentionally not ported (§2/§28).
 * Routes follow PepperPBX's `/<module>`, `/<module>/add`, `/<module>/:id/edit` convention rather
 * than Axion's `/ivrMenus/edit?ivr_menu_uuid=`.
 */
const IVRMenusPage = lazy(() => import('./pages/IVRMenusPage'))
const AddIVRMenuPage = lazy(() => import('./pages/AddIVRMenuPage'))
const EditIVRMenuPage = lazy(() => import('./pages/EditIVRMenuPage'))

const ivrMenusRoutes: AdminRouterItem[] = [
  {
    path: 'ivr-menus',
    element: (
      <LazyRoute>
        <IVRMenusPage />
      </LazyRoute>
    ),
    meta: {
      label: 'IVR Menus',
      title: 'IVR Menus',
      key: '/ivr-menus',
      icon: <PartitionOutlined />,
      order: 11,
      hideBreadcrumb: true,
      // Applications → IVR Menus (§1), after Call Flows as in Axion's siteMaps.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'ivr-menus/add',
    element: (
      <LazyRoute>
        <AddIVRMenuPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add IVR Menu',
      key: '/ivr-menus/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'ivr-menus/:ivrMenuId/edit',
    element: (
      <LazyRoute>
        <EditIVRMenuPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit IVR Menu',
      key: '/ivr-menus/:ivrMenuId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default ivrMenusRoutes
