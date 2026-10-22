import { lazy } from 'react'
import { AppstoreOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const MusicOnHoldPage = lazy(() => import('./pages/MusicOnHoldPage'))
const EditMusicOnHoldPage = lazy(() => import('./pages/EditMusicOnHoldPage'))

const musicOnHoldRoutes: AdminRouterItem[] = [
  {
    path: 'applications/music-on-hold',
    element: (
      <LazyRoute>
        <MusicOnHoldPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Music On Hold',
      title: 'Music On Hold',
      key: '/applications/music-on-hold',
      icon: <CustomerServiceOutlined />,
      order: 15,
      hideBreadcrumb: true,
      // Shares the "Applications" sidebar group with Announcements/Voicemail/Recordings — same
      // group.key, without nesting in the route tree. There is deliberately no `/add` route: Add is
      // a popup on the list (music-on-hold.md §1/§3).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'applications/music-on-hold/:categoryUuid/edit',
    element: (
      <LazyRoute>
        <EditMusicOnHoldPage />
      </LazyRoute>
    ),
    meta: { title: 'Edit Music On Hold', key: '/applications/music-on-hold/:categoryUuid/edit', hideInMenu: true, hideBreadcrumb: true },
  },
]

export default musicOnHoldRoutes
