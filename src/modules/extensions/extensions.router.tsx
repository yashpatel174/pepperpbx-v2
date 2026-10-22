import { lazy } from 'react'
import { ApartmentOutlined, PhoneOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const ExtensionsPage = lazy(() => import('./pages/ExtensionsPage'))
const AddExtensionPage = lazy(() => import('./pages/AddExtensionPage'))
const EditExtensionPage = lazy(() => import('./pages/EditExtensionPage'))

const extensionsRoutes: AdminRouterItem[] = [
  {
    path: 'account/extensions',
    element: (
      <LazyRoute>
        <ExtensionsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Extensions',
      title: 'Extensions',
      key: '/account/extensions',
      icon: <PhoneOutlined />,
      order: 1,
      hideBreadcrumb: true,
      // Groups this route under a shared "Account" parent menu entry instead of nesting it
      // in the actual route tree. Future modules (e.g. Gateways) reuse the same group.key
      // to land under the same "Account" parent — see Sidebar.tsx's getMenuItems.
      group: {
        key: 'account',
        label: 'Account',
        icon: <ApartmentOutlined />,
        order: 2,
      },
    },
  },
  {
    path: 'account/extensions/add',
    element: (
      <LazyRoute>
        <AddExtensionPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Extension',
      key: '/account/extensions/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'account/extensions/:extensionId/edit',
    element: (
      <LazyRoute>
        <EditExtensionPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Extension',
      key: '/account/extensions/:extensionId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default extensionsRoutes
