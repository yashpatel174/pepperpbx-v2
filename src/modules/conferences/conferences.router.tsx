import { lazy } from 'react'
import { AppstoreOutlined, AudioOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * SCOPE: this module implements only the Conferences configuration CRUD (list/add/edit/copy/
 * delete/toggle) documented in conferences.md — it deliberately does NOT implement Active
 * Conferences (a separate realtime/monitoring module with its own permission model, conferences.md
 * §14/§23/§30/§33) or any of the four sibling configuration modules (Conference Centers/Rooms/
 * Controls/Profiles, §14/§30) that happen to share the same Axion permission keys. See the list
 * page's "Active Conferences" button for the isolated, clearly-pending cross-module navigation
 * link.
 */
const ConferencesPage = lazy(() => import('./pages/ConferencesPage'))
const AddConferencePage = lazy(() => import('./pages/AddConferencePage'))
const EditConferencePage = lazy(() => import('./pages/EditConferencePage'))

const conferencesRoutes: AdminRouterItem[] = [
  {
    path: 'conferences',
    element: (
      <LazyRoute>
        <ConferencesPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Conferences',
      title: 'Conferences',
      key: '/conferences',
      icon: <AudioOutlined />,
      order: 5,
      hideBreadcrumb: true,
      // Reuses Call Center's/Announcements'/Call Block's group.key so all land under one shared
      // "Applications" sidebar parent without nesting in the actual route tree — matches the
      // audit's own "Applications → Conferences" category (conferences.md §1).
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'conferences/add',
    element: (
      <LazyRoute>
        <AddConferencePage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Conference',
      key: '/conferences/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'conferences/:conferenceId/edit',
    element: (
      <LazyRoute>
        <EditConferencePage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Conference',
      key: '/conferences/:conferenceId/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default conferencesRoutes
