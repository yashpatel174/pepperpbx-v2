import { lazy } from 'react'
import { AppstoreOutlined, ControlOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Conference Controls configuration: list, Add, Edit (with DTMF rows) and toggle only
 * (conference-controls.md). No Delete, Copy, Import/Export or realtime — the audit confirms none
 * exist. The `/conferenceControls/...` paths and the query-string Edit route
 * (`/edit?conference_control_uuid=`) are Axion's and are kept on purpose (§1).
 */
const ConferenceControlsPage = lazy(() => import('./pages/ConferenceControlsPage'))
const AddConferenceControlPage = lazy(() => import('./pages/AddConferenceControlPage'))
const EditConferenceControlPage = lazy(() => import('./pages/EditConferenceControlPage'))

const conferenceControlsRoutes: AdminRouterItem[] = [
  {
    path: 'conferenceControls/list',
    element: (
      <LazyRoute>
        <ConferenceControlsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Conference Controls',
      title: 'Conference Controls',
      key: '/conferenceControls/list',
      // Axion has `icon: null` here (§1); PepperPBX gives every sidebar entry an icon.
      icon: <ControlOutlined />,
      order: 8,
      hideBreadcrumb: true,
      // Applications → Conference Controls (§1), after Conference Rooms.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'conferenceControls/add',
    element: (
      <LazyRoute>
        <AddConferenceControlPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Conference Control',
      key: '/conferenceControls/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'conferenceControls/edit',
    element: (
      <LazyRoute>
        <EditConferenceControlPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Conference Control',
      key: '/conferenceControls/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default conferenceControlsRoutes
