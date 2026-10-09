import { lazy } from 'react'
import { AppstoreOutlined, MailOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

const VoicemailsPage = lazy(() => import('./pages/VoicemailsPage'))
const AddVoicemailPage = lazy(() => import('./pages/AddVoicemailPage'))
const EditVoicemailPage = lazy(() => import('./pages/EditVoicemailPage'))
const ImportMatchVoicemailPage = lazy(() => import('./pages/ImportMatchVoicemailPage'))
const VoicemailMessagesPage = lazy(() => import('./pages/VoicemailMessagesPage'))
const VoicemailGreetingsPage = lazy(() => import('./pages/VoicemailGreetingsPage'))

const voicemailRoutes: AdminRouterItem[] = [
  {
    path: 'voicemail',
    element: (
      <LazyRoute>
        <VoicemailsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Voicemail',
      title: 'Voicemail',
      key: '/voicemail',
      icon: <MailOutlined />,
      order: 13,
      hideBreadcrumb: true,
      // Shares the "Applications" sidebar group with Announcements/Call Block/etc. — same group.key,
      // without nesting in the route tree. Path is kebab-case singular, matching this project's
      // convention rather than Axion's `/voicemails/list`.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'voicemail/add',
    element: (
      <LazyRoute>
        <AddVoicemailPage />
      </LazyRoute>
    ),
    meta: { title: 'Add Voicemail', key: '/voicemail/add', hideInMenu: true, hideBreadcrumb: true },
  },
  {
    path: 'voicemail/import-match',
    element: (
      <LazyRoute>
        <ImportMatchVoicemailPage />
      </LazyRoute>
    ),
    meta: { title: 'Import Voicemail — Match Fields', key: '/voicemail/import-match', hideInMenu: true, hideBreadcrumb: true },
  },
  {
    // Mailbox context travels in `?voicemail-uuid=&voicemail-id=` (voicemail.md §3); both required.
    path: 'voicemail/messages',
    element: (
      <LazyRoute>
        <VoicemailMessagesPage />
      </LazyRoute>
    ),
    meta: { title: 'Voicemail Messages', key: '/voicemail/messages', hideInMenu: true, hideBreadcrumb: true },
  },
  {
    path: 'voicemail/greetings',
    element: (
      <LazyRoute>
        <VoicemailGreetingsPage />
      </LazyRoute>
    ),
    meta: { title: 'Voicemail Greetings', key: '/voicemail/greetings', hideInMenu: true, hideBreadcrumb: true },
  },
  {
    path: 'voicemail/:voicemailId/edit',
    element: (
      <LazyRoute>
        <EditVoicemailPage />
      </LazyRoute>
    ),
    meta: { title: 'Edit Voicemail', key: '/voicemail/:voicemailId/edit', hideInMenu: true, hideBreadcrumb: true },
  },
]

export default voicemailRoutes
