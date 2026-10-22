import { lazy } from 'react'
import { AppstoreOutlined, ForkOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Call Flows (call-flows.md): list, Add, Edit (read-only for view-only users), Copy, Delete and the
 * two flag toggles. No Import/Export, bulk Copy or realtime view — the audit confirms none exist.
 * Routes follow PepperPBX's `/<module>`, `/<module>/add`, `/<module>/:id/edit` convention rather
 * than Axion's `/callflows/edit?call-flows-uuid=`.
 */
const CallFlowsPage = lazy(() => import('./pages/CallFlowsPage'))
const AddCallFlowPage = lazy(() => import('./pages/AddCallFlowPage'))
const EditCallFlowPage = lazy(() => import('./pages/EditCallFlowPage'))

const callFlowsRoutes: AdminRouterItem[] = [
  {
    path: 'call-flows',
    element: (
      <LazyRoute>
        <CallFlowsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Call Flows',
      title: 'Call Flows',
      key: '/call-flows',
      icon: <ForkOutlined />,
      order: 10,
      hideBreadcrumb: true,
      // Applications → Call Flows (§1), after Conference Profiles as in Axion's siteMaps.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'call-flows/add',
    element: (
      <LazyRoute>
        <AddCallFlowPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Call Flow',
      key: '/call-flows/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-flows/:callFlowId/edit',
    element: (
      <LazyRoute>
        <EditCallFlowPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Call Flow',
      key: '/call-flows/:callFlowId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default callFlowsRoutes
