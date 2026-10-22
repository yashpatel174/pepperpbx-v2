import { lazy } from 'react'
import { AppstoreOutlined, StopOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const CallBlocksPage = lazy(() => import('./pages/CallBlocksPage'))
const AddCallBlockPage = lazy(() => import('./pages/AddCallBlockPage'))
const EditCallBlockPage = lazy(() => import('./pages/EditCallBlockPage'))

const callBlockRoutes: AdminRouterItem[] = [
  {
    path: 'call-block',
    element: (
      <LazyRoute>
        <CallBlocksPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Call Block',
      title: 'Call Block',
      key: '/call-block',
      icon: <StopOutlined />,
      order: 2,
      hideBreadcrumb: true,
      // Reuses Announcements' group.key so both land under one shared "Applications" sidebar
      // parent without either module nesting in the actual route tree — matches the audit's own
      // "Applications → Call Block" category (call-block.md §1) — see announcements.router.tsx
      // and Sidebar.tsx's getMenuItems. Route path/name is kebab-case ("call-block"), matching
      // this project's own multi-word module naming convention rather than Axion's literal
      // un-hyphenated `/callblock`.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'call-block/add',
    element: (
      <LazyRoute>
        <AddCallBlockPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Call Block',
      key: '/call-block/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'call-block/:callBlockId/edit',
    element: (
      <LazyRoute>
        <EditCallBlockPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Call Block',
      key: '/call-block/:callBlockId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default callBlockRoutes
