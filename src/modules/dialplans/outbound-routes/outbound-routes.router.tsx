import { lazy } from 'react'
import { NodeIndexOutlined, ShareAltOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../../router'
import LazyRoute from '../../../components/common/LazyRoute'

const OutboundRoutesPage = lazy(() => import('./pages/OutboundRoutesPage'))
const AddOutboundRoutePage = lazy(() => import('./pages/AddOutboundRoutePage'))
const EditOutboundRoutePage = lazy(() => import('./pages/EditOutboundRoutePage'))
const DialplanXmlPage = lazy(() => import('./pages/DialplanXmlPage'))

const outboundRoutesRoutes: AdminRouterItem[] = [
  {
    path: 'dialplans/outbound-routes',
    element: (
      <LazyRoute>
        <OutboundRoutesPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Outbound Routes',
      title: 'Outbound Routes',
      key: '/dialplans/outbound-routes',
      icon: <ShareAltOutlined />,
      order: 2,
      hideBreadcrumb: true,
      // Reuses Destinations' group.key so both land under one shared "Dialplans" sidebar parent
      // without either module nesting in the actual route tree — see destinations.router.tsx and
      // Sidebar.tsx's getMenuItems.
      group: {
        key: 'dialplans',
        label: 'Dialplans',
        icon: <NodeIndexOutlined />,
        order: 3,
      },
    },
  },
  {
    path: 'dialplans/outbound-routes/add',
    element: (
      <LazyRoute>
        <AddOutboundRoutePage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Outbound Route',
      key: '/dialplans/outbound-routes/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'dialplans/outbound-routes/:routeId/edit',
    element: (
      <LazyRoute>
        <EditOutboundRoutePage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Outbound Route',
      key: '/dialplans/outbound-routes/:routeId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'dialplans/outbound-routes/:routeId/xml',
    element: (
      <LazyRoute>
        <DialplanXmlPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Dialplan XML',
      key: '/dialplans/outbound-routes/:routeId/xml',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default outboundRoutesRoutes
