import { lazy } from 'react'
import { AppstoreOutlined, ApartmentOutlined } from '@ant-design/icons'
import type { AdminRouterItem } from '../../router'
import LazyRoute from '../../components/common/LazyRoute'

/**
 * Conference Rooms configuration CRUD only (conference-rooms.md). No Copy, Import/Export or
 * realtime — the audit confirms none exist for this module. The `conferenceCenters/conferenceRooms/`
 * namespace and the query-string Edit route (`/edit?conference_room_uuid=`) are Axion's and are
 * kept on purpose (§1/§33).
 */
const ConferenceRoomsPage = lazy(() => import('./pages/ConferenceRoomsPage'))
const AddConferenceRoomPage = lazy(() => import('./pages/AddConferenceRoomPage'))
const EditConferenceRoomPage = lazy(() => import('./pages/EditConferenceRoomPage'))

const conferenceRoomsRoutes: AdminRouterItem[] = [
  {
    path: 'conferenceCenters/conferenceRooms/list',
    element: (
      <LazyRoute>
        <ConferenceRoomsPage />
      </LazyRoute>
    ),
    meta: {
      label: 'Conference Rooms',
      title: 'Conference Rooms',
      key: '/conferenceCenters/conferenceRooms/list',
      icon: <ApartmentOutlined />,
      order: 7,
      hideBreadcrumb: true,
      // Applications → Conference Rooms (§1), next to Conference Centers.
      group: {
        key: 'applications',
        label: 'Applications',
        icon: <AppstoreOutlined />,
        order: 4,
      },
    },
  },
  {
    path: 'conferenceCenters/conferenceRooms/add',
    element: (
      <LazyRoute>
        <AddConferenceRoomPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Add Conference Room',
      key: '/conferenceCenters/conferenceRooms/add',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
  {
    path: 'conferenceCenters/conferenceRooms/edit',
    element: (
      <LazyRoute>
        <EditConferenceRoomPage />
      </LazyRoute>
    ),
    meta: {
      title: 'Edit Conference Room',
      key: '/conferenceCenters/conferenceRooms/edit',
      hideInMenu: true,
      hideBreadcrumb: true,
    },
  },
]

export default conferenceRoomsRoutes
