import { lazy } from 'react'
import { AppstoreOutlined, SlidersOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Conference Profiles configuration: list, Add, Edit (with profile-parameter rows) and toggle only
 * (conference-profiles.md). No Delete, Copy, Import/Export or realtime — the audit confirms none
 * exist. The `/conferenceProfiles/...` paths and the query-string Edit route
 * (`/edit?conference_profile_uuid=`) are Axion's and are kept on purpose (§1).
 */
const ConferenceProfilesPage = lazy(() => import('./pages/ConferenceProfilesPage'))
const AddConferenceProfilePage = lazy(() => import('./pages/AddConferenceProfilePage'))
const EditConferenceProfilePage = lazy(() => import('./pages/EditConferenceProfilePage'))

const conferenceProfilesRoutes: AdminRouterItem[] = [
  {
    path: 'conferenceProfiles/list',
    element: (
      <LazyRoute>
        <ConferenceProfilesPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Conference Profiles',
      title: 'Conference Profiles',
      key: '/conferenceProfiles/list',
      // Axion has `icon: null` here (§1); PepperPBX gives every sidebar entry an icon.
      icon: <SlidersOutlined />,
      order: 9,
      hideBreadcrumb: true,
      // Applications → Conference Profiles (§1), after Conference Controls.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'conferenceProfiles/add',
    element: (
      <LazyRoute>
        <AddConferenceProfilePage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Conference Profile',
      key: '/conferenceProfiles/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'conferenceProfiles/edit',
    element: (
      <LazyRoute>
        <EditConferenceProfilePage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Conference Profile',
      key: '/conferenceProfiles/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default conferenceProfilesRoutes
