import { lazy } from 'react'
import { AppstoreOutlined, AudioOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const RecordingsPage = lazy(() => import('./pages/RecordingsPage'))
const EditRecordingPage = lazy(() => import('./pages/EditRecordingPage'))

const recordingsRoutes: AdminRouterItem[] = [
  {
    path: 'recordings',
    element: (
      <LazyRoute>
        <RecordingsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Recordings',
      title: 'Recordings',
      key: '/recordings',
      icon: <AudioOutlined />,
      order: 14,
      hideBreadcrumb: true,
      // Shares the "Applications" sidebar group with Announcements/Voicemail/etc. — same group.key,
      // without nesting in the route tree. Path is kebab-case, matching this project's convention
      // rather than Axion's `/recordings/list`. There is deliberately no `/recordings/add` route:
      // Add is a modal on the list (recordings.md §3/§33).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'recordings/:recordingId/edit',
    element: (
      <LazyRoute>
        <EditRecordingPage />
      </LazyRoute>
    ),
    meta: { title: 'Edit Recording', key: '/recordings/:recordingId/edit', hideInMenu: true, hideBreadcrumb: true },
  },
]

export default recordingsRoutes
