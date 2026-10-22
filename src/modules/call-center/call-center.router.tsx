import { lazy } from 'react'
import { AppstoreOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * SCOPE: this module implements the Call Center Queue CRUD half of Axion's `callCenter` module
 * (list/add/edit/copy/delete + Start/Stop/Restart). Axion's Agent entity sub-screens (Agent
 * list/add/edit/delete + Agent Status, gated by the distinct `AGENT_PERMISSION` model) are the
 * separate `call-center-agents` module, reached from this list's "Agents" button
 * (`/call-center/agents`). Axion's non-functional Activity placeholder screen is deliberately not
 * reproduced (call-center.md §28/§33 documents it as hardcoded-empty and recommends implementing it
 * for real or removing it).
 */
const CallCentersPage = lazy(() => import('./pages/CallCentersPage'))
const AddCallCenterPage = lazy(() => import('./pages/AddCallCenterPage'))
const EditCallCenterPage = lazy(() => import('./pages/EditCallCenterPage'))

const callCenterRoutes: AdminRouterItem[] = [
  {
    path: 'call-center',
    element: (
      <LazyRoute>
        <CallCentersPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Call Centers',
      title: 'Call Centers',
      key: '/call-center',
      icon: <CustomerServiceOutlined />,
      order: 3,
      hideBreadcrumb: true,
      // Reuses Announcements'/Call Block's group.key so all three land under one shared
      // "Applications" sidebar parent without nesting in the actual route tree — matches the
      // audit's own "Applications → Call Centers" category (call-center.md §1).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'call-center/add',
    element: (
      <LazyRoute>
        <AddCallCenterPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Call Center Queue',
      key: '/call-center/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-center/:callCenterId/edit',
    element: (
      <LazyRoute>
        <EditCallCenterPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Call Center Queue',
      key: '/call-center/:callCenterId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default callCenterRoutes
