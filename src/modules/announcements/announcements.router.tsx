import { lazy } from 'react'
import { AppstoreOutlined, SoundOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'))
const AddAnnouncementPage = lazy(() => import('./pages/AddAnnouncementPage'))
const EditAnnouncementPage = lazy(() => import('./pages/EditAnnouncementPage'))

const announcementsRoutes: AdminRouterItem[] = [
  {
    path: 'announcements',
    element: (
      <LazyRoute>
        <AnnouncementsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Announcements',
      title: 'Announcements',
      key: '/announcements',
      icon: <SoundOutlined />,
      order: 1,
      hideBreadcrumb: true,
      // New top-level sidebar group — the audit's own siteMaps.js category is "Applications →
      // Announcements" (announcements.md §1), distinct from Extensions'/Gateways' "Account" group
      // and Destinations'/Outbound Routes' "Dialplans" group. Placed after those existing groups
      // (order: 4) so it doesn't reorder anything already registered.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'announcements/add',
    element: (
      <LazyRoute>
        <AddAnnouncementPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Announcement',
      key: '/announcements/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'announcements/:announcementId/edit',
    element: (
      <LazyRoute>
        <EditAnnouncementPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Announcement',
      key: '/announcements/:announcementId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default announcementsRoutes
