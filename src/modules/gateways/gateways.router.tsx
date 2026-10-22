import { lazy } from 'react'
import { ApartmentOutlined, ApiOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const GatewaysPage = lazy(() => import('./pages/GatewaysPage'))
const AddGatewayPage = lazy(() => import('./pages/AddGatewayPage'))
const EditGatewayPage = lazy(() => import('./pages/EditGatewayPage'))

const gatewaysRoutes: AdminRouterItem[] = [
  {
    path: 'account/gateways',
    element: (
      <LazyRoute>
        <GatewaysPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Gateways',
      title: 'Gateways',
      key: '/account/gateways',
      icon: <ApiOutlined />,
      order: 2,
      hideBreadcrumb: true,
      // Reuses the same group.key as Extensions' "Account" entry so both land under one shared
      // sidebar parent without either module nesting in the actual route tree — see
      // extensions.router.tsx and Sidebar.tsx's getMenuItems.
      group: {
        key: 'account',
        label: 'Account',
        icon: <ApartmentOutlined />,
        order: 2,
      },
    },
  },
  {
    path: 'account/gateways/add',
    element: (
      <LazyRoute>
        <AddGatewayPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Gateway',
      key: '/account/gateways/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'account/gateways/:gatewayUuid/edit',
    element: (
      <LazyRoute>
        <EditGatewayPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Gateway',
      key: '/account/gateways/:gatewayUuid/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default gatewaysRoutes
